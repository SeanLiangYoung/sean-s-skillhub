import { describe, it, expect } from 'vitest'
import { validateHttpsRegistryUrl, isReservedMarketplaceId } from './ssrf.js'

describe('validateHttpsRegistryUrl', () => {
  it('rejects empty input', () => {
    const r = validateHttpsRegistryUrl('')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/空/)
  })

  it('rejects non-https', () => {
    const r = validateHttpsRegistryUrl('http://example.com/')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/https/)
  })

  it('rejects localhost hostnames', () => {
    expect(validateHttpsRegistryUrl('https://localhost/foo').ok).toBe(false)
    expect(validateHttpsRegistryUrl('https://app.localhost/x').ok).toBe(false)
  })

  it('rejects private IPv4 literals', () => {
    expect(validateHttpsRegistryUrl('https://127.0.0.1/').ok).toBe(false)
    expect(validateHttpsRegistryUrl('https://192.168.1.1/').ok).toBe(false)
    expect(validateHttpsRegistryUrl('https://10.0.0.1/').ok).toBe(false)
  })

  it('accepts public https origins', () => {
    const r = validateHttpsRegistryUrl('https://registry.example.com/v1/')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.origin).toBe('https://registry.example.com')
  })
})

describe('isReservedMarketplaceId', () => {
  it('matches built-in ids case-insensitively', () => {
    expect(isReservedMarketplaceId('clawhub')).toBe(true)
    expect(isReservedMarketplaceId('ClawHub')).toBe(true)
    expect(isReservedMarketplaceId('link-catalog')).toBe(true)
  })

  it('returns false for arbitrary ids', () => {
    expect(isReservedMarketplaceId('my-custom-registry')).toBe(false)
  })
})
