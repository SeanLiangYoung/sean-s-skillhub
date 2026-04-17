import type { MarketplaceProviderInfo } from '../../types/marketplace'
import { MarketplaceFilterSection, MarketplaceFilterButton } from './MarketplaceFilterPrimitives'

interface Props {
  providers: MarketplaceProviderInfo[]
  value: string
  onChange: (v: string) => void
}

function iconFor(p: MarketplaceProviderInfo): string {
  if (p.id === 'clawhub') return '🦞'
  return '📦'
}

export function MarketplaceRegistryBlock({ providers, value, onChange }: Props) {
  return (
    <MarketplaceFilterSection title="ClawHub 兼容 API">
      {providers.map((p) => (
        <MarketplaceFilterButton
          key={p.id}
          active={value === p.id}
          onClick={() => onChange(p.id)}
          label={p.label}
          icon={iconFor(p)}
        />
      ))}
    </MarketplaceFilterSection>
  )
}
