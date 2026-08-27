import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vasanthissignature.in/api/v1';

test.describe('Admin Console E2E Verification', () => {
  test('admin authentication and endpoint validation', async ({ request }) => {
    // 1. Authenticate admin user via API
    const loginRes = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: 'admin@vasanthi.com',
        password: 'Admin@123',
      },
    });
    const loginJson = await loginRes.json();
    const token = loginJson?.data?.tokens?.accessToken || loginJson?.data?.accessToken;

    expect(token).toBeTruthy();

    // 2. Query admin AWS Billing endpoint
    const billingRes = await request.get(`${API_BASE_URL}/aws-billing`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(billingRes.status()).toBe(200);

    // 3. Query categories tree endpoint
    const catRes = await request.get(`${API_BASE_URL}/categories/tree`);
    expect(catRes.status()).toBe(200);
  });
});
