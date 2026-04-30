import { test, expect } from '@playwright/test'

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /get started/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /submit request/i }).click()
    await expect(page.getByText(/required/i)).toBeVisible()
  })

  test('fills and submits the contact form', async ({ page }) => {
    await page.getByLabel(/name/i).fill('Max Mustermann')
    await page.getByLabel(/email/i).fill('max@example.com')

    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /mixing/i }).click()

    await page.getByRole('button', { name: /submit request/i }).click()
  })
})
