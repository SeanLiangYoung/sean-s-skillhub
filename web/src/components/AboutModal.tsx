import { useEffect } from 'react'
import { APP_VERSION } from '../appVersion'
import { PROJECT_GITHUB_REPO, PROJECT_GITHUB_URL } from '../project'

interface Props {
  open: boolean
  onClose: () => void
  stats: { total: number; global: number; project: number }
  conflictCount: number
}

export function AboutModal({ open, onClose, stats, conflictCount }: Props) {
  // Lock scroll while open + esc to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center"
          aria-label="关闭"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo + title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-slate-50 font-bold text-3xl shadow-lg shadow-indigo-600/30 mb-4">
            S
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Skill Hub</h2>
          <div className="text-xs text-slate-500 mb-3">v{APP_VERSION}</div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            本地扫描、聚合与管理 Claude / Codex 等 Agent Skills
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <StatCell label="管理中" value={stats.total} />
          <StatCell label="全局" value={stats.global} />
          <StatCell label="项目级" value={stats.project} />
          <StatCell label="冲突" value={conflictCount} warn={conflictCount > 0} />
        </div>

        {/* Repository link */}
        <div className="space-y-2 mb-5">
          <SocialRow
            href={PROJECT_GITHUB_URL}
            label="GitHub"
            value={PROJECT_GITHUB_REPO}
            icon={<GitHubIcon />}
          />
        </div>

        <p className="text-[10px] text-slate-600 text-center mt-4">
          MIT License · 开源免费 · 欢迎 PR
        </p>
      </div>
    </div>
  )
}

function StatCell({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div
      className={`p-2.5 rounded-lg border text-center ${
        warn ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/50 border-slate-800'
      }`}
    >
      <div className={`text-lg font-bold tabular-nums ${warn ? 'text-amber-300' : 'text-slate-200'}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function SocialRow({
  href,
  label,
  value,
  icon,
}: {
  href: string
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-slate-300 group-hover:text-indigo-300 transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-slate-500">{label}</div>
        <div className="text-sm text-slate-200 truncate">{value}</div>
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-slate-600 group-hover:text-slate-400 shrink-0"
      >
        <path d="M7 17L17 7M17 7H9M17 7V15" />
      </svg>
    </a>
  )
}

// --- Inline SVG icons (no deps) ---

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}
