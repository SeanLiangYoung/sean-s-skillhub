import { useEffect, useState, useCallback } from 'react'
import { useSkills } from './hooks/useSkills'
import { useWebSocket } from './hooks/useWebSocket'
import { useTheme } from './hooks/useTheme'
import { useBulkSkillActions } from './hooks/useBulkSkillActions'
import { StatsBar } from './components/StatsBar'
import { SkillDetail } from './components/SkillDetail'
import { Dashboard } from './components/Dashboard'
import { SimilarView } from './components/SimilarView'
import { TrashView } from './components/TrashView'
import { MarketplaceView } from './components/MarketplaceView'
import { AboutModal } from './components/AboutModal'
import { SettingsModal } from './components/SettingsModal'
import { useMarketplaceProvider } from './hooks/useMarketplaceProvider'
import type { MarketplaceProviderInfo } from './types/marketplace'
import { MARKETPLACE_PROVIDERS_FALLBACK } from './data/marketplaceFallbackProviders'
import { Footer } from './components/Footer'
import type { Skill } from './hooks/useSkills'
import type { AppView } from './types/appView'
import type { SkillGroupBy } from './types/skillsList'
import { SkillsHomeView } from './components/SkillsHomeView'
import { ConflictsPage } from './components/ConflictsPage'

function App() {
  const { allSkills, skills, stats, projects, conflicts, loading, error, scan, filterSkills } = useSkills()
  const { theme, toggle: toggleTheme } = useTheme()
  const [marketplaceProviderId, setMarketplaceProviderId] = useMarketplaceProvider()
  const [marketplaceProviders, setMarketplaceProviders] = useState<MarketplaceProviderInfo[]>(
    () => MARKETPLACE_PROVIDERS_FALLBACK,
  )

  useEffect(() => {
    fetch('/api/marketplace/providers')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.providers)) {
          setMarketplaceProviders(d.providers as MarketplaceProviderInfo[])
        }
      })
      .catch(() => {
        setMarketplaceProviders(MARKETPLACE_PROVIDERS_FALLBACK)
      })
  }, [])

  const [view, setView] = useState<AppView>('skills')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [conflictOnly, setConflictOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState<SkillGroupBy>('scope')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [trashCount, setTrashCount] = useState<number>(0)
  const [conflictRowBusy, setConflictRowBusy] = useState<Set<string>>(new Set())
  const [aboutOpen, setAboutOpen] = useState<boolean>(false)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('skill-hub:sidebar') !== 'closed'
    } catch {
      return true
    }
  })

  const refreshTrashCount = useCallback(async () => {
    try {
      const res = await fetch('/api/trash')
      const data = await res.json()
      if (data.ok) setTrashCount((data.items || []).length)
    } catch {}
  }, [])

  const {
    selectMode,
    setSelectMode,
    selectedIds,
    setSelectedIds,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    bulkDeleting,
    bulkDeleteResult,
    setBulkDeleteResult,
    toggleSelectMode,
    handleSelectToggle,
    selectAllVisible,
    clearSelection,
    performBulkDelete,
  } = useBulkSkillActions({
    view,
    allSkills,
    skills,
    scan,
    refreshTrashCount,
  })

  useEffect(() => {
    try {
      localStorage.setItem('skill-hub:sidebar', sidebarOpen ? 'open' : 'closed')
    } catch {}
  }, [sidebarOpen])

  useEffect(() => {
    scan()
  }, [scan])

  useEffect(() => {
    refreshTrashCount()
  }, [refreshTrashCount])

  useEffect(() => {
    if (groupBy === 'project' && projects.length === 0) {
      setGroupBy('scope')
    }
  }, [groupBy, projects.length])

  useWebSocket(
    useCallback(
      (data: { type?: string }) => {
        if (data.type === 'change') {
          setLastUpdate(new Date().toLocaleTimeString('zh-CN'))
          scan()
        }
      },
      [scan],
    ),
  )

  const applyFilters = useCallback(
    (overrides?: {
      scope?: string
      source?: string
      agent?: string
      project?: string
      search?: string
      conflictOnly?: boolean
    }) => {
      filterSkills({
        scope: overrides?.scope ?? scopeFilter,
        source: overrides?.source ?? sourceFilter,
        agent: overrides?.agent ?? agentFilter,
        project: overrides?.project ?? projectFilter,
        search: overrides?.search ?? search,
        conflictOnly: overrides?.conflictOnly ?? conflictOnly,
      })
    },
    [filterSkills, scopeFilter, sourceFilter, agentFilter, projectFilter, search, conflictOnly],
  )

  const handleScopeChange = (v: string) => {
    setScopeFilter(v)
    setProjectFilter('all')
    applyFilters({ scope: v, project: 'all' })
  }

  const handleSourceChange = (v: string) => {
    setSourceFilter(v)
    applyFilters({ source: v })
  }

  const handleAgentChange = (v: string) => {
    setAgentFilter(v)
    applyFilters({ agent: v })
  }

  const handleProjectChange = (v: string) => {
    setProjectFilter(v)
    if (v !== 'all') {
      setScopeFilter('all')
      applyFilters({ project: v, scope: 'all' })
    } else {
      applyFilters({ project: v })
    }
  }

  const handleSearch = (q: string) => {
    setSearch(q)
    applyFilters({ search: q })
  }

  const listFilterActive =
    scopeFilter !== 'all' ||
    sourceFilter !== 'all' ||
    agentFilter !== 'all' ||
    projectFilter !== 'all' ||
    conflictOnly ||
    search.trim() !== ''

  const clearListFilters = useCallback(() => {
    setScopeFilter('all')
    setSourceFilter('all')
    setAgentFilter('all')
    setProjectFilter('all')
    setConflictOnly(false)
    setSearch('')
    filterSkills({
      scope: 'all',
      source: 'all',
      agent: 'all',
      project: 'all',
      search: '',
      conflictOnly: false,
    })
  }, [filterSkills])

  const withConflictBusy = async (skill: Skill, fn: () => Promise<void>) => {
    setConflictRowBusy((prev) => new Set(prev).add(skill.id))
    try {
      await fn()
      await scan()
      await refreshTrashCount()
    } finally {
      setConflictRowBusy((prev) => {
        const next = new Set(prev)
        next.delete(skill.id)
        return next
      })
    }
  }

  const handleConflictDelete = (skill: Skill) =>
    withConflictBusy(skill, async () => {
      if (!confirm(`把 "${skill.name}" (${skill.scope}) 移到回收站?\n\n路径: ${skill.path}\n\n7 天内可在回收站恢复。`)) return
      const res = await fetch(`/api/skills/${skill.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: skill.path, skillName: skill.name }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
    })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSkill(null)
        if (bulkDeleteConfirm) setBulkDeleteConfirm(false)
        else if (selectMode) {
          setSelectMode(false)
          setSelectedIds(new Set())
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectMode, bulkDeleteConfirm, setBulkDeleteConfirm, setSelectMode, setSelectedIds])

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setAboutOpen(true)}
              title="关于 Skill Hub"
              className="flex items-center group"
            >
              <div className="text-left">
                <h1 className="text-base font-bold text-slate-100 leading-tight group-hover:text-yellow-300 transition-colors">
                  Skill 管理器
                </h1>
                {lastUpdate && (
                  <p className="text-[11px] text-green-500/60">最近更新 {lastUpdate}</p>
                )}
              </div>
            </button>

            <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg border border-slate-800 p-0.5 ml-4 flex-wrap">
              <button
                onClick={() => setView('skills')}
                className={`px-3 py-1 rounded-md text-xs transition-all ${
                  view === 'skills' ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Skills
              </button>
              <button
                onClick={() => setView('similar')}
                className={`px-3 py-1 rounded-md text-xs transition-all ${
                  view === 'similar' ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                相似检测
              </button>
              <button
                onClick={() => setView('dashboard')}
                className={`px-3 py-1 rounded-md text-xs transition-all ${
                  view === 'dashboard' ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                仪表盘
              </button>
              {conflicts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setView('conflicts')}
                  title="查看同名冲突"
                  className={`px-3 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 ${
                    view === 'conflicts' ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span>冲突</span>
                  <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                    {conflicts.length}
                  </span>
                </button>
              )}
              <button
                onClick={() => setView('marketplace')}
                className={`px-3 py-1 rounded-md text-xs transition-all ${
                  view === 'marketplace' ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                技能市场
              </button>
              <button
                onClick={() => setView('trash')}
                className={`px-3 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 ${
                  view === 'trash' ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>回收站</span>
                {trashCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                    {trashCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {view === 'skills' && (
              <div className="relative hidden md:block">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索 Skills... (名称/描述)"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-72 pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200
                             placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            )}

            <button
              onClick={scan}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50
                         rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20
                         flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              <span>{loading ? '扫描中...' : '一键扫描'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              title="系统配置"
              aria-label="系统配置"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              title={theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {stats.total > 0 && (
          <StatsBar stats={stats} projects={projects} conflicts={conflicts.length} />
        )}

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <div className="font-semibold mb-2">扫描失败：{error}</div>
            <div className="text-xs text-red-300/80">
              排查步骤：
              <ol className="list-decimal list-inside mt-1 space-y-0.5">
                <li>
                  访问{' '}
                  <a href="/api/debug" target="_blank" rel="noreferrer" className="underline">
                    /api/debug
                  </a>{' '}
                  查看服务端状态
                </li>
                <li>打开浏览器 DevTools Console 看是否有网络错误</li>
                <li>检查终端日志是否有 Node 错误</li>
              </ol>
            </div>
            <button
              onClick={scan}
              className="mt-3 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-200 text-xs"
            >
              重试扫描
            </button>
          </div>
        )}

        {view === 'marketplace' ? (
          <MarketplaceView
            onInstalled={scan}
            providerId={marketplaceProviderId}
            onProviderChange={setMarketplaceProviderId}
            providers={marketplaceProviders}
          />
        ) : view === 'conflicts' ? (
          <ConflictsPage
            conflicts={conflicts}
            onSkillClick={setSelectedSkill}
            onDelete={handleConflictDelete}
            conflictRowBusy={conflictRowBusy}
            selectMode={selectMode}
            toggleSelectMode={toggleSelectMode}
            selectedIds={selectedIds}
            onSelectToggle={handleSelectToggle}
            onBulkDelete={() => setBulkDeleteConfirm(true)}
          />
        ) : view === 'dashboard' ? (
          <Dashboard stats={stats} projects={projects} conflicts={conflicts} skills={allSkills} />
        ) : view === 'similar' ? (
          <SimilarView onSkillClick={setSelectedSkill} />
        ) : view === 'trash' ? (
          <TrashView
            onCountChange={setTrashCount}
            onRestored={() => {
              scan()
            }}
          />
        ) : (
          <SkillsHomeView
            search={search}
            onSearchChange={handleSearch}
            sidebarOpen={sidebarOpen}
            onSidebarOpenToggle={() => setSidebarOpen((v) => !v)}
            stats={stats}
            projects={projects}
            scopeFilter={scopeFilter}
            sourceFilter={sourceFilter}
            agentFilter={agentFilter}
            projectFilter={projectFilter}
            onScopeChange={handleScopeChange}
            onSourceChange={handleSourceChange}
            onAgentChange={handleAgentChange}
            onProjectChange={handleProjectChange}
            skills={skills}
            allSkillsTotal={stats.total}
            loading={loading}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            hasProjectRoots={projects.length > 0}
            conflictCount={conflicts.length}
            onOpenConflicts={() => setView('conflicts')}
            selectMode={selectMode}
            onToggleSelectMode={toggleSelectMode}
            selectedIds={selectedIds}
            onSelectToggle={handleSelectToggle}
            onSelectAllVisible={selectAllVisible}
            onClearSelection={clearSelection}
            onBulkDeleteClick={() => setBulkDeleteConfirm(true)}
            bulkDeleteResult={bulkDeleteResult}
            onDismissBulkDeleteResult={() => setBulkDeleteResult(null)}
            listFilterActive={listFilterActive}
            onClearListFilters={clearListFilters}
            onSkillClick={setSelectedSkill}
          />
        )}

        <Footer onAboutClick={() => setAboutOpen(true)} />
      </div>

      <AboutModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        stats={stats}
        conflictCount={conflicts.length}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        providers={marketplaceProviders}
        providerId={marketplaceProviderId}
        onProviderChange={setMarketplaceProviderId}
      />

      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">批量删除确认</h3>
            <p className="text-sm text-slate-400">
              即将把 <span className="text-slate-200 font-semibold">{selectedIds.size}</span> 个 Skill 移到回收站。
              回收站保留 7 天,期间可恢复。
            </p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 divide-y divide-slate-800/60">
              {Array.from(selectedIds)
                .map((id) => allSkills.find((s) => s.id === id))
                .filter((s): s is Skill => !!s)
                .slice(0, 50)
                .map((s) => (
                  <div key={s.id} className="px-3 py-1.5 text-xs flex items-center gap-2">
                    <span className="text-slate-300 truncate flex-1">/{s.name}</span>
                    <span className="text-[10px] text-slate-600 shrink-0">{s.scope}</span>
                  </div>
                ))}
              {selectedIds.size > 50 && (
                <div className="px-3 py-1.5 text-[11px] text-slate-500 text-center">
                  ...还有 {selectedIds.size - 50} 个
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={performBulkDelete}
                disabled={bulkDeleting}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 disabled:opacity-40 rounded-lg text-sm font-medium text-red-300 transition-all"
              >
                {bulkDeleting ? '删除中...' : `确认删除 ${selectedIds.size} 个`}
              </button>
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                disabled={bulkDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSkill && (
        <SkillDetail
          skill={selectedSkill}
          projects={projects}
          onClose={() => setSelectedSkill(null)}
          onToggle={async (skill, enabled) => {
            await fetch(`/api/skills/${skill.id}/toggle`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enabled, skillName: skill.name }),
            })
            await scan()
          }}
          onSaveContent={async (skill, content) => {
            await fetch(`/api/skills/${skill.id}/content`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ realPath: skill.realPath, content }),
            })
            await scan()
          }}
          onCopy={async (skill, targetScope, projectPath) => {
            const res = await fetch('/api/skills/copy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sourcePath: skill.path, targetScope, projectPath, skillName: skill.name }),
            })
            const data = await res.json()
            if (!data.ok) throw new Error(data.error)
            await scan()
          }}
          onMove={async (skill, targetScope, projectPath) => {
            const res = await fetch('/api/skills/move', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sourcePath: skill.path, targetScope, projectPath, skillName: skill.name }),
            })
            const data = await res.json()
            if (!data.ok) throw new Error(data.error)
            setSelectedSkill(null)
            await scan()
          }}
          onDelete={async (skill) => {
            const res = await fetch(`/api/skills/${skill.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: skill.path, skillName: skill.name }),
            })
            const data = await res.json()
            if (!data.ok) throw new Error(data.error)
            await scan()
            await refreshTrashCount()
          }}
        />
      )}
    </div>
  )
}

export default App
