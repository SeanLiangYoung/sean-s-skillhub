import type { FastifyInstance } from 'fastify'
import path from 'path'
import fs from 'fs/promises'
import { extractClawHubZip } from '../clawhub/extract.js'
import { apiUrl, fetchClawHub } from '../clawhub/client.js'
import { parseRegistryId, resolveRegistryBase, type ClawHubRegistryId } from '../clawhub/registry.js'
import { globalSkillInstallDir, parseInstallTarget, type InstallAgentTarget } from '../installPaths.js'
import { invalidateCache } from './skills.js'

function isSafeSlug(slug: string): boolean {
  const s = slug.trim()
  if (!s || s.length > 200) return false
  if (s.includes('/') || s.includes('\\') || s.includes('..')) return false
  return true
}

/** Map UI sort → ClawHub /api/v1/skills `sort` param (see openclaw clawhub cmdExplore). */
/** When GET /api/v1/skills returns no rows (common for server-side/unauthenticated calls), browse uses search. */
const BROWSE_FALLBACK_SEARCH_Q = 'skill'

function mapSkillsSort(sort?: string): string | undefined {
  const n = sort?.trim().toLowerCase()
  if (!n || n === 'newest' || n === 'updated') return undefined
  const map: Record<string, string> = {
    downloads: 'downloads',
    download: 'downloads',
    rating: 'stars',
    stars: 'stars',
    star: 'stars',
    installs: 'installsCurrent',
    install: 'installsCurrent',
    installscurrent: 'installsCurrent',
    'installs-all-time': 'installsAllTime',
    installsalltime: 'installsAllTime',
    trending: 'trending',
  }
  return map[n || '']
}

function rateLimitHint(): string {
  return (
    '注册表限流（请求过于频繁）。请稍等 1～2 分钟再试，或减少连续搜索/安装。' +
    '可在启动 Skill Hub 前设置环境变量 SKILL_HUB_CLAWHUB_TOKEN（与 clawhub CLI `login` 令牌一致，可能提高配额）。'
  )
}

function rbFromQuery(registry: unknown): string {
  return resolveRegistryBase(parseRegistryId(registry))
}

export async function clawhubRoutes(app: FastifyInstance) {
  /** Proxy: GET /api/v1/search */
  app.get<{
    Querystring: { q?: string; limit?: string; registry?: string }
  }>('/api/clawhub/search', async (req, reply) => {
    const q = (req.query.q || '').trim()
    if (!q) {
      return reply.status(400).send({ ok: false, error: '缺少搜索关键词 q' })
    }
    const rb = rbFromQuery(req.query.registry)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '25', 10) || 25))
    const u = new URL(apiUrl('/api/v1/search', rb))
    u.searchParams.set('q', q)
    u.searchParams.set('limit', String(limit))

    const res = await fetchClawHub(u.pathname + u.search, { registryBase: rb })
    const text = await res.text()
    if (!res.ok) {
      return reply.status(res.status === 429 ? 429 : 502).send({
        ok: false,
        code: res.status === 429 ? 'RATE_LIMIT' : undefined,
        error:
          res.status === 429
            ? rateLimitHint()
            : text.slice(0, 500) || `ClawHub 搜索失败 (${res.status})`,
      })
    }
    try {
      const json = JSON.parse(text) as unknown
      return { ok: true, data: json }
    } catch {
      return reply.status(502).send({ ok: false, error: 'ClawHub 返回非 JSON' })
    }
  })

  /** Proxy: GET /api/v1/skills (browse / explore) */
  app.get<{
    Querystring: {
      limit?: string
      sort?: string
      cursor?: string
      nonSuspicious?: string
      registry?: string
    }
  }>('/api/clawhub/skills', async (req, reply) => {
    const rb = rbFromQuery(req.query.registry)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '25', 10) || 25))
    const u = new URL(apiUrl('/api/v1/skills', rb))
    u.searchParams.set('limit', String(limit))
    const apiSort = mapSkillsSort(req.query.sort)
    if (apiSort) u.searchParams.set('sort', apiSort)
    if (req.query.cursor) u.searchParams.set('cursor', req.query.cursor)
    if (req.query.nonSuspicious === 'true' || req.query.nonSuspicious === '1') {
      u.searchParams.set('nonSuspicious', 'true')
    }

    const trySkillsList = process.env.SKILL_HUB_CLAWHUB_TRY_SKILLS_LIST === '1'
    let items: unknown[] = []
    let nextCursor: string | null = null
    let resOk = true

    if (trySkillsList || req.query.cursor) {
      const res = await fetchClawHub(u.pathname + u.search, { registryBase: rb })
      const text = await res.text()
      resOk = res.ok
      if (!res.ok) {
        return reply.status(res.status === 429 ? 429 : 502).send({
          ok: false,
          code: res.status === 429 ? 'RATE_LIMIT' : undefined,
          error:
            res.status === 429
              ? rateLimitHint()
              : text.slice(0, 500) || `ClawHub 列表失败 (${res.status})`,
        })
      }
      try {
        const json = JSON.parse(text) as {
          items?: unknown[]
          nextCursor?: string | null
        }
        items = Array.isArray(json.items) ? json.items : []
        nextCursor =
          json.nextCursor === undefined || json.nextCursor === null ? null : String(json.nextCursor)
      } catch {
        return reply.status(502).send({ ok: false, error: 'ClawHub 返回非 JSON' })
      }
    }

    const useFallback = items.length === 0 && !req.query.cursor && resOk

    if (useFallback) {
      const su = new URL(apiUrl('/api/v1/search', rb))
      su.searchParams.set('q', BROWSE_FALLBACK_SEARCH_Q)
      su.searchParams.set('limit', String(limit))
      if (req.query.nonSuspicious === 'true' || req.query.nonSuspicious === '1') {
        su.searchParams.set('nonSuspicious', 'true')
      }
      const sRes = await fetchClawHub(su.pathname + su.search, { registryBase: rb })
      const sText = await sRes.text()
      if (!sRes.ok) {
        return reply.status(sRes.status === 429 ? 429 : 502).send({
          ok: false,
          code: sRes.status === 429 ? 'RATE_LIMIT' : undefined,
          error:
            sRes.status === 429
              ? rateLimitHint()
              : sText.slice(0, 500) || `ClawHub 浏览列表失败 (${sRes.status})`,
        })
      }
      try {
        const sjson = JSON.parse(sText) as {
          results?: Array<{
            slug?: string
            displayName?: string
            summary?: string | null
            version?: string | null
            updatedAt?: number
            score?: number
          }>
        }
        const results = Array.isArray(sjson.results) ? sjson.results : []
        items = results
          .filter((r) => r.slug)
          .map((r) => {
            const updatedAt = typeof r.updatedAt === 'number' ? r.updatedAt : Date.now()
            return {
              slug: String(r.slug),
              displayName: String(r.displayName || r.slug),
              summary: r.summary ?? null,
              tags: [],
              stats: {},
              createdAt: updatedAt,
              updatedAt,
              latestVersion: r.version
                ? {
                    version: r.version,
                    createdAt: updatedAt,
                    changelog: '',
                    license: null as const,
                  }
                : undefined,
            }
          })
        nextCursor = null

        const sortKey = mapSkillsSort(req.query.sort)
        if (!sortKey || sortKey === 'updated') {
          items = [...items].sort(
            (a: { updatedAt: number }, b: { updatedAt: number }) =>
              (b.updatedAt || 0) - (a.updatedAt || 0),
          )
        }
      } catch {
        return reply.status(502).send({ ok: false, error: 'ClawHub 浏览列表返回非 JSON' })
      }
    }

    return {
      ok: true,
      data: {
        items,
        nextCursor,
        browseFallback: useFallback && items.length > 0,
        browseFallbackNote:
          useFallback && items.length > 0
            ? trySkillsList
              ? `ClawHub 的 /api/v1/skills 未返回数据，已改用搜索「${BROWSE_FALLBACK_SEARCH_Q}」填充列表（排序与网站「浏览」可能不完全一致）。`
              : `已使用搜索「${BROWSE_FALLBACK_SEARCH_Q}」填充浏览列表（默认不请求 /api/v1/skills 以降低限流；如需先请求列表可设置 SKILL_HUB_CLAWHUB_TRY_SKILLS_LIST=1）。`
            : undefined,
      },
    }
  })

  /** Proxy: skill metadata (moderation, latest version) */
  app.get<{
    Params: { slug: string }
    Querystring: { registry?: string }
  }>('/api/clawhub/skill/:slug', async (req, reply) => {
    const slug = req.params.slug
    if (!isSafeSlug(slug)) {
      return reply.status(400).send({ ok: false, error: '非法 slug' })
    }
    const rb = rbFromQuery(req.query.registry)
    const res = await fetchClawHub(`/api/v1/skills/${encodeURIComponent(slug)}`, {
      registryBase: rb,
    })
    const text = await res.text()
    if (res.status === 404) {
      return reply.status(404).send({ ok: false, error: 'Skill 不存在' })
    }
    if (!res.ok) {
      return reply.status(res.status === 429 ? 429 : 502).send({
        ok: false,
        code: res.status === 429 ? 'RATE_LIMIT' : undefined,
        error:
          res.status === 429
            ? rateLimitHint()
            : text.slice(0, 500) || `ClawHub 查询失败 (${res.status})`,
      })
    }
    try {
      const json = JSON.parse(text) as unknown
      return { ok: true, data: json }
    } catch {
      return reply.status(502).send({ ok: false, error: 'ClawHub 返回非 JSON' })
    }
  })

  /** Install zip into ~/.claude/skills/<slug>/ or ~/.cursor/skills/<slug>/ */
  app.post<{
    Body: { slug?: string; version?: string; force?: boolean; target?: string; registry?: string }
  }>('/api/clawhub/install', async (req, reply) => {
    const slug = (req.body?.slug || '').trim()
    const versionFlag = req.body?.version?.trim()
    const force = Boolean(req.body?.force)
    const agent: InstallAgentTarget = parseInstallTarget(req.body?.target)
    const regId: ClawHubRegistryId = parseRegistryId(req.body?.registry)
    const rb = resolveRegistryBase(regId)

    if (!isSafeSlug(slug)) {
      return reply.status(400).send({ ok: false, error: '非法 slug' })
    }

    const metaRes = await fetchClawHub(`/api/v1/skills/${encodeURIComponent(slug)}`, {
      clawhubMemoryCache: false,
      registryBase: rb,
    })
    const metaText = await metaRes.text()
    if (metaRes.status === 404) {
      return reply.status(404).send({ ok: false, error: 'Skill 不存在' })
    }
    if (!metaRes.ok) {
      return reply.status(metaRes.status === 429 ? 429 : 502).send({
        ok: false,
        code: metaRes.status === 429 ? 'RATE_LIMIT' : undefined,
        error:
          metaRes.status === 429
            ? rateLimitHint()
            : metaText.slice(0, 300) || `无法获取元数据 (${metaRes.status})`,
      })
    }

    let meta: {
      moderation?: { isMalwareBlocked?: boolean; isSuspicious?: boolean } | null
      latestVersion?: { version: string } | null
    }
    try {
      meta = JSON.parse(metaText) as typeof meta
    } catch {
      return reply.status(502).send({ ok: false, error: '元数据解析失败' })
    }

    if (meta.moderation?.isMalwareBlocked) {
      return reply.status(403).send({
        ok: false,
        error: '该 Skill 已被标记为恶意，无法安装',
        code: 'MALWARE_BLOCKED',
      })
    }

    if (meta.moderation?.isSuspicious && !force) {
      return reply.status(409).send({
        ok: false,
        error:
          '该 Skill 被标记为可疑（ClawHub 审核）。若仍要安装，请确认已审阅源码并在请求中设置 force: true。',
        code: 'SUSPICIOUS',
      })
    }

    const resolvedVersion =
      versionFlag ||
      meta.latestVersion?.version ||
      null
    if (!resolvedVersion) {
      return reply.status(400).send({ ok: false, error: '无法解析版本号' })
    }

    if (versionFlag) {
      const vRes = await fetchClawHub(
        `/api/v1/skills/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionFlag)}`,
        { clawhubMemoryCache: false, registryBase: rb },
      )
      if (!vRes.ok) {
        return reply.status(400).send({ ok: false, error: '指定版本不存在' })
      }
    }

    const dl = new URL(apiUrl('/api/v1/download', rb))
    dl.searchParams.set('slug', slug)
    dl.searchParams.set('version', resolvedVersion)

    const zipRes = await fetchClawHub(dl.pathname + dl.search, {
      clawhubMemoryCache: false,
      registryBase: rb,
      headers: { Accept: 'application/zip, application/octet-stream, */*' },
    })
    if (!zipRes.ok) {
      const errText = await zipRes.text().catch(() => '')
      return reply.status(zipRes.status === 429 ? 429 : 502).send({
        ok: false,
        code: zipRes.status === 429 ? 'RATE_LIMIT' : undefined,
        error:
          zipRes.status === 429
            ? rateLimitHint()
            : errText.slice(0, 300) || `下载失败 (${zipRes.status})`,
      })
    }

    const buf = new Uint8Array(await zipRes.arrayBuffer())
    const targetDir = globalSkillInstallDir(agent, slug)

    await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {})
    await fs.mkdir(targetDir, { recursive: true })

    let filesWritten: number
    try {
      const r = await extractClawHubZip(buf, targetDir)
      filesWritten = r.filesWritten
    } catch (e: any) {
      await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {})
      return reply.status(500).send({
        ok: false,
        error: e?.message || '解压失败',
      })
    }
    if (filesWritten === 0) {
      await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {})
      return reply.status(500).send({ ok: false, error: '解压后无有效文件（可能 zip 为空或仅含超大文件）' })
    }

    const originDir = path.join(targetDir, '.clawhub')
    await fs.mkdir(originDir, { recursive: true })
    await fs.writeFile(
      path.join(originDir, 'origin.json'),
      `${JSON.stringify(
        {
          version: 1,
          registry: `${rb}/`,
          slug,
          installedVersion: resolvedVersion,
          installedAt: Date.now(),
        },
        null,
        2,
      )}\n`,
      'utf8',
    )

    invalidateCache()

    return {
      ok: true,
      targetDir,
      slug,
      version: resolvedVersion,
      filesWritten,
      agent,
      registryId: regId,
    }
  })
}
