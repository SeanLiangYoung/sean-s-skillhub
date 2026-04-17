import type { InstallAgentTarget } from './marketplaceInstallTypes'

export type InstallTarget = InstallAgentTarget

function installKey(slug: string, target: InstallTarget) {
  return `${slug}:${target}`
}

export interface MarketplaceSkillCardActionsProps {
  slug: string
  webBase: string
  registry: string
  installing: string | null
  onInstall: (slug: string, target: InstallTarget, force?: boolean) => void | Promise<void>
  onDownload: (slug: string, registry: string, force?: boolean) => void | Promise<void>
}

const secondaryBtn =
  'inline-flex items-center justify-center min-h-[30px] px-3 text-xs font-medium text-slate-200 transition-colors duration-150 ' +
  'hover:bg-slate-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900'

const installBtn =
  'inline-flex min-w-[4.75rem] items-center justify-center min-h-[30px] rounded-lg px-3 text-xs font-semibold tracking-wide text-white ' +
  'shadow-sm transition-all duration-150 active:scale-[0.97] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ' +
  'disabled:pointer-events-none disabled:opacity-45'

export function MarketplaceSkillCardActions({
  slug,
  webBase,
  registry,
  installing,
  onInstall,
  onDownload,
}: MarketplaceSkillCardActionsProps) {
  const detailUrl = `${webBase.replace(/\/$/, '')}/skills/${encodeURIComponent(slug)}`
  const busy = installing !== null

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {/* 次要操作：分段控件，视觉合一 */}
      <div
        className="marketplace-skill-actions-segment inline-flex overflow-hidden rounded-lg border border-slate-600/60 bg-slate-900/40 shadow-inner shadow-black/20 ring-1 ring-slate-700/30"
        role="group"
        aria-label="市场链接与下载"
      >
        <a
          href={detailUrl}
          target="_blank"
          rel="noreferrer"
          className={`${secondaryBtn} border-r border-slate-600/50 bg-slate-800/30`}
        >
          打开
        </a>
        <button
          type="button"
          onClick={() => onDownload(slug, registry)}
          disabled={busy}
          className={`${secondaryBtn} disabled:opacity-45`}
        >
          {installing === `dl:${slug}:${registry}` ? '…' : '下载'}
        </button>
      </div>

      {/* 安装到本机：品牌色 + 轻微层次 */}
      <button
        type="button"
        onClick={() => onInstall(slug, 'claude-code')}
        disabled={busy}
        className={`${installBtn} bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600`}
      >
        {installing === installKey(slug, 'claude-code') ? '…' : 'Claude'}
      </button>
      <button
        type="button"
        onClick={() => onInstall(slug, 'cursor')}
        disabled={busy}
        className={`${installBtn} bg-gradient-to-b from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600`}
      >
        {installing === installKey(slug, 'cursor') ? '…' : 'Cursor'}
      </button>
    </div>
  )
}

export { installKey }
