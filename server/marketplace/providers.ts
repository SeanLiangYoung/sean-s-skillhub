/**
 * Marketplace "provider" surface: descriptors and HTTP registry resolution.
 * Route handlers remain in `routes/clawhub.ts` / `routes/marketplace.ts`; this module is the shared contract.
 */
export type { MarketplaceProviderDescriptor, MarketplaceProviderKind } from './presets.js'
export { getBuiltinMarketplaceProviders, getMergedMarketplaceProviders } from './presets.js'
export { resolveHttpRegistryBase } from './httpRegistry.js'
