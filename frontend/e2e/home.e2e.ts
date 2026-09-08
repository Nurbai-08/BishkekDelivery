import { expect, test } from '@playwright/test'

test('home page loads the Bishkek Delivery shell', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Bishkek Delivery/)
  await expect(page.locator('body')).toContainText('Bishkek Delivery')
})
