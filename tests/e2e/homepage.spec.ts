import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads and shows SONORATIVA brand', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('SONORATIVA').first()).toBeVisible()
  })

  test('shows hero headline', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('PRECISION')).toBeVisible()
  })

  test('opens services modal on "View Services" click', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /view services/i }).click()
    await expect(page.getByText('SERVICE PACKAGES')).toBeVisible()
  })

  test('opens contact dialog on "Get Started" click', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /get started/i }).click()
    await expect(page.getByText('Get Started')).toBeVisible()
    await expect(page.getByLabelText(/name/i)).toBeVisible()
  })
})
