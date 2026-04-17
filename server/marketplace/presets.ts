export type MarketplaceProviderKind = 'clawhub-http'

export type MarketplaceProviderDescriptor = {
  id: string
  label: string
  kind: MarketplaceProviderKind
  /** Query param value for /api/clawhub/* */
  registry?: string
  description?: string
  group: 'http'
  /** Public web origin for skill detail links */
  webBase?: string
}

export function getBuiltinMarketplaceProviders(): MarketplaceProviderDescriptor[] {
  return [
    {
      id: 'clawhub',
      label: 'ClawHub',
      kind: 'clawhub-http',
      registry: 'clawhub',
      description: 'clawhub.ai 公开 Skill，ZIP 安装到本机。',
      group: 'http',
      webBase: 'https://clawhub.ai',
    },
  ]
}

export function getMergedMarketplaceProviders(): MarketplaceProviderDescriptor[] {
  return getBuiltinMarketplaceProviders()
}
