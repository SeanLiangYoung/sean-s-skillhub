export type MarketplaceProviderKind = 'clawhub-http' | 'cli' | 'link-only' | 'agent-guided'

export type MarketplaceProviderInfo = {
  id: string
  label: string
  kind: MarketplaceProviderKind
  registry?: string
  description?: string
  group: 'http' | 'cli' | 'browse'
  webBase?: string
}
