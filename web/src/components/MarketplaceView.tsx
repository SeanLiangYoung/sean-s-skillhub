import { useEffect } from 'react'
import { ClawHubView } from './ClawHubView'
import { SkillhubCnView } from './SkillhubCnView'
import { LinkCatalogView } from './LinkCatalogView'
import { AgentGuidedView } from './AgentGuidedView'
import type { MarketplaceProviderInfo } from '../types/marketplace'

interface MarketplaceViewProps {
  onInstalled?: () => void
  providerId: string
  onProviderChange: (id: string) => void
  providers: MarketplaceProviderInfo[]
}

export function MarketplaceView({
  onInstalled,
  providerId,
  onProviderChange,
  providers,
}: MarketplaceViewProps) {
  const current = providers.find((p) => p.id === providerId)

  useEffect(() => {
    if (providers.length === 0) return
    if (!providers.some((p) => p.id === providerId)) {
      onProviderChange('clawhub')
    }
  }, [providers, providerId, onProviderChange])

  const kind = current?.kind

  if (kind === 'cli') {
    return (
      <SkillhubCnView
        onInstalled={onInstalled}
        providers={providers}
        providerId={providerId}
        onProviderChange={onProviderChange}
      />
    )
  }

  if (kind === 'link-only') {
    return (
      <LinkCatalogView providers={providers} providerId={providerId} onProviderChange={onProviderChange} />
    )
  }

  if (kind === 'agent-guided') {
    return (
      <AgentGuidedView providers={providers} providerId={providerId} onProviderChange={onProviderChange} />
    )
  }

  return (
    <ClawHubView
      onInstalled={onInstalled}
      providers={providers}
      providerId={providerId}
      onProviderChange={onProviderChange}
    />
  )
}
