import { buildApp, broadcast, lastStaticRoot } from './app.js'
import { startWatcher } from './scanner/watcher.js'
import { invalidateCache } from './routes/skills.js'
import { fullScan } from './scanner/discovery.js'
import { purgeExpired as purgeExpiredTrash } from './trash/store.js'

const app = await buildApp()

// WebSocket broadcast for file watcher
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const watcherStarted = startWatcher((event) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    invalidateCache()
    broadcast({ type: 'change', event })
  }, 500)
})

// Try a range of ports on EADDRINUSE so a stale process doesn't brick startup.
async function listenWithRetry(startPort: number): Promise<number> {
  const maxAttempts = 5
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    try {
      await app.listen({ port, host: '127.0.0.1' })
      return port
    } catch (err: any) {
      if (err?.code === 'EADDRINUSE' && i < maxAttempts - 1) {
        console.warn(`\x1b[33m⚠️  Port ${port} in use, trying ${port + 1}...\x1b[0m`)
        continue
      }
      throw err
    }
  }
  throw new Error(`All ports ${startPort}-${startPort + maxAttempts - 1} in use`)
}

const basePort = parseInt(process.env.PORT || '3456')

try {
  const actualPort = await listenWithRetry(basePort)
  const url = `http://localhost:${actualPort}`

  try {
    const removed = await purgeExpiredTrash()
    if (removed > 0) {
      console.log(`\x1b[90m🗑  Purged ${removed} expired trash entr${removed === 1 ? 'y' : 'ies'}\x1b[0m`)
    }
  } catch {}

  let scanSummary = ''
  try {
    const result = await fullScan()
    const paths = result.scannedPaths
    const foundPaths = paths.filter((p) => p.count > 0)
    scanSummary =
      `\x1b[32m✅ Found ${result.stats.total} skills\x1b[0m ` +
      `(${foundPaths.length}/${paths.length} locations, ${result.durationMs}ms)`
    if (result.stats.total === 0) {
      scanSummary += '\n\x1b[33m⚠️  No skills found. Run `curl ' + url + '/api/debug` to see scanned paths.\x1b[0m'
    }
  } catch (e: any) {
    scanSummary = `\x1b[31m❌ Initial scan failed: ${e?.message || e}\x1b[0m`
  }

  console.log(`\n🚀 Claude Skill Hub running at \x1b[36m${url}\x1b[0m`)
  if (lastStaticRoot) {
    console.log(`🌐 Web UI:   \x1b[36m${url}\x1b[0m`)
  }
  console.log(`🔍 Debug:    \x1b[36m${url}/api/debug\x1b[0m`)
  console.log(scanSummary)
  if (watcherStarted) {
    console.log(`👀 File watcher active`)
  } else if (process.env.SKILL_HUB_DISABLE_WATCH === '1') {
    console.log(`👀 File watcher disabled (\x1b[33mSKILL_HUB_DISABLE_WATCH=1\x1b[0m)`)
  } else {
    console.log(`👀 File watcher off (no paths to watch)`)
  }
  console.log(`\x1b[90m💡 下次启动直接敲: \x1b[0m\x1b[36mskill-hub\x1b[0m\x1b[90m  (或访问 ${url})\x1b[0m\n`)

  if (lastStaticRoot && process.env.SKILL_HUB_NO_OPEN !== '1') {
    const { exec } = await import('child_process')
    const cmd = process.platform === 'darwin' ? 'open'
              : process.platform === 'win32' ? 'start'
              : 'xdg-open'
    exec(`${cmd} ${url}`, () => {})
  }
} catch (err) {
  console.error('\x1b[31m❌ Failed to start server:\x1b[0m', err)
  process.exit(1)
}
