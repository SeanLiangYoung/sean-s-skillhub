import { describe, expect, it } from 'vitest'
import { isAppView, parseViewFromSearch } from './appViewUrl'

describe('appViewUrl', () => {
  it('parseViewFromSearch accepts known views', () => {
    expect(parseViewFromSearch('?view=trash')).toBe('trash')
    expect(parseViewFromSearch('view=marketplace')).toBe('marketplace')
    expect(parseViewFromSearch('?view=conflicts')).toBe('conflicts')
  })

  it('parseViewFromSearch returns null when missing or invalid', () => {
    expect(parseViewFromSearch('')).toBeNull()
    expect(parseViewFromSearch('?foo=1')).toBeNull()
    expect(parseViewFromSearch('?view=hack')).toBeNull()
  })

  it('isAppView', () => {
    expect(isAppView('skills')).toBe(true)
    expect(isAppView('marketplace')).toBe(true)
    expect(isAppView('clawhub')).toBe(false)
  })
})
