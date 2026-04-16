import type { FastifyInstance } from 'fastify'
import { getMergedMarketplaceProviders } from '../marketplace/presets.js'

export async function marketplaceRoutes(app: FastifyInstance) {
  app.get('/api/marketplace/providers', async () => {
    const providers = getMergedMarketplaceProviders()
    return { ok: true, providers }
  })
}
