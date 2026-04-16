/**
 * ClawHub-compatible registry bases (SkillHub / iFlytek uses the same API shape).
 *
 * Env:
 * - SKILL_HUB_CLAWHUB_REGISTRY — override default ClawHub (default https://clawhub.ai)
 * - SKILL_HUB_SKILLHUB_REGISTRY — SkillHub / 讯飞 (default https://skill.xfyun.cn)
 * - SKILL_HUB_CLAWHUB_CN_REGISTRY — ClawHub 中国镜像 (default https://mirror-cn.clawhub.com)
 *
 * @see https://skill.xfyun.cn/registry/skill.md
 */

export type ClawHubRegistryId = 'clawhub' | 'skillhub' | 'clawhub_cn'

const DEFAULT_CLAWHUB = 'https://clawhub.ai'
const DEFAULT_SKILLHUB = 'https://skill.xfyun.cn'
const DEFAULT_CLAWHUB_CN = 'https://mirror-cn.clawhub.com'

function normalizeBase(raw: string): string {
  const t = raw.trim()
  return t.endsWith('/') ? t.slice(0, -1) : t
}

export function resolveRegistryBase(id: ClawHubRegistryId): string {
  if (id === 'skillhub') {
    return normalizeBase(process.env.SKILL_HUB_SKILLHUB_REGISTRY || DEFAULT_SKILLHUB)
  }
  if (id === 'clawhub_cn') {
    return normalizeBase(process.env.SKILL_HUB_CLAWHUB_CN_REGISTRY || DEFAULT_CLAWHUB_CN)
  }
  return normalizeBase(process.env.SKILL_HUB_CLAWHUB_REGISTRY || DEFAULT_CLAWHUB)
}

export function parseRegistryId(raw: unknown): ClawHubRegistryId {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (s === 'skillhub') return 'skillhub'
  if (s === 'clawhub_cn' || s === 'clawhub-cn' || s === 'mirror-cn' || s === 'mirror_cn') {
    return 'clawhub_cn'
  }
  return 'clawhub'
}
