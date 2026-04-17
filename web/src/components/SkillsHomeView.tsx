import { Sidebar } from './Sidebar'
import { SkillGrid } from './SkillGrid'
import type { Stats, Project, Skill } from '../hooks/useSkills'
import type { SkillGroupBy } from '../types/skillsList'

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
  groupBy: SkillGroupBy
  onGroupByChange: (v: SkillGroupBy) => void
  hasProjectRoots: boolean
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
  groupBy,
  onGroupByChange,
  hasProjectRoots,
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
  const groupOptions: { value: SkillGroupBy; label: string; disabled?: boolean }[] = [
    { value: 'scope', label: '按层级' },
    { value: 'source', label: '按来源' },
    { value: 'project', label: '按项目', disabled: !hasProjectRoots },
    { value: 'none', label: '平铺' },
  ]

  return (
    <>
      <div className="md:hidden mb-4">
        <input
          type="text"
          placeholder="搜索 Skills..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200
                     placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
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
          />
        )}

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
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

            <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-1 bg-slate-900 rounded-lg border border-slate-800 p-0.5 flex-wrap justify-end max-w-[min(100%,20rem)]">
                {groupOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && onGroupByChange(opt.value)}
                    title={opt.disabled ? '当前未发现项目级 Skill 目录' : undefined}
                    className={`px-3 py-1 rounded-md text-xs transition-all
                      ${opt.disabled ? 'opacity-40 cursor-not-allowed text-slate-600' : ''}
                      ${
                        !opt.disabled && groupBy === opt.value
                          ? 'bg-slate-700 text-slate-200 shadow-sm'
                          : !opt.disabled
                            ? 'text-slate-500 hover:text-slate-300'
                            : ''
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectMode && (
            <div className="mb-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3 flex-wrap">
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
              className={`mb-4 p-3 rounded-lg text-sm border flex items-center justify-between ${
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

          {loading && skills.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">正在扫描 Skills...</span>
                <span className="text-xs text-slate-600">扫描全局和项目目录中</span>
              </div>
            </div>
          ) : skills.length === 0 && allSkillsTotal === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-slate-300 mb-1">暂无 Skills</p>
                <p className="text-sm text-slate-500">点击「一键扫描」发现你的 Claude Skills</p>
              </div>
            </div>
          ) : (
            <SkillGrid
              skills={skills}
              groupBy={groupBy}
              onSkillClick={onSkillClick}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onSelectToggle={onSelectToggle}
              filterActive={listFilterActive}
              onClearFilters={onClearListFilters}
            />
          )}
        </main>
      </div>
    </>
  )
}
