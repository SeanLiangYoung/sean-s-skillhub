import type { ReactNode } from 'react'

/** Same visual language as Sidebar filter controls. */
export function MarketplaceFilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-1">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

export function MarketplaceFilterButton({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
  icon?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition-all flex justify-between items-center
        ${active
          ? 'bg-indigo-600/15 text-indigo-400 font-medium'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
        }`}
    >
      <span className="flex items-center gap-2 truncate">
        {icon && <span className="text-xs">{icon}</span>}
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && (
        <span className={`text-[11px] tabular-nums ${active ? 'text-indigo-400/70' : 'text-slate-600'}`}>
          {count}
        </span>
      )}
    </button>
  )
}
