import type { Skill, ConflictGroup } from '../hooks/useSkills'
import { ConflictsView } from './ConflictsView'

interface ConflictsPageProps {
  conflicts: ConflictGroup[]
  onSkillClick: (skill: Skill) => void
  onDelete: (skill: Skill) => Promise<void>
  conflictRowBusy: Set<string>
  selectMode: boolean
  toggleSelectMode: () => void
  selectedIds: Set<string>
  onSelectToggle: (skill: Skill) => void
  onBulkDelete: () => void
}

export function ConflictsPage({
  conflicts,
  onSkillClick,
  onDelete,
  conflictRowBusy,
  selectMode,
  toggleSelectMode,
  selectedIds,
  onSelectToggle,
  onBulkDelete,
}: ConflictsPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex shrink-0 items-center justify-end">
        <button
          onClick={toggleSelectMode}
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
      <ConflictsView
        conflicts={conflicts}
        onSkillClick={onSkillClick}
        onDelete={onDelete}
        busy={conflictRowBusy}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onSelectToggle={onSelectToggle}
        onBulkDelete={onBulkDelete}
      />
    </div>
  )
}
