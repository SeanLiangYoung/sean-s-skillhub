import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MarketplaceProviderInfo } from '../types/marketplace'
import { MarketplacePageShell } from './marketplace/MarketplacePageShell'
import { MarketplaceItemCard, MarketplaceSourcePill } from './marketplace/MarketplaceItemCard'
import {
  MarketplaceSkillCardActions,
  installKey,
  type InstallTarget,
} from './marketplace/MarketplaceSkillCardActions'

const STORAGE_REG = 'skill-hub:marketplace-registries'

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

interface MarketplaceAggregatedViewProps {
  onInstalled?: () => void
  providers: MarketplaceProviderInfo[]
}

function dlKey(slug: string, registry: string) {
  return `dl:${slug}:${registry}`
}

function parseFilenameFromCd(cd: string | null): string | null {
  if (!cd) return null
  const m = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(cd)
  const raw = m?.[1] || m?.[2]
  if (!raw) return null
  try {
    return decodeURIComponent(raw.replace(/^"|"$/g, ''))
  } catch {
    return raw
  }
}

export function MarketplaceAggregatedView({ onInstalled, providers }: MarketplaceAggregatedViewProps) {
  const httpProviders = useMemo(
    () => providers.filter((p) => p.kind === 'clawhub-http' && p.registry),
    [providers],
  )

  const multiSource = httpProviders.length > 1

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

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_REG)
      if (raw) {
        const arr = JSON.parse(raw) as unknown
        if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) {
          const valid = new Set(httpProviders.map((p) => p.id))
          const filtered = arr.filter((id) => valid.has(id))
          if (filtered.length > 0) return filtered
        }
      }
    } catch {}
    return httpProviders.map((p) => p.id)
  })

  useEffect(() => {
    const valid = new Set(httpProviders.map((p) => p.id))
    setSelectedIds((prev) => {
      const next = prev.filter((id) => valid.has(id))
      if (next.length > 0) return next
      return httpProviders.map((p) => p.id)
    })
  }, [httpProviders])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REG, JSON.stringify(selectedIds))
    } catch {}
  }, [selectedIds])

  const effectiveRegistryIds = useMemo(() => {
    if (httpProviders.length === 0) return []
    if (httpProviders.length === 1) return [httpProviders[0].id]
    return selectedIds
  }, [httpProviders, selectedIds])

  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [partialErrors, setPartialErrors] = useState<{ registry: string; message: string }[] | null>(null)
  const [results, setResults] = useState<MarketplaceSearchHit[]>([])

  const [installing, setInstalling] = useState<string | null>(null)
  const [installMsg, setInstallMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const toggleProvider = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const runSearch = useCallback(async () => {
    const query = q.trim()
    if (!query || effectiveRegistryIds.length === 0) return
    setSearching(true)
    setSearchError(null)
    setPartialErrors(null)
    setInstallMsg(null)
    try {
      const res = await fetch('/api/marketplace/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: query,
          registries: effectiveRegistryIds,
          limit: 40,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setSearchError(data.error || '搜索失败')
        setResults([])
        return
      }
      setResults((data.results || []) as MarketplaceSearchHit[])
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setPartialErrors(data.errors)
      }
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : '网络错误')
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [q, effectiveRegistryIds])

  const install = async (slug: string, target: InstallTarget, registry: string, force = false) => {
    if (!slug) return
    const key = installKey(slug, target)
    setInstalling(key)
    setInstallMsg(null)
    try {
      const res = await fetch('/api/clawhub/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, force, target, registry }),
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
            body: JSON.stringify({ slug, force: true, target, registry }),
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
    } catch (e: unknown) {
      setInstallMsg({ kind: 'err', text: e instanceof Error ? e.message : '网络错误' })
    } finally {
      setInstalling(null)
    }
  }

  const download = async (slug: string, registry: string, force = false) => {
    const k = dlKey(slug, registry)
    setInstalling(k)
    setInstallMsg(null)
    try {
      const qs = new URLSearchParams({ slug, registry })
      if (force) qs.set('force', '1')
      const res = await fetch(`/api/clawhub/download?${qs}`)
      if (res.status === 409) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
        if (data.code === 'SUSPICIOUS') {
          const ok = window.confirm(`${data.error || '该 Skill 被标记为可疑'}\n\n是否仍要下载？`)
          if (ok) return download(slug, registry, true)
          setInstallMsg({ kind: 'err', text: '已取消下载' })
          return
        }
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setInstallMsg({ kind: 'err', text: data.error || `下载失败 (${res.status})` })
        return
      }
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition')
      let name = parseFilenameFromCd(cd) || `${slug}.zip`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = name
      a.click()
      URL.revokeObjectURL(a.href)
      setInstallMsg({ kind: 'ok', text: `已下载 ${name}` })
    } catch (e: unknown) {
      setInstallMsg({ kind: 'err', text: e instanceof Error ? e.message : '网络错误' })
    } finally {
      setInstalling(null)
    }
  }

  const sidebar = multiSource ? (
    <>
      <p className="text-xs font-medium text-slate-400 px-1 mb-2">应用内市场（ClawHub API）</p>
      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
        {httpProviders.map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-slate-300 hover:bg-slate-800/60 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(p.id)}
              onChange={() => toggleProvider(p.id)}
              className="rounded border-slate-600"
            />
            <span className="truncate">{p.label}</span>
          </label>
        ))}
      </div>
    </>
  ) : null

  const resultCount = results.length

  return (
    <MarketplacePageShell
      sidebar={sidebar}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((v) => !v)}
      showSidebarChrome={multiSource}
      toolbarLeft={
        <span className="text-sm text-slate-500">
          共 <span className="text-slate-300 font-medium">{resultCount}</span> 条
        </span>
      }
    >
      <div className="space-y-6 w-full min-w-0">
        <div className="text-center space-y-4 pt-2 md:pt-4">
          {multiSource && (
            <div className="flex flex-wrap justify-center gap-1.5 w-full px-0 sm:px-1">
              {httpProviders
                .filter((p) => selectedIds.includes(p.id))
                .map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-800 border border-slate-700 text-slate-400"
                  >
                    {p.label}
                  </span>
                ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 w-full px-0 sm:px-1">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="描述需求或输入关键词，例如 pdf、postgres、飞书…"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searching || !q.trim() || effectiveRegistryIds.length === 0}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm text-white font-medium shrink-0"
            >
              {searching ? '搜索中…' : '搜索'}
            </button>
          </div>
        </div>

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

        {partialErrors && partialErrors.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-100/90 text-sm space-y-1">
            <div className="font-medium">部分市场不可用</div>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {partialErrors.map((e) => (
                <li key={e.registry}>
                  <span className="font-mono">{e.registry}</span>: {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {searchError && <p className="text-sm text-red-400 text-center">{searchError}</p>}

        {!q.trim() && !searching && results.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-center text-slate-500 text-sm">
            输入内容并点击搜索
          </div>
        ) : results.length === 0 && !searching && q.trim() && !searchError ? (
          <p className="text-sm text-slate-500 py-8 text-center">无匹配结果</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-300">聚合结果</h2>
              <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">{resultCount}</span>
              <div className="flex-1 h-px bg-slate-800/60" />
            </div>
            <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((r) => (
                <MarketplaceItemCard
                  key={`${r.registry}:${r.slug}`}
                  title={r.displayName || r.slug}
                  subtitle={r.slug}
                  description={r.summary}
                  meta={
                    typeof r.score === 'number' ? (
                      <span>相关度 {r.score.toFixed(3)}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )
                  }
                  badges={
                    <>
                      <MarketplaceSourcePill label={r.providerLabel} variant="clawhub" />
                      <MarketplaceSourcePill label="聚合搜索" variant="neutral" />
                    </>
                  }
                  footerLeft={<MarketplaceSourcePill label="远程" variant="neutral" />}
                  actions={
                    <MarketplaceSkillCardActions
                      slug={r.slug}
                      webBase={r.webBase}
                      registry={r.registry}
                      installing={installing}
                      onInstall={(slug, target) => install(slug, target, r.registry)}
                      onDownload={(slug, reg) => download(slug, reg)}
                    />
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </MarketplacePageShell>
  )
}
