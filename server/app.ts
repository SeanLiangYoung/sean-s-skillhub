import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import type { WebSocket } from 'ws'
import { skillRoutes } from './routes/skills.js'
import { manageRoutes } from './routes/manage.js'
import { versionRoutes } from './routes/versions.js'
import { similarityRoutes } from './routes/similarity.js'
import { trashRoutes } from './routes/trash.js'
import { clawhubRoutes } from './routes/clawhub.js'
import { skillhubCnRoutes } from './routes/skillhubCn.js'
import { marketplaceRoutes } from './routes/marketplace.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const wsClients = new Set<WebSocket>()

export function broadcast(data: unknown) {
  const msg = JSON.stringify(data)
  for (const ws of wsClients) {
    if (ws.readyState === 1) {
      ws.send(msg)
    }
  }
}

/** Set by {@link buildApp}: path to served `dist/web` when present, else `null` (API-only). */
export let lastStaticRoot: string | null = null

/**
 * Build the Fastify app (routes + optional static UI). Does not listen or start the file watcher.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })

  await app.register(cors, { origin: true })
  await app.register(websocket)
  await app.register(skillRoutes)
  await app.register(manageRoutes)
  await app.register(versionRoutes)
  await app.register(similarityRoutes)
  await app.register(trashRoutes)
  await app.register(clawhubRoutes)
  await app.register(skillhubCnRoutes)
  await app.register(marketplaceRoutes)

  app.get('/api/health', async () => ({ status: 'ok' }))

  app.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket) => {
      wsClients.add(socket)
      socket.on('close', () => wsClients.delete(socket))
    })
  })

  const candidates = [
    path.resolve(__dirname, '../web'),
    path.resolve(__dirname, '../../dist/web'),
    path.resolve(process.cwd(), 'dist/web'),
  ]

  const staticRoot = candidates.find((p) => {
    try {
      return (
        fs.existsSync(path.join(p, 'index.html')) &&
        fs.existsSync(path.join(p, 'assets'))
      )
    } catch {
      return false
    }
  })

  lastStaticRoot = staticRoot ?? null

  if (staticRoot) {
    await app.register(fastifyStatic, {
      root: staticRoot,
      prefix: '/',
      wildcard: false,
    })

    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api') || req.url.startsWith('/ws')) {
        reply.status(404).send({ error: 'Not found' })
        return
      }
      reply.sendFile('index.html')
    })
  }

  if (!staticRoot) {
    console.warn(
      '\n\x1b[33m⚠️  Frontend build not found. Running in API-only mode.\x1b[0m',
    )
    console.warn(
      '   Looked in:\n   - ' + candidates.join('\n   - '),
    )
    console.warn('   Run `npm run build` in the package directory.\n')
  }

  return app
}
