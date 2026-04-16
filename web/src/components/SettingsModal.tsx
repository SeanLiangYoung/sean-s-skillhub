import { useEffect } from 'react'
import type { MarketplaceSource } from '../hooks/useMarketplaceSource'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  marketplaceSource: MarketplaceSource
  onMarketplaceSourceChange: (v: MarketplaceSource) => void
}

export function SettingsModal({
  open,
  onClose,
  marketplaceSource,
  onMarketplaceSourceChange,
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

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl"
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

        <section className="space-y-3">
          <div className="text-sm font-medium text-slate-300">技能市场默认来源</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            进入「技能市场」时优先展示所选目录；可随时在页面内切换。
          </p>
          <div className="flex flex-col gap-2">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                marketplaceSource === 'clawhub'
                  ? 'border-indigo-500/50 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="marketplace-source"
                checked={marketplaceSource === 'clawhub'}
                onChange={() => onMarketplaceSourceChange('clawhub')}
                className="mt-1 rounded-full border-slate-600 text-indigo-500 focus:ring-indigo-500/30"
              />
              <span>
                <span className="block text-sm font-medium text-slate-200">ClawHub</span>
                <span className="block text-xs text-slate-500 mt-0.5">clawhub.ai 公开 Skill，ZIP 安装到本机。</span>
              </span>
            </label>
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                marketplaceSource === 'skillhub'
                  ? 'border-indigo-500/50 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="marketplace-source"
                checked={marketplaceSource === 'skillhub'}
                onChange={() => onMarketplaceSourceChange('skillhub')}
                className="mt-1 rounded-full border-slate-600 text-indigo-500 focus:ring-indigo-500/30"
              />
              <span>
                <span className="block text-sm font-medium text-slate-200">SkillHub（讯飞）</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  skill.xfyun.cn，ClawHub 兼容 API；服务端可设 SKILL_HUB_SKILLHUB_REGISTRY。
                </span>
              </span>
            </label>
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                marketplaceSource === 'skillhubcn'
                  ? 'border-indigo-500/50 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="marketplace-source"
                checked={marketplaceSource === 'skillhubcn'}
                onChange={() => onMarketplaceSourceChange('skillhubcn')}
                className="mt-1 rounded-full border-slate-600 text-indigo-500 focus:ring-indigo-500/30"
              />
              <span>
                <span className="block text-sm font-medium text-slate-200">Skillhub商店</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  skillhub.cn，需本机安装 skillhub CLI（见文档安装脚本）。
                </span>
              </span>
            </label>
          </div>
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
