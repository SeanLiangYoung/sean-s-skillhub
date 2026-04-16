import type { MarketplaceProviderInfo } from '../../types/marketplace'
import { MarketplaceFilterSection, MarketplaceFilterButton } from './MarketplaceFilterPrimitives'

interface Props {
  providers: MarketplaceProviderInfo[]
  value: string
  onChange: (v: string) => void
}

function iconFor(p: MarketplaceProviderInfo): string {
  if (p.id === 'clawhub') return '🦞'
  if (p.id === 'clawhub_cn') return '🇨🇳'
  if (p.id === 'skillhub') return '🎙️'
  if (p.id === 'skillhubcn') return '🛒'
  if (p.kind === 'link-only') return '🔗'
  if (p.kind === 'agent-guided') return '🤖'
  return '📦'
}

function sectionTitle(group: 'http' | 'cli' | 'browse'): string {
  if (group === 'http') return '应用内（ClawHub API）'
  if (group === 'cli') return '本机 CLI'
  return '浏览与智能体'
}

export function MarketplaceRegistryBlock({ providers, value, onChange }: Props) {
  const http = providers.filter((p) => p.group === 'http')
  const cli = providers.filter((p) => p.group === 'cli')
  const browse = providers.filter((p) => p.group === 'browse')

  return (
    <>
      {[http, cli, browse].map((list, idx) =>
        list.length > 0 ? (
          <MarketplaceFilterSection key={idx} title={sectionTitle(list[0].group)}>
            {list.map((p) => (
              <MarketplaceFilterButton
                key={p.id}
                active={value === p.id}
                onClick={() => onChange(p.id)}
                label={p.label}
                icon={iconFor(p)}
              />
            ))}
          </MarketplaceFilterSection>
        ) : null,
      )}
    </>
  )
}
