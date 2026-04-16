import path from 'path'

/** Agents we support for one-click install from marketplaces (matches scanner global paths). */
export type InstallAgentTarget = 'claude-code' | 'cursor'

const SUBDIR: Record<InstallAgentTarget, string> = {
  'claude-code': '.claude/skills',
  cursor: '.cursor/skills',
}

export function parseInstallTarget(raw: unknown): InstallAgentTarget {
  if (raw === 'cursor') return 'cursor'
  return 'claude-code'
}

/** e.g. ~/.claude/skills/my-skill or ~/.cursor/skills/my-skill */
export function globalSkillInstallDir(agent: InstallAgentTarget, skillFolderName: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(home, SUBDIR[agent], skillFolderName)
}
