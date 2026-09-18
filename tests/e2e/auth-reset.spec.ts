import { test, expect } from '@playwright/test'

test.describe('Password reset', () => {
  test('login page links to the forgot password page', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByRole('link', { name: /forgot password/i }).click()
    await expect(page).toHaveURL(/\/auth\/forgot-password$/)
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
  })

  test('forgot password page shows the email form', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })

  test('reset password page rejects a missing or invalid link', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /request a new link/i })).toBeVisible()
  })
})
