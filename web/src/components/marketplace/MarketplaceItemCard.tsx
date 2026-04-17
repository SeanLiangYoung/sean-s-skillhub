import type { ReactNode } from 'react'

interface MarketplaceItemCardProps {
  title: string
  subtitle?: string
  description?: string | null
  meta?: ReactNode
  badges?: ReactNode
  footerLeft?: ReactNode
  actions: ReactNode
}

/** Card chrome aligned with SkillCard (rounded-xl, border, header + description + footer). */
export function MarketplaceItemCard({
  title,
  subtitle,
  description,
  meta,
  badges,
  footerLeft,
  actions,
}: MarketplaceItemCardProps) {
  return (
    <div className="group relative rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 transition-all duration-200 hover:border-indigo-500/50 hover:bg-slate-800/80 flex flex-col min-h-[140px]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
            {title}
          </h3>
          {subtitle && (
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{subtitle}</div>
          )}
        </div>
        {badges && <div className="flex gap-1 shrink-0 items-center flex-wrap justify-end">{badges}</div>}
      </div>

      <p className="text-xs text-slate-400 line-clamp-3 mb-2 leading-relaxed flex-1">
        {description?.trim() ? description : '无描述'}
      </p>

      {meta && <div className="text-[11px] text-slate-600 mb-3">{meta}</div>}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-2 min-w-0">{footerLeft}</div>
        <div className="flex flex-wrap gap-1.5 justify-end shrink-0">{actions}</div>
      </div>
    </div>
  )
}

function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${className}`}
    >
      {children}
    </span>
  )
}

export function MarketplaceSourcePill({
  label,
  variant = 'neutral',
}: {
  label: string
  variant?: 'clawhub' | 'neutral'
}) {
  const cls =
    variant === 'clawhub'
      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
      : 'bg-slate-800/80 border-slate-700 text-slate-400'
  return <Pill className={cls}>{label}</Pill>
}
