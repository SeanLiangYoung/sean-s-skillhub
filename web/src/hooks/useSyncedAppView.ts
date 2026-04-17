import { useCallback, useEffect, useState } from 'react'
import type { AppView } from '../types/appView'
import { APP_VIEW_QUERY_KEY, readViewFromWindow } from '../utils/appViewUrl'

/**
 * 顶栏视图与 `?view=` 查询参数同步：支持书签、刷新保持、浏览器前进后退。
 * 合法值：skills | similar | dashboard | trash | conflicts | marketplace；非法值回退为 skills 并 replaceState。
 */
export function useSyncedAppView() {
  const [view, setViewState] = useState<AppView>(() => readViewFromWindow().view)

  useEffect(() => {
    const { invalidParam } = readViewFromWindow()
    if (!invalidParam) return
    const url = new URL(window.location.href)
    url.searchParams.set(APP_VIEW_QUERY_KEY, 'skills')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }, [])

  useEffect(() => {
    const onPopState = () => {
      setViewState(readViewFromWindow().view)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setView = useCallback((next: AppView) => {
    setViewState(next)
    const url = new URL(window.location.href)
    url.searchParams.set(APP_VIEW_QUERY_KEY, next)
    window.history.pushState({ appView: next }, '', url.pathname + url.search + url.hash)
  }, [])

  return { view, setView }
}
