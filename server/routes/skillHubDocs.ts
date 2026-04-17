import type { FastifyPluginAsync } from 'fastify'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getPackageRoot } from '../packageRoot.js'

export const BUNDLED_SKILL_IDS = [
  'skill-hub-search',
  'skill-hub-install',
  'skill-hub-library',
  'skill-hub-similarity',
] as const

export type BundledSkillId = (typeof BUNDLED_SKILL_IDS)[number]

function bundledSkillPath(id: string): string | null {
  if (!(BUNDLED_SKILL_IDS as readonly string[]).includes(id)) return null
  return path.join(getPackageRoot(), 'docs', 'bundled-agent-skills', id, 'SKILL.md')
}

export const skillHubDocsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/skill-hub/docs', async () => {
    const items: { id: string; name: string; description: string }[] = []
    for (const id of BUNDLED_SKILL_IDS) {
      const p = bundledSkillPath(id)
      if (!p || !fs.existsSync(p)) continue
      try {
        const raw = fs.readFileSync(p, 'utf8')
        const { data } = matter(raw)
        items.push({
          id,
          name: typeof data.name === 'string' ? data.name : id,
          description: typeof data.description === 'string' ? data.description : '',
        })
      } catch {
        /* skip invalid frontmatter / IO */
      }
    }
    return { ok: true as const, items }
  })

  app.get<{ Params: { id: string } }>('/api/skill-hub/docs/:id', async (req, reply) => {
    const id = req.params.id
    const p = bundledSkillPath(id)
    if (!p || !fs.existsSync(p)) {
      return reply.code(404).send({ ok: false as const, error: 'not_found' })
    }
    let raw: string
    let data: Record<string, unknown>
    let content: string
    try {
      raw = fs.readFileSync(p, 'utf8')
      const parsed = matter(raw)
      data = parsed.data as Record<string, unknown>
      content = parsed.content
    } catch {
      return reply.code(404).send({ ok: false as const, error: 'not_found' })
    }
    return {
      ok: true as const,
      id,
      name: typeof data.name === 'string' ? data.name : id,
      description: typeof data.description === 'string' ? data.description : '',
      bodyMarkdown: content.trim(),
    }
  })
}
