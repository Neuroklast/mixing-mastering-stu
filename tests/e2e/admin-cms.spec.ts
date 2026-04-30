import { test, expect } from '@playwright/test'

test.describe('Admin CMS', () => {
  test('admin-cms route is accessible', async ({ page }) => {
    const response = await page.goto('/admin-cms')
    expect(response?.status()).not.toBe(404)
  })

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin-cms')
    await expect(page.getByRole('heading', { name: /login/i }).or(
      page.getByText(/sign in/i)
    )).toBeVisible({ timeout: 10000 })
  })
})
