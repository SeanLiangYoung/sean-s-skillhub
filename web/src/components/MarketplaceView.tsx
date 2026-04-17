import { MarketplaceAggregatedView } from './MarketplaceAggregatedView'
import type { MarketplaceProviderInfo } from '../types/marketplace'

interface MarketplaceViewProps {
  onInstalled?: () => void
  providers: MarketplaceProviderInfo[]
}

export function MarketplaceView({ onInstalled, providers }: MarketplaceViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto overscroll-y-contain">
      <MarketplaceAggregatedView onInstalled={onInstalled} providers={providers} />
    </div>
  )
}
