import { test, expect, type Page } from '@playwright/test';

// All browser API traffic is mocked: these tests never create live customers,
// carts, orders, payments or stock changes, even when run against the live UI.
test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });

async function prepareCart(page: Page, initialQuantity: number) {
  let quantity = initialQuantity;
  let additions = 0;
  let previews = 0;
  const cart = () => ({
    id: 'cart-quantity-test', status: 'ACTIVE', itemCount: quantity,
    subtotal: quantity * 100, totalSavings: 0, createdAt: '2026-10-17T00:00:00Z',
    items: [{ id: 'quantity-line', cartId: 'cart-quantity-test', productId: 'quantity-product',
      variantId: 'quantity-variant', productName: 'Quantity regression item', quantity,
      unitPrice: 100, totalPrice: quantity * 100, savedForLater: false,
      imageUrl: '/brand/logo-full.png', createdAt: '2026-10-17T00:00:00Z' }],
  });
  const user = { id: 'quantity-user', email: 'quantity@example.invalid', firstName: 'Quantity',
    userType: 'CUSTOMER', accountStatus: 'ACTIVE', roles: ['customer'], permissions: [] };
  await page.addInitScript((cachedUser) => {
    localStorage.setItem('vd_access_token', 'isolated-ui-test-token');
    localStorage.setItem('vd_cached_user', JSON.stringify(cachedUser));
    localStorage.removeItem('vd_guest_id');
    sessionStorage.setItem('vs_buy_now_item', JSON.stringify({
      productId: 'quantity-product', variantId: 'quantity-variant', quantity: 1,
    }));
  }, user);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname.replace('/api/v1', '');
    let data: unknown = [];
    if (pathname === '/auth/me' || pathname === '/me') data = user;
    else if (pathname === '/me/addresses') data = [{ id: 'quantity-address', fullName: 'Quantity Test',
      phone: '9000000000', addressLine1: 'Test address', city: 'Hyderabad', state: 'Telangana',
      country: 'IN', postalCode: '500001', isDefaultShipping: true }];
    else if (pathname === '/cart') {
      // Exercise the window where checkout mounts before its cart has loaded.
      await new Promise((resolve) => setTimeout(resolve, 400));
      data = cart();
    } else if (pathname === '/cart/merge') data = cart();
    else if (pathname === '/cart/items' && request.method() === 'POST') {
      additions++;
      quantity += request.postDataJSON().quantity || 1;
      data = cart();
    } else if (pathname === '/cart/items/quantity-line' && request.method() === 'PATCH') {
      quantity = request.postDataJSON().quantity;
      data = cart();
    } else if (pathname === '/checkout/preview') {
      previews++;
      data = { ...cart(), discountTotal: 0, taxTotal: 0, shippingCharge: 0,
        grandTotal: quantity * 100, estimatedDelivery: '5-7 business days' };
    } else if (pathname === '/settings/public') data = { codEnabled: true, shippingFeeEnabled: false };
    else if (pathname === '/cart/summary') data = cart();
    else if (pathname === '/notifications/unread-count') data = { count: 0 };
    else if (pathname === '/categories/featured' || pathname === '/categories/tree') data = [];
    else if (pathname === '/categories' || pathname === '/products') data = { data: [], meta: { total: 0 } };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  return { quantity: () => quantity, additions: () => additions, previews: () => previews };
}

test('checkout does not add a selected unit again while the bag is loading', async ({ page }) => {
  const state = await prepareCart(page, 1);
  await page.goto('/checkout');
  await expect(page.getByRole('button', { name: /Proceed to Pay.*100/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /Proceed to Pay.*100/ })).toBeVisible();
  expect(state.additions()).toBe(0);
  expect(state.quantity()).toBe(1);
});

test('Edit Bag quantity reduction refreshes checkout totals on return', async ({ page }) => {
  const state = await prepareCart(page, 2);
  await page.goto('/checkout');
  await expect(page.getByRole('button', { name: /Proceed to Pay.*200/ })).toBeVisible();
  const previewsBeforeEdit = state.previews();
  await page.getByRole('link', { name: 'Edit Bag' }).click();
  await page.locator('button:has(svg.lucide-minus)').first().click();
  await expect.poll(state.quantity).toBe(1);
  await page.getByRole('button', { name: /Proceed to Checkout/ }).click();
  await expect(page.getByRole('button', { name: /Proceed to Pay.*100/ })).toBeVisible();
  expect(state.previews()).toBeGreaterThan(previewsBeforeEdit);
  expect(state.additions()).toBe(0);
});
