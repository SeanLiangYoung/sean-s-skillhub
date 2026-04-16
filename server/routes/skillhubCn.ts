import type { FastifyInstance } from 'fastify'
import path from 'path'
import { spawn } from 'node:child_process'
import { globalSkillInstallDir, parseInstallTarget, type InstallAgentTarget } from '../installPaths.js'
import { invalidateCache } from './skills.js'

/** @see https://skillhub.cn/install/skillhub.md */
const INSTALL_SCRIPT =
  'curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash'

function skillhubCommand(): string {
  return 'skillhub'
}

function runSkillhub(
  args: string[],
  options?: { cwd?: string; timeoutMs?: number },
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const cmd = skillhubCommand()
    const child = spawn(cmd, args, {
      cwd: options?.cwd,
      env: { ...process.env },
    })
    const timeoutMs = options?.timeoutMs ?? 120_000
    const to = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('skillhub 命令超时'))
    }, timeoutMs)
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d) => {
      stdout += String(d)
    })
    child.stderr?.on('data', (d) => {
      stderr += String(d)
    })
    child.on('error', (e) => {
      clearTimeout(to)
      reject(e)
    })
    child.on('close', (code) => {
      clearTimeout(to)
      resolve({ code: code ?? 1, stdout, stderr })
    })
  })
}

function isSafeInstallName(name: string): boolean {
  const s = name.trim()
  if (!s || s.length > 200) return false
  if (s.includes('..') || s.includes('/') || s.includes('\\')) return false
  return true
}

export async function skillhubCnRoutes(app: FastifyInstance) {
  app.get('/api/skillhub-cn/status', async () => {
    try {
      const { code, stdout, stderr } = await runSkillhub(['--version'], { timeoutMs: 15_000 })
      const ok = code === 0 || /skillhub|version|\d+\.\d+/i.test(stdout + stderr)
      return {
        ok: true,
        available: ok,
        hint: ok ? undefined : '未检测到 skillhub CLI，请先在本机执行官方安装脚本。',
        installScript: INSTALL_SCRIPT,
        versionLine: (stdout + stderr).trim().slice(0, 500) || null,
      }
    } catch {
      return {
        ok: true,
        available: false,
        hint: '未检测到 skillhub CLI（可能未安装或不在 PATH）。',
        installScript: INSTALL_SCRIPT,
        versionLine: null,
      }
    }
  })

  app.get<{
    Querystring: { q?: string }
  }>('/api/skillhub-cn/search', async (req, reply) => {
    const q = (req.query.q || '').trim()
    if (!q) {
      return reply.status(400).send({ ok: false, error: '缺少搜索关键词 q' })
    }
    try {
      const { code, stdout, stderr } = await runSkillhub(['search', q], { timeoutMs: 90_000 })
      const text = stdout + (stderr ? `\n${stderr}` : '')
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
      return {
        ok: true,
        data: {
          raw: text.slice(0, 12_000),
          lines: lines.slice(0, 200),
          exitCode: code,
        },
      }
    } catch (e: any) {
      const msg = e?.code === 'ENOENT' ? '未找到 skillhub 命令，请先执行官方安装脚本。' : e?.message || '执行失败'
      return reply.status(503).send({
        ok: false,
        code: e?.code === 'ENOENT' ? 'NO_CLI' : undefined,
        error: msg,
        installScript: INSTALL_SCRIPT,
      })
    }
  })

  app.post<{
    Body: { name?: string; target?: string }
  }>('/api/skillhub-cn/install', async (req, reply) => {
    const name = (req.body?.name || '').trim()
    const agent: InstallAgentTarget = parseInstallTarget(req.body?.target)

    if (!isSafeInstallName(name)) {
      return reply.status(400).send({ ok: false, error: '非法技能名称' })
    }

    const baseDir = path.dirname(globalSkillInstallDir(agent, '_'))

    try {
      const { code, stdout, stderr } = await runSkillhub(['install', name], {
        cwd: baseDir,
        timeoutMs: 180_000,
      })
      const log = (stdout + stderr).slice(0, 8000)
      if (code !== 0) {
        return reply.status(500).send({
          ok: false,
          error: stderr.slice(0, 2000) || stdout.slice(0, 2000) || `skillhub 退出码 ${code}`,
          log,
        })
      }
      invalidateCache()
      return {
        ok: true,
        agent,
        message: `已通过 skillhub CLI 安装到 ${baseDir}（见日志）`,
        log,
      }
    } catch (e: any) {
      if (e?.code === 'ENOENT') {
        return reply.status(503).send({
          ok: false,
          code: 'NO_CLI',
          error: '未找到 skillhub 命令，请先在本机执行官方安装脚本。',
          installScript: INSTALL_SCRIPT,
        })
      }
      return reply.status(500).send({ ok: false, error: e?.message || '执行失败' })
    }
  })
}
