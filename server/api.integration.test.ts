import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from './app.js'
import { invalidateCache } from './routes/skills.js'
import type { FastifyInstance } from 'fastify'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** Parent directory: each immediate subfolder with SKILL.md is one skill (see discovery `scanSkillDir`). */
const fixtureSkillDir = path.resolve(__dirname, '../test/fixtures/extra-skills-root')

describe('HTTP API (inject)', () => {
  let app: FastifyInstance
  let prevExtra: string | undefined

  beforeAll(async () => {
    prevExtra = process.env.SKILL_HUB_EXTRA_PATHS
    process.env.SKILL_HUB_EXTRA_PATHS = fixtureSkillDir
    invalidateCache()
    app = await buildApp()
  })

  afterAll(async () => {
    if (prevExtra === undefined) delete process.env.SKILL_HUB_EXTRA_PATHS
    else process.env.SKILL_HUB_EXTRA_PATHS = prevExtra
    invalidateCache()
    await app.close()
  })

  it('GET /api/health', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('GET /api/marketplace/providers', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/marketplace/providers' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { ok?: boolean; providers?: unknown[] }
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.providers)).toBe(true)
    expect((body.providers as { id: string }[]).some((p) => p.id === 'clawhub')).toBe(true)
  })

  it('GET /api/scan includes fixture skill', { timeout: 120_000 }, async () => {
    invalidateCache()
    const res = await app.inject({ method: 'GET', url: '/api/scan' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { skills?: { name: string; path: string }[]; stats?: { total: number } }
    expect(body.stats?.total).toBeGreaterThanOrEqual(1)
    const names = (body.skills || []).map((s) => s.name)
    expect(names).toContain('CI Minimal Skill')
    const paths = (body.skills || []).map((s) => s.path)
    expect(paths.some((p) => p.includes('extra-skills-root'))).toBe(true)
  })
})
