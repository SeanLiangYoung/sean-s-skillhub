import type { MarketplaceProviderInfo } from '../types/marketplace'

/** Client fallback when GET /api/marketplace/providers fails (offline / API-only). */
export const MARKETPLACE_PROVIDERS_FALLBACK: MarketplaceProviderInfo[] = [
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
