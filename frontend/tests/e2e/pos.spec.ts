import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vasanthissignature.in/api/v1';

test.describe('POS Counter Billing System E2E Suite', () => {
  test('authenticates staff/admin and validates POS billing endpoints', async ({ request }) => {
    // 1. Authenticate super admin / staff
    const loginRes = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: 'admin@vasanthi.com',
        password: 'Admin@123',
      },
    });
    const loginJson = await loginRes.json();
    const token = loginJson?.data?.tokens?.accessToken || loginJson?.data?.accessToken;
    expect(token).toBeTruthy();

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Query products for POS counter search
    const productsRes = await request.get(`${API_BASE_URL}/products?limit=10`, {
      headers: authHeaders,
    });
    expect(productsRes.status()).toBe(200);

    // 3. Query POS current shift / terminal status
    const shiftRes = await request.get(`${API_BASE_URL}/pos/shift/current`, {
      headers: authHeaders,
    });
    expect([200, 404]).toContain(shiftRes.status());
  });
});
