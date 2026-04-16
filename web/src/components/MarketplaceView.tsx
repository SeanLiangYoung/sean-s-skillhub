import { ClawHubView } from './ClawHubView'
import { SkillhubCnView } from './SkillhubCnView'
import type { MarketplaceSource } from '../hooks/useMarketplaceSource'

interface MarketplaceViewProps {
  onInstalled?: () => void
  marketplaceSource: MarketplaceSource
  onMarketplaceSourceChange: (v: MarketplaceSource) => void
}

export function MarketplaceView({
  onInstalled,
  marketplaceSource,
  onMarketplaceSourceChange,
}: MarketplaceViewProps) {
  return (
    <div className="w-full min-w-0">
      {marketplaceSource === 'skillhubcn' ? (
        <SkillhubCnView
          onInstalled={onInstalled}
          marketplaceSource={marketplaceSource}
          onMarketplaceSourceChange={onMarketplaceSourceChange}
        />
      ) : (
        <ClawHubView
          onInstalled={onInstalled}
          marketplaceSource={marketplaceSource}
          onMarketplaceSourceChange={onMarketplaceSourceChange}
        />
      )}
    </div>
  )
}
