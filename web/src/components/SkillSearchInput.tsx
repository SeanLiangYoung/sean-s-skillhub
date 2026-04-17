/** Shared keyword search for Skills list (sidebar + mobile fallback). */
export function SkillSearchInput({
  value,
  onChange,
  size = 'default',
  className = '',
}: {
  value: string
  onChange: (q: string) => void
  size?: 'compact' | 'default'
  className?: string
}) {
  const compact = size === 'compact'
  return (
    <div className={`relative min-w-0 ${className}`}>
      <svg
        className={`absolute text-slate-500 pointer-events-none ${compact ? 'left-2 w-3 h-3 top-1/2 -translate-y-1/2' : 'left-3 w-3.5 h-3.5 top-1/2 -translate-y-1/2'}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        autoComplete="off"
        placeholder={compact ? '关键字…' : '搜索 Skills…（名称 / 描述）'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          compact
            ? `w-full min-w-[6.5rem] pl-7 pr-2 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] text-slate-200
               placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20`
            : `w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200
               placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors`
        }
      />
    </div>
  )
}
