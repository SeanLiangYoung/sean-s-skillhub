import { test, expect } from '@playwright/test'

test('home loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Skill 管理器/ })).toBeVisible()
})

test('fixture skill appears after scan', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('CI Minimal Skill')).toBeVisible({ timeout: 120_000 })
})

test('health API', async ({ request }) => {
  const res = await request.get('/api/health')
  expect(res.ok()).toBeTruthy()
  await expect(res.json()).resolves.toEqual({ status: 'ok' })
})
