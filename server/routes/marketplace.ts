import type { FastifyInstance } from 'fastify'
import { apiUrl, fetchClawHub } from '../clawhub/client.js'
import { resolveHttpRegistryBase } from '../marketplace/httpRegistry.js'
import { getMergedMarketplaceProviders } from '../marketplace/presets.js'

function rateLimitHint(): string {
  return (
    '注册表限流（请求过于频繁）。请稍等 1～2 分钟再试，或减少连续搜索/安装。' +
    '可在启动 Skill Hub 前设置环境变量 SKILL_HUB_CLAWHUB_TOKEN（与 clawhub CLI `login` 令牌一致，可能提高配额）。'
  )
}

export type MarketplaceSearchHit = {
  slug: string
  displayName: string
  summary: string | null
  score: number | null
  updatedAt: number | null
  registry: string
  providerId: string
  providerLabel: string
  webBase: string
}

export async function marketplaceRoutes(app: FastifyInstance) {
  app.get('/api/marketplace/providers', async () => {
    const providers = getMergedMarketplaceProviders()
    return { ok: true, providers }
  })

  /** Search ClawHub-compatible API (single official registry; `registries` values map to same base). */
  app.post<{
    Body: { q?: string; registries?: unknown; limit?: unknown }
  }>('/api/marketplace/search', async (req, reply) => {
    const q = String(req.body?.q ?? '').trim()
    if (!q) {
      return reply.status(400).send({ ok: false, error: '缺少搜索关键词 q' })
    }
    const rawRegs = req.body?.registries
    const registries = Array.isArray(rawRegs)
      ? rawRegs.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
      : []
    if (registries.length === 0) {
      return reply.status(400).send({ ok: false, error: '至少选择一个应用市场（registry）' })
    }
    const limit = Math.min(200, Math.max(1, parseInt(String(req.body?.limit ?? '30'), 10) || 30))

    const providers = getMergedMarketplaceProviders()
    const httpProviders = providers.filter((p) => p.kind === 'clawhub-http' && p.registry && p.webBase)

    const errors: { registry: string; message: string }[] = []
    const flat: MarketplaceSearchHit[] = []

    for (const regKey of registries) {
      const prov = httpProviders.find((p) => p.registry === regKey || p.id === regKey)
      if (!prov?.registry || !prov.webBase) {
        errors.push({ registry: regKey, message: '未知或未配置的应用市场' })
        continue
      }

    const rb = resolveHttpRegistryBase(prov.registry)
    const u = new URL(apiUrl('/api/v1/search', rb))
    u.searchParams.set('q', q)
    u.searchParams.set('limit', String(limit))

    const res = await fetchClawHub(u.pathname + u.search, { registryBase: rb })
    const text = await res.text()
    if (!res.ok) {
      errors.push({
        registry: regKey,
        message:
          res.status === 429
            ? rateLimitHint()
            : text.slice(0, 300) || `ClawHub 搜索失败 (${res.status})`,
      })
      continue
    }

    let data: { results?: Array<Record<string, unknown>> }
    try {
      data = JSON.parse(text) as { results?: Array<Record<string, unknown>> }
    } catch {
      errors.push({ registry: regKey, message: 'ClawHub 返回非 JSON' })
      continue
    }

    const results = Array.isArray(data.results) ? data.results : []
    for (const r of results) {
      const slug = typeof r.slug === 'string' ? r.slug : ''
      if (!slug) continue
      const score = typeof r.score === 'number' ? r.score : null
      const updatedAt = typeof r.updatedAt === 'number' ? r.updatedAt : null
      flat.push({
        slug,
        displayName: typeof r.displayName === 'string' ? r.displayName : slug,
        summary: typeof r.summary === 'string' ? r.summary : null,
        score,
        updatedAt,
        registry: prov.registry,
        providerId: prov.id,
        providerLabel: prov.label,
        webBase: prov.webBase.replace(/\/$/, ''),
      })
    }
    }

    // 去重策略（V1）：同一 slug 在不同 registry 各保留一行（方案 B：分开展示），便于安装/下载时 registry 明确。
    flat.sort((a, b) => {
      const sa = a.score ?? Number.NEGATIVE_INFINITY
      const sb = b.score ?? Number.NEGATIVE_INFINITY
      if (sb !== sa) return sb - sa
      return (b.updatedAt || 0) - (a.updatedAt || 0)
    })

    return {
      ok: true,
      results: flat,
      errors: errors.length > 0 ? errors : undefined,
    }
  })
}
