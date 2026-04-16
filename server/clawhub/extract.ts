import { unzipSync } from 'fflate'
import fs from 'fs/promises'
import path from 'path'

/** Cap per extracted file (zip bomb / memory guard) */
const MAX_FILE_BYTES = 1_000_000

function sanitizeZipEntryPath(raw: string): string | null {
  const normalized = raw.replace(/^\.\/+/, '').replace(/^\/+/, '')
  if (!normalized || normalized.endsWith('/')) return null
  if (normalized.includes('..') || normalized.includes('\\')) return null
  return normalized
}

/**
 * Extract a ClawHub skill zip into targetDir with traversal protection.
 */
export async function extractClawHubZip(
  zipBytes: Uint8Array,
  targetDir: string,
): Promise<{ filesWritten: number }> {
  let entries: Record<string, Uint8Array>
  try {
    entries = unzipSync(zipBytes)
  } catch {
    throw new Error('无效的 zip 文件')
  }
  let filesWritten = 0
  await fs.mkdir(targetDir, { recursive: true })

  for (const [rawPath, data] of Object.entries(entries)) {
    const safe = sanitizeZipEntryPath(rawPath)
    if (!safe) continue
    if (data.byteLength > MAX_FILE_BYTES) continue

    const dest = path.join(targetDir, ...safe.split('/'))
    const resolved = path.resolve(dest)
    const resolvedRoot = path.resolve(targetDir)
    if (!resolved.startsWith(resolvedRoot + path.sep) && resolved !== resolvedRoot) {
      continue
    }

    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.writeFile(dest, data)
    filesWritten++
  }

  return { filesWritten }
}
