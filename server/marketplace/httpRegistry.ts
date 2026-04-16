import {
  resolveRegistryBase,
  parseRegistryId,
  type ClawHubRegistryId,
} from '../clawhub/registry.js'
import { getCustomHttpPresets } from './presets.js'

/**
 * Resolve ClawHub-compatible HTTP registry base URL from UI / API `registry` string.
 * Supports built-in ids, clawhub_cn, and custom preset ids from SKILL_HUB_MARKETPLACE_PRESETS_JSON.
 */
export function resolveHttpRegistryBase(registryRaw: unknown): string {
  const s = String(registryRaw ?? '').trim()
  if (!s) {
    return resolveRegistryBase('clawhub')
  }

  const custom = getCustomHttpPresets().find((p) => p.id === s)
  if (custom) {
    return custom.baseUrl
  }

  const builtin: ClawHubRegistryId = parseRegistryId(s)
  return resolveRegistryBase(builtin)
}
