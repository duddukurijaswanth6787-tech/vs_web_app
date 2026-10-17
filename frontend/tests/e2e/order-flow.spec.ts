import { test, expect, type Page } from '@playwright/test';
test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });

async function prepare(page: Page, status: string, paymentStatus: string, admin = false) {
  const paid = paymentStatus === 'PAID' ? 100 : 0;
  const order = { id: 'flow-order', orderNumber: 'ORD-FLOW', status, paymentStatus, grandTotal: 100, totalAmount: 100,
    subtotal: 100, shippingCharge: 0, discountTotal: 0, taxTotal: 0, currency: 'INR', paidAmount: paid,
    refundedAmount: 0, refundDue: status === 'CANCELLED' ? 100 : 0, amountDue: 100 - paid, canRetryPayment: status === 'PENDING',
    canFulfill: paid === 100 || paymentStatus === 'COD_DUE', allowedTransitions: status === 'PENDING' ? ['CANCELLED'] : ['SHIPPED'],
    paymentMethod: paymentStatus === 'COD_DUE' ? 'COD' : 'RAZORPAY', channel: 'ONLINE_STORE',
    createdAt: '2026-10-17T10:00:00Z', updatedAt: '2026-10-17T10:00:00Z', payments: [], timeline: [],
    items: [{ id: 'flow-line', productId: 'flow-product', productName: 'Flow test saree', quantity: 1, unitPrice: 100, totalPrice: 100, sku: 'FLOW' }],
    addresses: [{ id: 'flow-address', addressType: 'SHIPPING', fullName: 'Flow Test', phone: '9000000000', addressLine1: 'Test address', city: 'Hyderabad', state: 'Telangana', postalCode: '500001', country: 'IN' }],
    customer: { id: 'flow-customer', user: { firstName: 'Flow', email: 'flow@example.invalid' } } };
  const user = { id: 'flow-user', email: 'flow@example.invalid', firstName: 'Flow', userType: admin ? 'SUPER_ADMIN' : 'CUSTOMER',
    accountStatus: 'ACTIVE', roles: [admin ? 'super_admin' : 'customer'], permissions: ['*'] };
  let paymentRequests = 0, checkoutRequests = 0;
  await page.addInitScript((user) => {
    localStorage.setItem('vd_access_token', 'isolated-order-flow-test');
    localStorage.setItem('vd_cached_user', JSON.stringify(user));
  }, user);
  await page.route('https://checkout.razorpay.com/v1/checkout.js', (route) => route.fulfill({ contentType: 'application/javascript',
    body: `window.Razorpay = class { constructor(options){this.options=options;} open(){this.options.modal.ondismiss();} on(){} };` }));
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(), pathname = new URL(request.url()).pathname.replace('/api/v1', '');
    let data: unknown = [];
    if (pathname === '/auth/me' || pathname === '/me') data = user;
    else if (pathname === '/me/orders/ORD-FLOW' || pathname === '/orders/flow-order') data = order;
    else if (pathname === '/payments' && request.method() === 'POST') {
      paymentRequests++; expect(request.postDataJSON().orderId).toBe('flow-order');
      data = { id: 'flow-payment', amount: 100, currency: 'INR', providerOrderId: 'gateway-test', razorpayKeyId: 'public-test-key' };
    } else if (pathname === '/checkout/place-order') { checkoutRequests++; data = {}; }
    else if (pathname === '/settings/public') data = { codEnabled: true };
    else if (pathname === '/cart' || pathname === '/cart/summary') data = { items: [], itemCount: 0, subtotal: 0 };
    else if (pathname === '/notifications/unread-count') data = { count: 0 };
    else if (pathname === '/categories' || pathname === '/products') data = { data: [], meta: { total: 0 } };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  return { paymentRequests: () => paymentRequests, checkoutRequests: () => checkoutRequests };
}

test('pending receipt is honest and payment dismissal retries the same order', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const state = await prepare(page, 'PENDING', 'UNPAID');
  await page.goto('/orders/confirmed/ORD-FLOW');
  await expect(page.getByRole('heading', { name: 'Your order is awaiting payment' })).toBeVisible();
  await page.getByRole('button', { name: 'Complete payment for this order' }).click();
  await expect(page.getByText('Payment was not completed. Your existing order is available to retry.')).toBeVisible();
  expect(state.paymentRequests()).toBe(1); expect(state.checkoutRequests()).toBe(0);
  await page.screenshot({ path: '../scratch/order-flow-pending.png', fullPage: true });
  expect(pageErrors).toEqual([]);
});
test('paid receipt shows confirmation and prevents another payment', async ({ page }) => {
  await prepare(page, 'CONFIRMED', 'PAID'); await page.goto('/orders/confirmed/ORD-FLOW');
  await expect(page.getByRole('heading', { name: 'Your order is confirmed' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete payment for this order' })).toHaveCount(0);
  await expect(page.getByText('Payment received', { exact: true })).toBeVisible();
});
test('cancelled paid receipt flags refund action and does not offer payment', async ({ page }) => {
  await prepare(page, 'CANCELLED', 'PAID'); await page.goto('/orders/confirmed/ORD-FLOW');
  await expect(page.getByRole('heading', { name: 'Order cancelled' })).toBeVisible();
  await expect(page.getByText(/Refund awaiting action/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete payment for this order' })).toHaveCount(0);
});
test('COD receipt shows money due on delivery', async ({ page }) => {
  await prepare(page, 'CONFIRMED', 'COD_DUE'); await page.goto('/orders/confirmed/ORD-FLOW');
  await expect(page.getByText('Pay on delivery', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete payment for this order' })).toHaveCount(0);
});
test('admin cannot confirm an unpaid order or dispatch it', async ({ page }) => {
  await prepare(page, 'PENDING', 'UNPAID', true); await page.goto('/admin/orders/flow-order');
  await expect(page.getByText('Awaiting payment', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm Order', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Assign Courier.*Mark Shipped/ })).toHaveCount(0);
});
test('admin shipment requires a recorded real waybill', async ({ page }) => {
  await prepare(page, 'READY_TO_SHIP', 'PAID', true); await page.goto('/admin/orders/flow-order');
  const dispatch = page.getByRole('button', { name: /Assign Courier.*Mark Shipped/ });
  await expect(dispatch).toBeDisabled();
  await page.getByPlaceholder('Enter the actual courier waybill').fill('REAL-AWB-1');
  await expect(dispatch).toBeEnabled();
  await page.screenshot({ path: '../scratch/order-flow-admin.png', fullPage: true });
});
