import { resolveRegistryBase, parseRegistryId } from '../clawhub/registry.js'

/**
 * Resolve ClawHub HTTP registry base URL from UI / API `registry` string.
 * Only `clawhub` is supported; other values are ignored and use the official base.
 */
export function resolveHttpRegistryBase(_registryRaw: unknown): string {
  return resolveRegistryBase(parseRegistryId())
}
