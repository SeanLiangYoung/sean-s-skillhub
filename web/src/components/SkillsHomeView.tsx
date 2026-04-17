import { Sidebar } from './Sidebar'
import { SkillGrid } from './SkillGrid'
import { SkillSearchInput } from './SkillSearchInput'
import type { Stats, Project, Skill } from '../hooks/useSkills'
interface SkillsHomeViewProps {
  search: string
  onSearchChange: (q: string) => void
  sidebarOpen: boolean
  onSidebarOpenToggle: () => void
  stats: Stats
  projects: Project[]
  scopeFilter: string
  sourceFilter: string
  agentFilter: string
  projectFilter: string
  onScopeChange: (v: string) => void
  onSourceChange: (v: string) => void
  onAgentChange: (v: string) => void
  onProjectChange: (v: string) => void
  skills: Skill[]
  allSkillsTotal: number
  loading: boolean
  conflictCount: number
  onOpenConflicts: () => void
  selectMode: boolean
  onToggleSelectMode: () => void
  selectedIds: Set<string>
  onSelectToggle: (skill: Skill) => void
  onSelectAllVisible: () => void
  onClearSelection: () => void
  onBulkDeleteClick: () => void
  bulkDeleteResult: { kind: 'ok' | 'err'; text: string } | null
  onDismissBulkDeleteResult: () => void
  listFilterActive: boolean
  onClearListFilters: () => void
  onSkillClick: (skill: Skill) => void
}

export function SkillsHomeView({
  search,
  onSearchChange,
  sidebarOpen,
  onSidebarOpenToggle,
  stats,
  projects,
  scopeFilter,
  sourceFilter,
  agentFilter,
  projectFilter,
  onScopeChange,
  onSourceChange,
  onAgentChange,
  onProjectChange,
  skills,
  allSkillsTotal,
  loading,
  conflictCount,
  onOpenConflicts,
  selectMode,
  onToggleSelectMode,
  selectedIds,
  onSelectToggle,
  onSelectAllVisible,
  onClearSelection,
  onBulkDeleteClick,
  bulkDeleteResult,
  onDismissBulkDeleteResult,
  listFilterActive,
  onClearListFilters,
  onSkillClick,
}: SkillsHomeViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!sidebarOpen && (
        <div className="mb-4 max-w-xl shrink-0">
          <SkillSearchInput value={search} onChange={onSearchChange} size="default" />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch">
        {sidebarOpen && (
          <Sidebar
            stats={stats}
            projects={projects}
            scopeFilter={scopeFilter}
            sourceFilter={sourceFilter}
            agentFilter={agentFilter}
            projectFilter={projectFilter}
            onScopeChange={onScopeChange}
            onSourceChange={onSourceChange}
            onAgentChange={onAgentChange}
            onProjectChange={onProjectChange}
            search={search}
            onSearchChange={onSearchChange}
          />
        )}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onSidebarOpenToggle}
                title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
                aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
                className="p-1.5 rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {sidebarOpen ? (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
              <span className="text-sm text-slate-500">
                共 <span className="text-slate-300 font-medium">{skills.length}</span> 个 Skill
              </span>
              {conflictCount > 0 && (
                <button
                  onClick={onOpenConflicts}
                  title="查看同名冲突详情与处理方式"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{conflictCount} 组冲突 →</span>
                </button>
              )}
            </div>

            <button
              onClick={onToggleSelectMode}
              title={selectMode ? '退出批量选择' : '进入批量选择'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                selectMode
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{selectMode ? '完成' : '批量选择'}</span>
            </button>
          </div>

          {selectMode && (
            <div className="mb-4 shrink-0 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-indigo-300 font-medium">
                  已选 {selectedIds.size} / {skills.length} 个
                </span>
                <button
                  onClick={onSelectAllVisible}
                  disabled={skills.length === 0}
                  className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40"
                >
                  全选当前视图
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={onClearSelection}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    取消选择
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onBulkDeleteClick}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed border border-red-500/30 rounded-md text-xs font-medium text-red-300 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>删除所选 ({selectedIds.size})</span>
                </button>
              </div>
            </div>
          )}

          {bulkDeleteResult && (
            <div
              className={`mb-4 shrink-0 p-3 rounded-lg text-sm border flex items-center justify-between ${
                bulkDeleteResult.kind === 'ok'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              <span>
                {bulkDeleteResult.kind === 'ok' ? '✓ ' : '✗ '}
                {bulkDeleteResult.text}
              </span>
              <button
                type="button"
                onClick={onDismissBulkDeleteResult}
                className="text-xs opacity-60 hover:opacity-100"
              >
                关闭
              </button>
            </div>
          )}

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
            {loading && skills.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  <span className="text-sm">正在扫描 Skills...</span>
                  <span className="text-xs text-slate-600">扫描全局和项目目录中</span>
                </div>
              </div>
            ) : skills.length === 0 && allSkillsTotal === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="mb-3 text-4xl">🔍</div>
                  <p className="mb-1 text-slate-300">暂无 Skills</p>
                  <p className="text-sm text-slate-500">点击「一键扫描」发现你的 Claude Skills</p>
                </div>
              </div>
            ) : (
              <SkillGrid
                skills={skills}
                groupBy="scope"
                onSkillClick={onSkillClick}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onSelectToggle={onSelectToggle}
                filterActive={listFilterActive}
                onClearFilters={onClearListFilters}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
