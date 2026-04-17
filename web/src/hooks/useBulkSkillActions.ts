import { useCallback, useEffect, useState } from 'react'
import type { Skill } from './useSkills'
import type { AppView } from '../types/appView'

export interface UseBulkSkillActionsOptions {
  view: AppView
  allSkills: Skill[]
  skills: Skill[]
  scan: () => Promise<void>
  refreshTrashCount: () => Promise<void>
}

/**
 * Skills 列表与冲突页共用的批量选择与批量删除；切换顶栏视图时清空状态，避免残留选择。
 */
export function useBulkSkillActions({
  view,
  allSkills,
  skills,
  scan,
  refreshTrashCount,
}: UseBulkSkillActionsOptions) {
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteResult, setBulkDeleteResult] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    setSelectMode(false)
    setSelectedIds(new Set())
    setBulkDeleteConfirm(false)
    setBulkDeleteResult(null)
  }, [view])

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) setSelectedIds(new Set())
      return !prev
    })
    setBulkDeleteResult(null)
  }, [])

  const handleSelectToggle = useCallback((skill: Skill) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(skill.id)) next.delete(skill.id)
      else next.add(skill.id)
      return next
    })
  }, [])

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(skills.map((s) => s.id)))
  }, [skills])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const performBulkDelete = useCallback(async () => {
    setBulkDeleting(true)
    setBulkDeleteResult(null)
    try {
      const items = Array.from(selectedIds)
        .map((id) => allSkills.find((s) => s.id === id))
        .filter((s): s is Skill => !!s)
        .map((s) => ({ id: s.id, path: s.path, skillName: s.name }))

      const res = await fetch('/api/skills/batch/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!data.ok && !data.results) {
        setBulkDeleteResult({ kind: 'err', text: data.error || '批量删除失败' })
        return
      }
      const okCount: number = data.okCount ?? 0
      const failCount: number = data.failCount ?? 0
      if (failCount === 0) {
        setBulkDeleteResult({ kind: 'ok', text: `已删除 ${okCount} 个 Skill,可在回收站恢复` })
      } else {
        setBulkDeleteResult({ kind: 'err', text: `成功 ${okCount},失败 ${failCount}` })
      }
      setBulkDeleteConfirm(false)
      setSelectedIds(new Set())
      setSelectMode(false)
      await scan()
      await refreshTrashCount()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '请求失败'
      setBulkDeleteResult({ kind: 'err', text: msg })
    } finally {
      setBulkDeleting(false)
    }
  }, [allSkills, refreshTrashCount, scan, selectedIds])

  return {
    selectMode,
    setSelectMode,
    selectedIds,
    setSelectedIds,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    bulkDeleting,
    bulkDeleteResult,
    setBulkDeleteResult,
    toggleSelectMode,
    handleSelectToggle,
    selectAllVisible,
    clearSelection,
    performBulkDelete,
  }
}
