/**
 * Validate user-supplied registry base URLs (SSRF mitigation for custom HTTP presets).
 */

function isPrivateOrLoopbackIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!m) return false
  const a = Number(m[1])
  const b = Number(m[2])
  const c = Number(m[3])
  const d = Number(m[4])
  if ([a, b, c, d].some((x) => x > 255)) return true
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

const RESERVED = new Set([
  'clawhub',
  'skillhub',
  'clawhub_cn',
  'skillhubcn',
  'link-catalog',
  'agent-guided',
])

export function isReservedMarketplaceId(id: string): boolean {
  return RESERVED.has(id.trim().toLowerCase())
}

export type ValidateHttpsUrlResult =
  | { ok: true; origin: string }
  | { ok: false; error: string }

/**
 * Accepts only https origins; blocks obvious local/private hosts and link-local.
 */
export function validateHttpsRegistryUrl(raw: string): ValidateHttpsUrlResult {
  const t = raw.trim()
  if (!t) return { ok: false, error: '空 URL' }
  let u: URL
  try {
    u = new URL(t)
  } catch {
    return { ok: false, error: '无效 URL' }
  }
  if (u.protocol !== 'https:') {
    return { ok: false, error: '仅支持 https' }
  }
  const host = u.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local')
  ) {
    return { ok: false, error: '禁止本地主机名' }
  }
  if (isPrivateOrLoopbackIpv4(host)) {
    return { ok: false, error: '禁止内网或保留地址' }
  }
  const origin = `${u.protocol}//${u.host}`
  return { ok: true, origin }
}
