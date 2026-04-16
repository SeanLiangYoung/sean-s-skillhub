import { isReservedMarketplaceId, validateHttpsRegistryUrl } from './ssrf.js'

export type MarketplaceProviderKind =
  | 'clawhub-http'
  | 'cli'
  | 'link-only'
  | 'agent-guided'

export type MarketplaceProviderDescriptor = {
  id: string
  label: string
  kind: MarketplaceProviderKind
  /** For clawhub-http: query param value for /api/clawhub/* */
  registry?: string
  description?: string
  group: 'http' | 'cli' | 'browse'
  /** Public web origin for skill detail links (clawhub-http) */
  webBase?: string
}

export type CustomHttpPreset = {
  id: string
  label: string
  baseUrl: string
}

let _customCache: CustomHttpPreset[] | null = null

function loadCustomHttpPresetsFromEnv(): CustomHttpPreset[] {
  const raw = process.env.SKILL_HUB_MARKETPLACE_PRESETS_JSON?.trim()
  if (!raw) return []
  try {
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    const out: CustomHttpPreset[] = []
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue
      const rec = item as Record<string, unknown>
      const id = String(rec.id ?? '').trim()
      const kind = String(rec.kind ?? '').trim()
      const label = String(rec.label ?? id).trim()
      const baseUrl = String(rec.baseUrl ?? '').trim()
      if (!id || kind !== 'clawhub-http') continue
      if (isReservedMarketplaceId(id)) {
        console.warn(`[marketplace] skip preset id "${id}" (reserved)`)
        continue
      }
      const v = validateHttpsRegistryUrl(baseUrl)
      if (!v.ok) {
        console.warn(`[marketplace] skip preset "${id}": ${v.error}`)
        continue
      }
      out.push({ id, label, baseUrl: v.origin })
    }
    return out
  } catch (e) {
    console.warn('[marketplace] SKILL_HUB_MARKETPLACE_PRESETS_JSON parse error', e)
    return []
  }
}

export function getCustomHttpPresets(): CustomHttpPreset[] {
  if (_customCache === null) {
    _customCache = loadCustomHttpPresetsFromEnv()
  }
  return _customCache
}

export function getBuiltinMarketplaceProviders(): MarketplaceProviderDescriptor[] {
  return [
    {
      id: 'clawhub',
      label: 'ClawHub',
      kind: 'clawhub-http',
      registry: 'clawhub',
      description: 'clawhub.ai 公开 Skill，ZIP 安装到本机（默认，无需 LLM）。',
      group: 'http',
      webBase: 'https://clawhub.ai',
    },
    {
      id: 'clawhub_cn',
      label: 'ClawHub 中国镜像',
      kind: 'clawhub-http',
      registry: 'clawhub_cn',
      description: 'OpenClaw 中国镜像，低延迟；API 与 ClawHub 兼容。可用 SKILL_HUB_CLAWHUB_CN_REGISTRY 覆盖。',
      group: 'http',
      webBase: 'https://mirror-cn.clawhub.com',
    },
    {
      id: 'skillhub',
      label: 'SkillHub（讯飞）',
      kind: 'clawhub-http',
      registry: 'skillhub',
      description: 'skill.xfyun.cn，ClawHub 兼容 API；可设 SKILL_HUB_SKILLHUB_REGISTRY。',
      group: 'http',
      webBase: 'https://skill.xfyun.cn',
    },
    {
      id: 'skillhubcn',
      label: 'Skillhub 商店',
      kind: 'cli',
      description: 'skillhub.cn，需本机安装 skillhub CLI。',
      group: 'cli',
    },
    {
      id: 'link-catalog',
      label: '更多市场（外链目录）',
      kind: 'link-only',
      description: '国内技能站与云厂商门户的索引卡片，浏览器打开；无统一 API 的站点在此浏览。',
      group: 'browse',
    },
    {
      id: 'agent-guided',
      label: '智能体发现（可选）',
      kind: 'agent-guided',
      description: '复制提示词到 Cursor / Claude，由 LLM 在网页中代搜；未配置 LLM 时仍可使用上方 ClawHub 类市场。',
      group: 'browse',
    },
  ]
}

export function getMergedMarketplaceProviders(): MarketplaceProviderDescriptor[] {
  const base = getBuiltinMarketplaceProviders()
  const custom = getCustomHttpPresets()
  const extra: MarketplaceProviderDescriptor[] = custom.map((c) => ({
    id: c.id,
    label: c.label,
    kind: 'clawhub-http',
    registry: c.id,
    description: `自定义 ClawHub 兼容端点（来自 SKILL_HUB_MARKETPLACE_PRESETS_JSON）。`,
    group: 'http',
    webBase: c.baseUrl,
  }))
  return [...base, ...extra]
}
