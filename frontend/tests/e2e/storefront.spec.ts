import { test, expect } from '@playwright/test';

test.describe('Storefront E2E Health & Navigation', () => {
  test('loads homepage and displays branding and categories', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vasanthi/i);
    
    // Check header
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check category section
    const shopByCat = page.getByText(/Shop by Category/i);
    await expect(shopByCat).toBeVisible();
  });

  test('loads categories page', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });
});
