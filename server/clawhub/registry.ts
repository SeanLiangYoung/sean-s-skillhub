/**
 * ClawHub-compatible registry bases (SkillHub / iFlytek uses the same API shape).
 *
 * Env:
 * - SKILL_HUB_CLAWHUB_REGISTRY — override default ClawHub (default https://clawhub.ai)
 * - SKILL_HUB_SKILLHUB_REGISTRY — SkillHub / 讯飞 (default https://skill.xfyun.cn)
 *
 * @see https://skill.xfyun.cn/registry/skill.md
 */

export type ClawHubRegistryId = 'clawhub' | 'skillhub'

const DEFAULT_CLAWHUB = 'https://clawhub.ai'
const DEFAULT_SKILLHUB = 'https://skill.xfyun.cn'

function normalizeBase(raw: string): string {
  const t = raw.trim()
  return t.endsWith('/') ? t.slice(0, -1) : t
}

export function resolveRegistryBase(id: ClawHubRegistryId): string {
  if (id === 'skillhub') {
    return normalizeBase(process.env.SKILL_HUB_SKILLHUB_REGISTRY || DEFAULT_SKILLHUB)
  }
  return normalizeBase(process.env.SKILL_HUB_CLAWHUB_REGISTRY || DEFAULT_CLAWHUB)
}

export function parseRegistryId(raw: unknown): ClawHubRegistryId {
  if (raw === 'skillhub') return 'skillhub'
  return 'clawhub'
}
