import { useEffect } from 'react'
import type { MarketplaceProviderInfo } from '../types/marketplace'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  providers: MarketplaceProviderInfo[]
  providerId: string
  onProviderChange: (id: string) => void
}

function groupLabel(g: 'http' | 'cli' | 'browse'): string {
  if (g === 'http') return '应用内（ClawHub API）— 默认无需 LLM'
  if (g === 'cli') return '本机 CLI'
  return '浏览与智能体（可选）'
}

export function SettingsModal({
  open,
  onClose,
  providers,
  providerId,
  onProviderChange,
}: SettingsModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const http = providers.filter((p) => p.group === 'http')
  const cli = providers.filter((p) => p.group === 'cli')
  const browse = providers.filter((p) => p.group === 'browse')

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center"
          aria-label="关闭"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-lg font-bold text-slate-100 pr-10 mb-1">系统配置</h2>
        <p className="text-xs text-slate-500 mb-6">以下设置会保存在本机浏览器中。</p>

        <section className="space-y-6">
          <div>
            <div className="text-sm font-medium text-slate-300">技能市场默认来源</div>
            <p className="text-xs text-slate-500 leading-relaxed mt-1 mb-3">
              进入「技能市场」时优先展示所选目录；可随时在页面内切换。未配置 LLM 时，请优先使用 ClawHub API
              类来源。
            </p>
          </div>

          {[http, cli, browse].map((list, idx) =>
            list.length > 0 ? (
              <div key={idx} className="space-y-2">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {groupLabel(list[0].group)}
                </div>
                <div className="flex flex-col gap-2">
                  {list.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        providerId === p.id
                          ? 'border-indigo-500/50 bg-indigo-500/10'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="marketplace-provider"
                        checked={providerId === p.id}
                        onChange={() => onProviderChange(p.id)}
                        className="mt-1 rounded-full border-slate-600 text-indigo-500 focus:ring-indigo-500/30"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-200">{p.label}</span>
                        {p.description && (
                          <span className="block text-xs text-slate-500 mt-0.5">{p.description}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </section>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 border border-slate-700"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
