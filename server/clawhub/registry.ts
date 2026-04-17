/**
 * Official ClawHub registry base.
 *
 * Env:
 * - SKILL_HUB_CLAWHUB_REGISTRY — override default (default https://clawhub.ai)
 */

export type ClawHubRegistryId = 'clawhub'

const DEFAULT_CLAWHUB = 'https://clawhub.ai'

function normalizeBase(raw: string): string {
  const t = raw.trim()
  return t.endsWith('/') ? t.slice(0, -1) : t
}

export function resolveRegistryBase(_id: ClawHubRegistryId = 'clawhub'): string {
  return normalizeBase(process.env.SKILL_HUB_CLAWHUB_REGISTRY || DEFAULT_CLAWHUB)
}

/** Only `clawhub` is supported; any string maps to it. */
export function parseRegistryId(_raw: unknown): ClawHubRegistryId {
  return 'clawhub'
}
