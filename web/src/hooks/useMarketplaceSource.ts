import { useEffect, useState } from 'react'

export type MarketplaceSource = 'clawhub' | 'skillhub' | 'skillhubcn'

const STORAGE_KEY = 'skill-hub:marketplace-source'

function readInitial(): MarketplaceSource {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'clawhub' || v === 'skillhub' || v === 'skillhubcn') return v
    if (v === 'skillssh') return 'clawhub'
  } catch {}
  return 'clawhub'
}

/** Persisted default for the 技能市场 tab（ClawHub / SkillHub 讯飞 / Skillhub 商店）。 */
export function useMarketplaceSource() {
  const [source, setSource] = useState<MarketplaceSource>(readInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, source)
    } catch {}
  }, [source])

  return [source, setSource] as const
}
