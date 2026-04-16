/** Curated skill / agent market portals (no unified REST API in Skill Hub). */

export type LinkCatalogTier = 1 | 2 | 3

export type LinkCatalogEntry = {
  id: string
  name: string
  url: string
  tier: LinkCatalogTier
  blurb: string
}

export const MARKETPLACE_LINK_CATALOG: LinkCatalogEntry[] = [
  {
    id: 'tencent-skillhub',
    name: '腾讯 SkillHub',
    url: 'https://skillhub.tencent.com',
    tier: 3,
    blurb: '认证技能多，全中文，安全审计',
  },
  {
    id: 'clawhub-mirror-cn',
    name: 'ClawHub 中国镜像',
    url: 'https://mirror-cn.clawhub.com',
    tier: 3,
    blurb: 'OpenClaw 官方中国镜像，低延迟',
  },
  {
    id: 'iflytek-skillhub-oss',
    name: '科大讯飞 SkillHub（开源）',
    url: 'https://github.com/iflytek/SkillHub',
    tier: 3,
    blurb: '开源，Docker/K8s 企业自部署',
  },
  {
    id: 'cocoloop',
    name: 'CocoLoop Skill Hub',
    url: 'https://hub.cocoloop.cn',
    tier: 3,
    blurb: 'OpenClaw 社区，人工精选',
  },
  {
    id: 'doubao',
    name: '豆包技能广场',
    url: 'https://www.doubao.com/skills',
    tier: 3,
    blurb: '中文场景，办公/生活/创作',
  },
  {
    id: 'openclaw-cn',
    name: 'OpenClaw-CN',
    url: 'https://clwd.org.cn',
    tier: 2,
    blurb: '中文自建市场，支持自发布',
  },
  {
    id: 'clawskills',
    name: 'ClawSkills',
    url: 'https://clawskills.sh',
    tier: 2,
    blurb: '精选技能聚合',
  },
  {
    id: 'molili',
    name: 'Molili Skills',
    url: 'https://skill.molili.com.cn',
    tier: 2,
    blurb: '本土化中文技能',
  },
  {
    id: 'aliyun',
    name: '阿里云 Agent 技能中心',
    url: 'https://developer.aliyun.com/skill',
    tier: 2,
    blurb: '阿里云生态与企业向',
  },
  {
    id: 'baidu-duclaw',
    name: '百度智能云 DuClaw',
    url: 'https://console.bce.baidu.com/qianfan/skills',
    tier: 2,
    blurb: '文心大模型与中文办公技能',
  },
  {
    id: 'qoder',
    name: 'Qoder 社区技能库',
    url: 'https://qoder-community.pages.dev/zh/skills/',
    tier: 1,
    blurb: '开发者向分类索引',
  },
  {
    id: 'huawei',
    name: '华为云鸿蒙 Agent Hub',
    url: 'https://developer.huaweicloud.com/skills',
    tier: 1,
    blurb: '鸿蒙与华为云生态',
  },
  {
    id: '360',
    name: '360 智慧技能市场',
    url: 'https://ai.360.cn/skills',
    tier: 1,
    blurb: '安全类技能',
  },
]
