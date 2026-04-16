import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MarketplaceProviderInfo } from '../types/marketplace'
import { MarketplacePageShell } from './marketplace/MarketplacePageShell'
import { MarketplaceRegistryBlock } from './marketplace/MarketplaceRegistryBlock'
import { MarketplaceFilterSection, MarketplaceFilterButton } from './marketplace/MarketplaceFilterPrimitives'
import { MarketplaceItemCard, MarketplaceSourcePill } from './marketplace/MarketplaceItemCard'

type SearchHit = {
  slug?: string
  displayName?: string
  summary?: string | null
  score?: number
  version?: string | null
  updatedAt?: number
}

type SkillItem = {
  slug: string
  displayName: string
  summary?: string | null
  updatedAt: number
  latestVersion?: { version: string } | null
  stats?: { downloads?: number }
}

const CLAWHUB_SORTS: { value: string; label: string }[] = [
  { value: 'newest', label: '最新更新' },
  { value: 'downloads', label: '下载量' },
  { value: 'rating', label: '星级' },
  { value: 'installs', label: '当前安装' },
  { value: 'installsAllTime', label: '历史安装' },
  { value: 'trending', label: '趋势' },
]

interface ClawHubViewProps {
  onInstalled?: () => void
  providers: MarketplaceProviderInfo[]
  providerId: string
  onProviderChange: (id: string) => void
}

type InstallTarget = 'claude-code' | 'cursor'

function installKey(slug: string, target: InstallTarget) {
  return `${slug}:${target}`
}

export function ClawHubView({
  onInstalled,
  providers,
  providerId,
  onProviderChange,
}: ClawHubViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('skill-hub:marketplace-sidebar') !== 'closed'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('skill-hub:marketplace-sidebar', sidebarOpen ? 'open' : 'closed')
    } catch {}
  }, [sidebarOpen])

  const [tab, setTab] = useState<'search' | 'browse'>('search')

  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchHit[]>([])

  const [sort, setSort] = useState<string>('downloads')
  const [nonSuspicious, setNonSuspicious] = useState(true)
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseError, setBrowseError] = useState<string | null>(null)
  const [browseItems, setBrowseItems] = useState<SkillItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [browseFallbackNote, setBrowseFallbackNote] = useState<string | null>(null)

  const [installing, setInstalling] = useState<string | null>(null)
  const [installMsg, setInstallMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const currentProvider = useMemo(
    () => providers.find((p) => p.id === providerId),
    [providers, providerId],
  )

  const reg = useMemo(() => {
    const p = providers.find((x) => x.id === providerId)
    if (p?.kind === 'clawhub-http' && p.registry) return p.registry
    const fb: Record<string, string> = {
      clawhub: 'clawhub',
      clawhub_cn: 'clawhub_cn',
      skillhub: 'skillhub',
    }
    return fb[providerId] || 'clawhub'
  }, [providers, providerId])

  const runSearch = useCallback(async () => {
    const query = q.trim()
    if (!query) return
    setSearching(true)
    setSearchError(null)
    setInstallMsg(null)
    try {
      const res = await fetch(
        `/api/clawhub/search?q=${encodeURIComponent(query)}&limit=30&registry=${encodeURIComponent(reg)}`,
      )
      const data = await res.json()
      if (!data.ok) {
        setSearchError(data.error || '搜索失败')
        setSearchResults([])
        return
      }
      const results = (data.data?.results || []) as SearchHit[]
      setSearchResults(results)
    } catch (e: any) {
      setSearchError(e?.message || '网络错误')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [q, reg])

  const loadBrowse = useCallback(
    async (cursor?: string | null) => {
      setBrowseLoading(true)
      setBrowseError(null)
      setInstallMsg(null)
      try {
        const params = new URLSearchParams()
        params.set('limit', '30')
        params.set('sort', sort)
        params.set('registry', reg)
        if (nonSuspicious) params.set('nonSuspicious', 'true')
        if (cursor) params.set('cursor', cursor)
        const res = await fetch(`/api/clawhub/skills?${params}`)
        const data = await res.json()
        if (!data.ok) {
          setBrowseError(data.error || '加载失败')
          setBrowseFallbackNote(null)
          return
        }
        const items = (data.data?.items || []) as SkillItem[]
        const next = (data.data?.nextCursor ?? null) as string | null
        setBrowseFallbackNote(
          typeof data.data?.browseFallbackNote === 'string' ? data.data.browseFallbackNote : null,
        )
        if (cursor) {
          setBrowseItems((prev) => [...prev, ...items])
        } else {
          setBrowseItems(items)
        }
        setNextCursor(next)
      } catch (e: any) {
        setBrowseError(e?.message || '网络错误')
      } finally {
        setBrowseLoading(false)
      }
    },
    [sort, nonSuspicious, reg],
  )

  useEffect(() => {
    if (tab !== 'browse') return
    setBrowseItems([])
    setNextCursor(null)
    loadBrowse(null)
  }, [tab, sort, nonSuspicious, loadBrowse])

  const install = async (slug: string, target: InstallTarget, force = false) => {
    if (!slug) return
    const key = installKey(slug, target)
    setInstalling(key)
    setInstallMsg(null)
    try {
      const res = await fetch('/api/clawhub/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, force, target, registry: reg }),
      })
      const data = await res.json()
      if (res.status === 409 && data.code === 'SUSPICIOUS') {
        const ok = window.confirm(
          `${data.error || '该 Skill 被标记为可疑'}\n\n是否仍要安装？`,
        )
        if (ok) {
          setInstalling(key)
          const res2 = await fetch('/api/clawhub/install', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, force: true, target, registry: reg }),
          })
          const data2 = await res2.json()
          if (!res2.ok || !data2.ok) {
            setInstallMsg({ kind: 'err', text: data2.error || `安装失败 (${res2.status})` })
            return
          }
          setInstallMsg({
            kind: 'ok',
            text: `已安装 ${slug} → ${data2.targetDir || (target === 'cursor' ? '~/.cursor/skills' : '~/.claude/skills')}`,
          })
          onInstalled?.()
          return
        }
        setInstallMsg({ kind: 'err', text: '已取消安装' })
        return
      }
      if (!res.ok || !data.ok) {
        setInstallMsg({ kind: 'err', text: data.error || `安装失败 (${res.status})` })
        return
      }
      setInstallMsg({
        kind: 'ok',
        text: `已安装 ${slug} → ${data.targetDir || (target === 'cursor' ? '~/.cursor/skills' : '~/.claude/skills')}`,
      })
      onInstalled?.()
    } catch (e: any) {
      setInstallMsg({ kind: 'err', text: e?.message || '网络错误' })
    } finally {
      setInstalling(null)
    }
  }

  const resultCount = tab === 'search' ? searchResults.filter((r) => r.slug).length : browseItems.length

  const sidebar = (
    <>
      <MarketplaceRegistryBlock
        providers={providers}
        value={providerId}
        onChange={onProviderChange}
      />

      <MarketplaceFilterSection title="浏览方式">
        <MarketplaceFilterButton
          active={tab === 'search'}
          onClick={() => setTab('search')}
          label="搜索"
          icon="🔍"
        />
        <MarketplaceFilterButton
          active={tab === 'browse'}
          onClick={() => setTab('browse')}
          label="浏览列表"
          icon="📋"
        />
      </MarketplaceFilterSection>

      {tab === 'browse' && (
        <>
          <MarketplaceFilterSection title="排序">
            {CLAWHUB_SORTS.map((opt) => (
              <MarketplaceFilterButton
                key={opt.value}
                active={sort === opt.value}
                onClick={() => setSort(opt.value)}
                label={opt.label}
              />
            ))}
          </MarketplaceFilterSection>

          <MarketplaceFilterSection title="筛选">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-slate-400 hover:bg-slate-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={nonSuspicious}
                onChange={(e) => setNonSuspicious(e.target.checked)}
                className="rounded border-slate-600"
              />
              仅非可疑
            </label>
          </MarketplaceFilterSection>
        </>
      )}

      {reg === 'skillhub' ? (
        <p className="text-[11px] text-slate-600 leading-relaxed px-1">
          讯飞{' '}
          <a
            href="https://skill.xfyun.cn/registry/skill.md"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400/90 hover:underline"
          >
            SkillHub
          </a>
          （ClawHub 兼容 API）。团队技能 slug 形如 <code className="text-[10px] bg-slate-800 px-0.5 rounded">ns--skill</code>。
          启动前可设置 <code className="text-[10px] bg-slate-800 px-0.5 rounded">SKILL_HUB_CLAWHUB_TOKEN</code>；自定义地址用{' '}
          <code className="text-[10px] bg-slate-800 px-0.5 rounded">SKILL_HUB_SKILLHUB_REGISTRY</code>。
          安装至 <code className="text-[10px] bg-slate-800 px-0.5 rounded">~/.claude/skills</code> 或{' '}
          <code className="text-[10px] bg-slate-800 px-0.5 rounded">~/.cursor/skills</code>。
        </p>
      ) : reg === 'clawhub_cn' ? (
        <p className="text-[11px] text-slate-600 leading-relaxed px-1">
          来自{' '}
          <a
            href="https://mirror-cn.clawhub.com"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400/90 hover:underline"
          >
            ClawHub 中国镜像
          </a>
          （ClawHub 兼容 API）。可用 <code className="text-[10px] bg-slate-800 px-0.5 rounded">SKILL_HUB_CLAWHUB_CN_REGISTRY</code>{' '}
          覆盖地址。安装至{' '}
          <code className="text-[10px] bg-slate-800 px-0.5 rounded">~/.claude/skills</code> 或{' '}
          <code className="text-[10px] bg-slate-800 px-0.5 rounded">~/.cursor/skills</code>。
        </p>
      ) : (
        <p className="text-[11px] text-slate-600 leading-relaxed px-1">
          {currentProvider?.description ? (
            <span>{currentProvider.description} </span>
          ) : (
            <>
              来自{' '}
              <a href="https://clawhub.ai" target="_blank" rel="noreferrer" className="text-indigo-400/90 hover:underline">
                ClawHub
              </a>
              ，
            </>
          )}
          安装至{' '}
          <code className="text-[10px] bg-slate-800 px-0.5 rounded">~/.claude/skills</code> 或{' '}
          <code className="text-[10px] bg-slate-800 px-0.5 rounded">~/.cursor/skills</code>。
        </p>
      )}
    </>
  )

  const toolbarLeft = (
    <span className="text-sm text-slate-500">
      共 <span className="text-slate-300 font-medium">{resultCount}</span> 个
      {tab === 'search' ? ' 结果' : ' Skill'}
    </span>
  )

  const cardBadges = (mode: 'search' | 'browse') => {
    const srcLabel =
      currentProvider?.label ||
      (reg === 'skillhub' ? 'SkillHub' : reg === 'clawhub_cn' ? '镜像' : 'ClawHub')
    const srcVariant =
      reg === 'skillhub' ? 'skillhub' : reg === 'clawhub_cn' ? 'clawhub' : 'clawhub'
    return (
      <>
        <MarketplaceSourcePill label={srcLabel} variant={srcVariant} />
        <MarketplaceSourcePill label={mode === 'search' ? '搜索' : '浏览'} variant="neutral" />
      </>
    )
  }

  const skillWebBase =
    currentProvider?.webBase ||
    (reg === 'skillhub' ? 'https://skill.xfyun.cn' : reg === 'clawhub_cn' ? 'https://mirror-cn.clawhub.com' : 'https://clawhub.ai')

  const renderActions = (slug: string) => (
    <>
      <a
        href={`${skillWebBase}/skills/${encodeURIComponent(slug)}`}
        target="_blank"
        rel="noreferrer"
        className="px-2.5 py-1 rounded-md border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-800"
      >
        打开
      </a>
      <button
        type="button"
        onClick={() => install(slug, 'claude-code')}
        disabled={installing !== null}
        className="px-2.5 py-1 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-medium disabled:opacity-50"
      >
        {installing === installKey(slug, 'claude-code') ? '…' : 'Claude'}
      </button>
      <button
        type="button"
        onClick={() => install(slug, 'cursor')}
        disabled={installing !== null}
        className="px-2.5 py-1 rounded-md bg-sky-600/90 hover:bg-sky-500 text-white text-[11px] font-medium disabled:opacity-50"
      >
        {installing === installKey(slug, 'cursor') ? '…' : 'Cursor'}
      </button>
    </>
  )

  return (
    <MarketplacePageShell
      sidebar={sidebar}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((v) => !v)}
      toolbarLeft={toolbarLeft}
    >
      {installMsg && (
        <div
          className={`p-3 rounded-lg text-sm ${
            installMsg.kind === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
          }`}
        >
          {installMsg.text}
        </div>
      )}

      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex md:hidden flex-col gap-2">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="关键词：pdf、postgres…"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={searching || !q.trim()}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium"
            >
              {searching ? '搜索中…' : '搜索'}
            </button>
          </div>
          <div className="hidden md:flex gap-2 flex-col sm:flex-row">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="输入关键词，例如 pdf、postgres…"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={searching || !q.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium shrink-0"
            >
              {searching ? '搜索中…' : '搜索'}
            </button>
          </div>
          {searchError && <p className="text-sm text-red-400">{searchError}</p>}

          {!q.trim() && !searching && searchResults.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-center">
              <div>
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-slate-400 text-sm">输入关键词并搜索 ClawHub 公开 Skill</p>
              </div>
            </div>
          ) : searchResults.filter((r) => r.slug).length === 0 && !searching && q.trim() && !searchError ? (
            <p className="text-sm text-slate-500 py-8 text-center">无匹配结果</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-300">🔍 搜索结果</h2>
                <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                  {searchResults.filter((r) => r.slug).length}
                </span>
                <div className="flex-1 h-px bg-slate-800/60" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {searchResults.map((r) => {
                  const slug = r.slug || ''
                  if (!slug) return null
                  return (
                    <MarketplaceItemCard
                      key={slug}
                      title={r.displayName || slug}
                      subtitle={slug}
                      description={r.summary}
                      meta={
                        typeof r.score === 'number' ? (
                          <span>相关度 {r.score.toFixed(3)}</span>
                        ) : undefined
                      }
                      badges={cardBadges('search')}
                      footerLeft={<MarketplaceSourcePill label="远程" variant="neutral" />}
                      actions={renderActions(slug)}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'browse' && (
        <div className="space-y-4">
          {browseFallbackNote && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-100/90 text-sm">
              {browseFallbackNote}
            </div>
          )}
          {browseError && <p className="text-sm text-red-400">{browseError}</p>}

          {browseLoading && browseItems.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-300">
                  🌐 {currentProvider?.label || 'ClawHub'} 列表
                </h2>
                <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">{browseItems.length}</span>
                <div className="flex-1 h-px bg-slate-800/60" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {browseItems.map((item) => (
                  <MarketplaceItemCard
                    key={item.slug}
                    title={item.displayName}
                    subtitle={item.slug}
                    description={item.summary}
                    meta={
                      <span>
                        {item.latestVersion?.version && <>v{item.latestVersion.version} · </>}
                        更新 {formatRel(item.updatedAt)}
                      </span>
                    }
                    badges={cardBadges('browse')}
                    footerLeft={
                      item.stats?.downloads != null ? (
                        <span className="text-[10px] text-slate-500">↓ {item.stats.downloads.toLocaleString()}</span>
                      ) : null
                    }
                    actions={renderActions(item.slug)}
                  />
                ))}
              </div>
              {nextCursor && (
                <button
                  type="button"
                  onClick={() => loadBrowse(nextCursor)}
                  disabled={browseLoading}
                  className="w-full py-2.5 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  {browseLoading ? '加载中…' : '加载更多'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </MarketplacePageShell>
  )
}

function formatRel(ts: number) {
  if (!ts || !Number.isFinite(ts)) return '—'
  const diff = Date.now() - ts
  const d = Math.floor(diff / 86400000)
  if (d > 30) return `${Math.floor(d / 30)} 个月前`
  if (d > 0) return `${d} 天前`
  const h = Math.floor(diff / 3600000)
  if (h > 0) return `${h} 小时前`
  const m = Math.floor(diff / 60000)
  if (m > 0) return `${m} 分钟前`
  return '刚刚'
}
