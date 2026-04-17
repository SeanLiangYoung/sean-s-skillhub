import { useEffect, useState } from 'react'

const STORAGE_KEY = 'skill-hub:marketplace-provider'
const LEGACY_SOURCE_KEY = 'skill-hub:marketplace-source'

/** Removed from app; migrate saved preference to ClawHub. */
const REMOVED_PROVIDER_IDS = new Set([
  'skillhubcn',
  'link-catalog',
  'agent-guided',
  'clawhub_cn',
  'skillhub',
])

function isValidId(v: string): boolean {
  return /^[\w-]+$/.test(v) && v.length <= 64
}

function readInitial(): string {
  try {
    const cur = localStorage.getItem(STORAGE_KEY)
    if (cur && isValidId(cur)) {
      if (REMOVED_PROVIDER_IDS.has(cur)) {
        try {
          localStorage.setItem(STORAGE_KEY, 'clawhub')
        } catch {}
        return 'clawhub'
      }
      return cur
    }
  } catch {}
  try {
    const legacy = localStorage.getItem(LEGACY_SOURCE_KEY)
    if (
      legacy === 'clawhub' ||
      legacy === 'skillhub' ||
      legacy === 'skillhubcn' ||
      legacy === 'clawhub_cn'
    ) {
      const next =
        legacy === 'skillhubcn' ||
        legacy === 'skillhub' ||
        legacy === 'clawhub_cn' ||
        REMOVED_PROVIDER_IDS.has(legacy)
          ? 'clawhub'
          : legacy
      try {
        localStorage.setItem(STORAGE_KEY, next)
        localStorage.removeItem(LEGACY_SOURCE_KEY)
      } catch {}
      return next
    }
    if (legacy === 'skillssh') {
      try {
        localStorage.setItem(STORAGE_KEY, 'clawhub')
        localStorage.removeItem(LEGACY_SOURCE_KEY)
      } catch {}
      return 'clawhub'
    }
  } catch {}
  return 'clawhub'
}

/**
 * Persisted default for the 技能市场 tab. Values are provider ids from GET /api/marketplace/providers.
 */
export function useMarketplaceProvider() {
  const [providerId, setProviderId] = useState<string>(readInitial)

  useEffect(() => {
    try {
      if (isValidId(providerId)) {
        localStorage.setItem(STORAGE_KEY, providerId)
      }
    } catch {}
  }, [providerId])

  return [providerId, setProviderId] as const
}
