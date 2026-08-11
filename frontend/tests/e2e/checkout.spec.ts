import { test, expect } from '@playwright/test';

test('end-to-end checkout flow', async ({ page, request }) => {
  // 1. Create a test customer account & address via API
  const timestamp = Date.now();
  const email = `e2e_customer_${timestamp}@example.com`;
  const password = 'Password123!';

  const regRes = await request.post('http://localhost:4000/api/v1/auth/register', {
    data: {
      email,
      password,
      firstName: 'E2E',
      lastName: 'Customer',
      phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    },
  });
  const regJson = await regRes.json();
  const tokens = regJson.data;

  if (tokens?.accessToken) {
    const authHeaders = { Authorization: `Bearer ${tokens.accessToken}` };
    // Initialize customer profile
    await request.get('http://localhost:4000/api/v1/me', { headers: authHeaders });

    // Add default shipping address for the customer
    await request.post('http://localhost:4000/api/v1/me/addresses', {
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

  // 2. Visit Homepage & authenticate session
  await page.goto('/');
  await expect(page).toHaveTitle(/Vasanthi Designers/);

  if (tokens?.accessToken) {
    await page.evaluate((t) => {
      localStorage.setItem('vd_access_token', t.accessToken);
      localStorage.setItem('vd_refresh_token', t.refreshToken);
    }, tokens);
    await page.reload();
  }

  // 3. Search/Find a product
  await page.locator('a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/.*\/product\/.*/);

  // 4. Add to Cart
  await page.getByRole('button', { name: /Add to Bag/i }).click();
  await expect(page.getByText(/successfully added/i)).toBeVisible();

  // 5. Navigate to Cart
  await page.goto('/cart');
  await expect(page.getByText(/My Cart/i)).toBeVisible();

  // 6. Proceed to Checkout
  const checkoutButton = page.getByRole('button', { name: /Proceed to Checkout/i });
  await checkoutButton.waitFor({ state: 'visible' });
  await checkoutButton.click();

  // 7. Select shipping address on address selection page
  const deliverHereBtn = page.getByRole('link', { name: /Deliver here/i });
  await deliverHereBtn.waitFor({ state: 'visible' });
  await deliverHereBtn.click();

  // 8. Complete Order
  await expect(page).toHaveURL(/\/checkout\?addressId=.*/);
  const placeOrderBtn = page.getByRole('button', { name: /Place Order/i });
  await placeOrderBtn.waitFor({ state: 'visible' });
  await placeOrderBtn.click();

  // 9. Verify order success
  await expect(page).toHaveURL(/\/checkout\/success/);
});

