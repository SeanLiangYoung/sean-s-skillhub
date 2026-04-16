import { useCallback, useEffect, useState } from 'react'
import type { MarketplaceSource } from '../hooks/useMarketplaceSource'
import { MarketplacePageShell } from './marketplace/MarketplacePageShell'
import { MarketplaceRegistryBlock } from './marketplace/MarketplaceRegistryBlock'
import { MarketplaceItemCard, MarketplaceSourcePill } from './marketplace/MarketplaceItemCard'

const INSTALL_CMD =
  'curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash'

const INSTALL_CLI_ONLY =
  'curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash -s -- --cli-only'

interface SkillhubCnViewProps {
  onInstalled?: () => void
  marketplaceSource: MarketplaceSource
  onMarketplaceSourceChange: (v: MarketplaceSource) => void
}

type InstallTarget = 'claude-code' | 'cursor'

function installKey(name: string, target: InstallTarget) {
  return `${name}:${target}`
}

export function SkillhubCnView({
  onInstalled,
  marketplaceSource,
  onMarketplaceSourceChange,
}: SkillhubCnViewProps) {
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

  const [cliOk, setCliOk] = useState<boolean | null>(null)
  const [installScript, setInstallScript] = useState<string>(INSTALL_CMD)

  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const [raw, setRaw] = useState<string | null>(null)

  const [installing, setInstalling] = useState<string | null>(null)
  const [installMsg, setInstallMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [manualName, setManualName] = useState('')

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/skillhub-cn/status')
      const data = await res.json()
      if (data.ok) {
        setCliOk(Boolean(data.available))
        if (typeof data.installScript === 'string') setInstallScript(data.installScript)
      } else {
        setCliOk(false)
      }
    } catch {
      setCliOk(false)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const runSearch = async () => {
    const query = q.trim()
    if (!query) return
    setSearching(true)
    setSearchError(null)
    setInstallMsg(null)
    try {
      const res = await fetch(`/api/skillhub-cn/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setSearchError(data.error || '搜索失败')
        setLines([])
        setRaw(null)
        return
      }
      const L = (data.data?.lines || []) as string[]
      setLines(L)
      setRaw(typeof data.data?.raw === 'string' ? data.data.raw : null)
    } catch (e: any) {
      setSearchError(e?.message || '网络错误')
      setLines([])
      setRaw(null)
    } finally {
      setSearching(false)
    }
  }

  const install = async (name: string, target: InstallTarget) => {
    const key = installKey(name, target)
    setInstalling(key)
    setInstallMsg(null)
    try {
      const res = await fetch('/api/skillhub-cn/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, target }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setInstallMsg({ kind: 'err', text: data.error || `安装失败 (${res.status})` })
        return
      }
      setInstallMsg({
        kind: 'ok',
        text: data.message || '安装完成',
      })
      onInstalled?.()
    } catch (e: any) {
      setInstallMsg({ kind: 'err', text: e?.message || '网络错误' })
    } finally {
      setInstalling(null)
    }
  }

  const sidebar = (
    <>
      <MarketplaceRegistryBlock value={marketplaceSource} onChange={onMarketplaceSourceChange} />
      <p className="text-[11px] text-slate-600 leading-relaxed px-1">
        <a
          href="https://skillhub.cn/install/skillhub.md"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-400/90 hover:underline"
        >
          Skillhub 商店
        </a>
        通过本机 <code className="text-[10px] bg-slate-800 px-0.5 rounded">skillhub</code> CLI 搜索与安装（需先执行官方安装脚本）。
      </p>
    </>
  )

  const toolbarLeft = (
    <span className="text-sm text-slate-500">
      共 <span className="text-slate-300 font-medium">{lines.length}</span> 行结果
    </span>
  )

  return (
    <MarketplacePageShell
      sidebar={sidebar}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((v) => !v)}
      toolbarLeft={toolbarLeft}
    >
      {cliOk === false && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-100/90 text-sm space-y-2">
          <p className="font-medium text-amber-200">未检测到 skillhub 命令行</p>
          <p className="text-xs text-amber-200/80">
            请在运行 Skill Hub 的机器上执行官方脚本安装（来自{' '}
            <a href="https://skillhub.cn/install/skillhub.md" className="underline" target="_blank" rel="noreferrer">
              skillhub.cn 文档
            </a>
            ）：
          </p>
          <pre className="text-[11px] bg-slate-950/80 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
            {installScript}
          </pre>
          <p className="text-xs text-amber-200/70">仅 CLI：</p>
          <pre className="text-[11px] bg-slate-950/80 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
            {INSTALL_CLI_ONLY}
          </pre>
          <button
            type="button"
            onClick={() => refreshStatus()}
            className="text-xs text-indigo-300 hover:underline"
          >
            安装完成后点击重新检测
          </button>
        </div>
      )}

      {installMsg && (
        <div
          className={`p-3 rounded-lg text-sm whitespace-pre-wrap break-words max-h-48 overflow-y-auto ${
            installMsg.kind === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/20 text-red-300'
          }`}
        >
          {installMsg.text}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex md:hidden flex-col gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="skillhub search …"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200"
          />
          <button
            type="button"
            onClick={runSearch}
            disabled={searching || !q.trim() || cliOk === false}
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
            placeholder="输入关键词（等价 skillhub search 关键词）"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200"
          />
          <button
            type="button"
            onClick={runSearch}
            disabled={searching || !q.trim() || cliOk === false}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium shrink-0"
          >
            {searching ? '搜索中…' : '搜索'}
          </button>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 space-y-2">
          <div className="text-xs font-medium text-slate-400">按精确名称安装（skillhub install …）</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="技能名称"
              disabled={cliOk === false}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => manualName.trim() && install(manualName.trim(), 'claude-code')}
                disabled={installing !== null || !manualName.trim() || cliOk === false}
                className="px-3 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-50 text-sm text-white"
              >
                → Claude
              </button>
              <button
                type="button"
                onClick={() => manualName.trim() && install(manualName.trim(), 'cursor')}
                disabled={installing !== null || !manualName.trim() || cliOk === false}
                className="px-3 py-2 rounded-lg bg-sky-600/90 hover:bg-sky-500 disabled:opacity-50 text-sm text-white"
              >
                → Cursor
              </button>
            </div>
          </div>
        </div>

        {searchError && <p className="text-sm text-red-400">{searchError}</p>}

        {!q.trim() && lines.length === 0 && !searching && (
          <div className="flex items-center justify-center py-16 text-center text-slate-500 text-sm">
            <div>
              <div className="text-3xl mb-2">🛒</div>
              <p>输入关键词，使用本机 skillhub CLI 搜索 Skillhub 商店</p>
            </div>
          </div>
        )}

        {lines.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-300">搜索结果</h2>
              <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">{lines.length}</span>
              <div className="flex-1 h-px bg-slate-800/60" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {lines.map((line, i) => {
                const full = line.trim().slice(0, 200)
                const short = full.split(/\s+/)[0] || `line-${i}`
                return (
                  <MarketplaceItemCard
                    key={`${i}-${line.slice(0, 40)}`}
                    title={line.slice(0, 120)}
                    subtitle={short}
                    description={line.length > 120 ? `${line.slice(0, 400)}…` : undefined}
                    badges={
                      <>
                        <MarketplaceSourcePill label="Skillhub商店" variant="skillhubcn" />
                      </>
                    }
                    footerLeft={<MarketplaceSourcePill label="CLI" variant="neutral" />}
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={() => install(full, 'claude-code')}
                          disabled={installing !== null || cliOk === false || !full}
                          className="px-2.5 py-1 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-medium disabled:opacity-50"
                        >
                          {installing === installKey(full, 'claude-code') ? '…' : '→ Claude'}
                        </button>
                        <button
                          type="button"
                          onClick={() => install(full, 'cursor')}
                          disabled={installing !== null || cliOk === false || !full}
                          className="px-2.5 py-1 rounded-md bg-sky-600/90 hover:bg-sky-500 text-white text-[11px] font-medium disabled:opacity-50"
                        >
                          {installing === installKey(full, 'cursor') ? '…' : '→ Cursor'}
                        </button>
                      </>
                    }
                  />
                )
              })}
            </div>
            {raw && (
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer text-slate-400">原始输出</summary>
                <pre className="mt-2 p-3 rounded-lg bg-slate-950/80 overflow-x-auto max-h-64 whitespace-pre-wrap">
                  {raw}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </MarketplacePageShell>
  )
}
