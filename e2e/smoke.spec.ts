import { test, expect } from '@playwright/test'

test('home loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Skill 管理器/ })).toBeVisible()
})

test('view=trash opens recycle bin from URL', async ({ page }) => {
  await page.goto('/?view=trash')
  await expect(page.getByRole('heading', { name: '回收站' })).toBeVisible({ timeout: 30_000 })
})

test('invalid view param is corrected to skills in URL', async ({ page }) => {
  await page.goto('/?view=not-a-real-tab')
  await expect(page).toHaveURL(/[?&]view=skills/)
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
