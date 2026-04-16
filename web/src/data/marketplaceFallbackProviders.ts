import type { MarketplaceProviderInfo } from '../types/marketplace'

/** Client fallback when GET /api/marketplace/providers fails (offline / API-only). Mirrors server presets. */
export const MARKETPLACE_PROVIDERS_FALLBACK: MarketplaceProviderInfo[] = [
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
    description:
      '复制提示词到 Cursor / Claude，由 LLM 在网页中代搜；未配置 LLM 时仍可使用上方 ClawHub 类市场。',
    group: 'browse',
  },
]
