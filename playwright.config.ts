import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, devices } from '@playwright/test'

const root = path.dirname(fileURLToPath(import.meta.url))
const fixtureSkillDir = path.join(root, 'test/fixtures/extra-skills-root')

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3799',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node dist/server/index.js',
    cwd: root,
    env: {
      ...process.env,
      PORT: '3799',
      SKILL_HUB_NO_OPEN: '1',
      SKILL_HUB_DISABLE_WATCH: '1',
      SKILL_HUB_EXTRA_PATHS: fixtureSkillDir,
    },
    url: 'http://127.0.0.1:3799/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
