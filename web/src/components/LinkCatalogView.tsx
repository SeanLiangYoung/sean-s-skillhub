import { useMemo, useState } from 'react'
import type { MarketplaceProviderInfo } from '../types/marketplace'
import { MARKETPLACE_LINK_CATALOG } from '../data/marketplaceLinkCatalog'
import { MarketplacePageShell } from './marketplace/MarketplacePageShell'
import { MarketplaceRegistryBlock } from './marketplace/MarketplaceRegistryBlock'
import { MarketplaceFilterSection, MarketplaceFilterButton } from './marketplace/MarketplaceFilterPrimitives'

interface LinkCatalogViewProps {
  providers: MarketplaceProviderInfo[]
  providerId: string
  onProviderChange: (id: string) => void
}

export function LinkCatalogView({ providers, providerId, onProviderChange }: LinkCatalogViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('skill-hub:marketplace-sidebar') !== 'closed'
    } catch {
      return true
    }
  })

  const [tier, setTier] = useState<'all' | '3' | '2' | '1'>('all')

  const filtered = useMemo(() => {
    if (tier === 'all') return MARKETPLACE_LINK_CATALOG
    const n = parseInt(tier, 10) as 1 | 2 | 3
    return MARKETPLACE_LINK_CATALOG.filter((e) => e.tier === n)
  }, [tier])

  const sidebar = (
    <>
      <MarketplaceRegistryBlock
        providers={providers}
        value={providerId}
        onChange={onProviderChange}
      />
      <MarketplaceFilterSection title="筛选星级">
        <MarketplaceFilterButton active={tier === 'all'} onClick={() => setTier('all')} label="全部" />
        <MarketplaceFilterButton active={tier === '3'} onClick={() => setTier('3')} label="⭐⭐⭐" />
        <MarketplaceFilterButton active={tier === '2'} onClick={() => setTier('2')} label="⭐⭐" />
        <MarketplaceFilterButton active={tier === '1'} onClick={() => setTier('1')} label="⭐" />
      </MarketplaceFilterSection>
      <p className="text-[11px] text-slate-600 leading-relaxed px-1">
        以下为门户或控制台类站点，Skill Hub 无法在应用内统一搜索；请用浏览器打开，或使用「智能体发现」把 URL
        交给 Cursor / Claude 代搜。安装 Zip 或目录后，可用本工具扫描本地 Skills。
      </p>
    </>
  )

  return (
    <MarketplacePageShell
      sidebar={sidebar}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((v) => !v)}
      toolbarLeft={
        <span className="text-sm text-slate-500">
          共 <span className="text-slate-300 font-medium">{filtered.length}</span> 条
        </span>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((e) => (
          <a
            key={e.id}
            href={e.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:border-slate-600 hover:bg-slate-900/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-slate-100 leading-snug">{e.name}</h3>
              <span className="text-amber-400/90 text-xs shrink-0">
                {'⭐'.repeat(e.tier)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">{e.blurb}</p>
            <p className="text-[11px] text-indigo-400/90 truncate">{e.url}</p>
          </a>
        ))}
      </div>
    </MarketplacePageShell>
  )
}
