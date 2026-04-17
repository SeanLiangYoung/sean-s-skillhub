import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let cached: string | null = null

/** Application version from repository `package.json` (same as npm package version). */
export function getAppVersion(): string {
  if (cached) return cached
  const pkgPath = path.resolve(__dirname, '../../package.json')
  const raw = fs.readFileSync(pkgPath, 'utf8')
  cached = JSON.parse(raw).version as string
  return cached
}
