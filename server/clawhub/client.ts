/**
 * ClawHub HTTP client: retries on 429, optional Bearer token, short GET cache.
 *
 * Env:
 * - SKILL_HUB_CLAWHUB_TOKEN — optional; Bearer for ClawHub / SkillHub APIs (see clawhub login).
 * - SKILL_HUB_CLAWHUB_REGISTRY — default ClawHub base (see ../clawhub/registry.ts)
 * - SKILL_HUB_SKILLHUB_REGISTRY — SkillHub (讯飞) base, default https://skill.xfyun.cn
 */

import { resolveRegistryBase } from './registry.js'

const GET_CACHE_TTL_MS = 45_000
const MAX_429_RETRIES = 4
const cache = new Map<string, { expires: number; status: number; body: string }>()

/** Default ClawHub registry (backward compatible). */
export function registryBase(): string {
  return resolveRegistryBase('clawhub')
}

export function apiUrl(path: string, base?: string): string {
  const b = base || registryBase()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

function parseRetryAfterMs(res: Response): number | null {
  const ra = res.headers.get('retry-after') || res.headers.get('Retry-After')
  if (!ra) return null
  const sec = parseInt(ra.trim(), 10)
  if (Number.isFinite(sec) && sec >= 0) return Math.min(sec * 1000, 120_000)
  const date = Date.parse(ra)
  if (Number.isFinite(date)) {
    const ms = date - Date.now()
    return ms > 0 ? Math.min(ms, 120_000) : null
  }
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export type FetchClawHubOptions = RequestInit & {
  /** In-memory GET response cache (not Fetch API cache). Default true. Set false for install/metadata. */
  clawhubMemoryCache?: boolean
  /** Resolve API calls against this registry base (ClawHub-compatible). */
  registryBase?: string
}

/**
 * GET/POST to ClawHub. Relative paths are resolved against the registry base.
 * Retries on HTTP 429 using Retry-After or exponential backoff.
 */
export async function fetchClawHub(pathOrUrl: string, init?: FetchClawHubOptions): Promise<Response> {
  const base = init?.registryBase
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : apiUrl(pathOrUrl, base)
  const method = (init?.method || 'GET').toUpperCase()
  const useCache = method === 'GET' && init?.clawhubMemoryCache !== false

  if (useCache) {
    const hit = cache.get(url)
    if (hit && hit.expires > Date.now()) {
      return new Response(hit.body, { status: hit.status })
    }
  }

  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  headers.set('User-Agent', 'claude-skill-hub/0.3 (ClawHub integration)')
  const token = process.env.SKILL_HUB_CLAWHUB_TOKEN?.trim()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const { clawhubMemoryCache: _mem, registryBase: _rb, ...restInit } = init || {}

  let lastRes!: Response
  for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
    const res = await fetch(url, {
      ...restInit,
      method,
      headers,
    })
    lastRes = res

    if (res.status !== 429) {
      if (useCache && res.ok) {
        const body = await res.clone().text()
        cache.set(url, { expires: Date.now() + GET_CACHE_TTL_MS, status: res.status, body })
        return new Response(body, { status: res.status })
      }
      return res
    }

    if (attempt >= MAX_429_RETRIES) break

    await res.text().catch(() => {})
    const fromHeader = parseRetryAfterMs(res)
    const backoff = Math.min(8000, 1000 * Math.pow(2, attempt))
    const jitter = Math.floor(Math.random() * 250)
    const wait = (fromHeader ?? backoff) + jitter
    await sleep(wait)
  }

  return lastRes
}

export function clearClawHubGetCache(): void {
  cache.clear()
}
