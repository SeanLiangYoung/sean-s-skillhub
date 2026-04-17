import type { AppView } from '../types/appView'

/** 查询参数名，与顶栏 `AppView` 同步 */
export const APP_VIEW_QUERY_KEY = 'view' as const

const APP_VIEWS: readonly AppView[] = [
  'skills',
  'similar',
  'dashboard',
  'trash',
  'conflicts',
  'marketplace',
] as const

export function isAppView(s: string): s is AppView {
  return (APP_VIEWS as readonly string[]).includes(s)
}

/** 从 `location.search` 解析 `view`；缺失或非法时返回 `null`（调用方用默认 `skills`） */
export function parseViewFromSearch(search: string): AppView | null {
  const q = search.startsWith('?') ? search.slice(1) : search
  const raw = new URLSearchParams(q).get(APP_VIEW_QUERY_KEY)
  if (!raw) return null
  return isAppView(raw) ? raw : null
}

/**
 * 读取当前窗口 URL 中的视图；`view` 缺失视为 skills；
 * `view` 存在但非法时返回 skills 且 `invalidParam: true`（应用应 replaceState 修正）。
 */
export function readViewFromWindow(): { view: AppView; invalidParam: boolean } {
  if (typeof window === 'undefined') {
    return { view: 'skills', invalidParam: false }
  }
  const raw = new URLSearchParams(window.location.search).get(APP_VIEW_QUERY_KEY)
  if (!raw) return { view: 'skills', invalidParam: false }
  if (isAppView(raw)) return { view: raw, invalidParam: false }
  return { view: 'skills', invalidParam: true }
}
