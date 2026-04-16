/**
 * Marketplace "provider" surface: descriptors and HTTP registry resolution.
 * Route handlers remain in `routes/clawhub.ts` / `routes/skillhubCn.ts`; this module is the shared contract.
 */
export type { MarketplaceProviderDescriptor, MarketplaceProviderKind, CustomHttpPreset } from './presets.js'
export {
  getBuiltinMarketplaceProviders,
  getMergedMarketplaceProviders,
  getCustomHttpPresets,
} from './presets.js'
export { resolveHttpRegistryBase } from './httpRegistry.js'
