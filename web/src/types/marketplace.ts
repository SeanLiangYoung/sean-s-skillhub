export type MarketplaceProviderKind = 'clawhub-http'

export type MarketplaceProviderInfo = {
  id: string
  label: string
  kind: MarketplaceProviderKind
  registry?: string
  description?: string
  group: 'http'
  webBase?: string
}
