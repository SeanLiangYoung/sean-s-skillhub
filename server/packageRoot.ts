import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Directory containing the npm package root (`package.json` with `name: claude-skill-hub`).
 * Works for both `server/*.ts` (tsx) and `dist/server/*.js`.
 */
export function getPackageRoot(): string {
  let dir = __dirname
  for (let i = 0; i < 14; i++) {
    const pkgPath = path.join(dir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const j = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string }
        if (j.name === 'claude-skill-hub') return dir
      } catch {
        /* try parent */
      }
    }
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
  throw new Error('claude-skill-hub package root not found')
}
