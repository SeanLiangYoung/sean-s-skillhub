import { useEffect, useState } from 'react'

const STORAGE_KEY = 'skill-hub:marketplace-provider'
const LEGACY_SOURCE_KEY = 'skill-hub:marketplace-source'

function isValidId(v: string): boolean {
  return /^[\w-]+$/.test(v) && v.length <= 64
}

function readInitial(): string {
  try {
    const cur = localStorage.getItem(STORAGE_KEY)
    if (cur && isValidId(cur)) return cur
  } catch {}
  try {
    const legacy = localStorage.getItem(LEGACY_SOURCE_KEY)
    if (legacy === 'clawhub' || legacy === 'skillhub' || legacy === 'skillhubcn') {
      try {
        localStorage.setItem(STORAGE_KEY, legacy)
        localStorage.removeItem(LEGACY_SOURCE_KEY)
      } catch {}
      return legacy
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
