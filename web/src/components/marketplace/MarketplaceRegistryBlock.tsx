import type { MarketplaceSource } from '../../hooks/useMarketplaceSource'
import { MarketplaceFilterSection, MarketplaceFilterButton } from './MarketplaceFilterPrimitives'

interface Props {
  value: MarketplaceSource
  onChange: (v: MarketplaceSource) => void
}

export function MarketplaceRegistryBlock({ value, onChange }: Props) {
  return (
    <MarketplaceFilterSection title="市场来源">
      <MarketplaceFilterButton
        active={value === 'clawhub'}
        onClick={() => onChange('clawhub')}
        label="ClawHub"
        icon="🦞"
      />
      <MarketplaceFilterButton
        active={value === 'skillhub'}
        onClick={() => onChange('skillhub')}
        label="SkillHub"
        icon="🎙️"
      />
      <MarketplaceFilterButton
        active={value === 'skillhubcn'}
        onClick={() => onChange('skillhubcn')}
        label="Skillhub商店"
        icon="🛒"
      />
    </MarketplaceFilterSection>
  )
}
