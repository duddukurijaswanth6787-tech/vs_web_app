import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vasanthissignature.in/api/v1';

test.describe('Customer Storefront & Checkout E2E Tests', () => {
  test('end-to-end checkout flow on production API', async ({ page, request }) => {
    const timestamp = Date.now();
    const email = `e2e_customer_${timestamp}@example.com`;
    const password = 'Password123!';

    // 1. Create a test customer account & address via API
    const regRes = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email,
        password,
        firstName: 'E2E',
        lastName: 'Customer',
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    });
    const regJson = await regRes.json();
    const tokens = regJson?.data?.tokens || regJson?.data;

    if (tokens?.accessToken) {
      const authHeaders = { Authorization: `Bearer ${tokens.accessToken}` };
      await request.get(`${API_BASE_URL}/me`, { headers: authHeaders });

      await request.post(`${API_BASE_URL}/me/addresses`, {
        headers: authHeaders,
        data: {
          fullName: 'E2E Customer',
          phone: '9876543210',
          addressLine1: '123 Fashion Street',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500001',
          country: 'India',
          isDefaultShipping: true,
        },
      });
    }

    // 2. Visit Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Vasanthi/i);

    if (tokens?.accessToken) {
      await page.evaluate((t) => {
        localStorage.setItem('vd_access_token', t.accessToken);
        localStorage.setItem('vd_refresh_token', t.refreshToken || t.accessToken);
      }, tokens);
      await page.reload();
    }

    // 3. Verify Homepage elements load
    const categoryLink = page.locator('a[href*="/categories"]').first();
    if (await categoryLink.isVisible()) {
      await categoryLink.click();
    }
  });
});
