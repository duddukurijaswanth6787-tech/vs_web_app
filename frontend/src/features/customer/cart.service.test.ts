import { apiClient } from '@/lib/api/client';
import { clearGuestId, getGuestId, getStoredGuestId } from './guest';
import { customerCartService, type CartDto } from './cart.service';

jest.mock('@/lib/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
jest.mock('./guest', () => ({
  getGuestId: jest.fn(() => 'guest-1'),
  getStoredGuestId: jest.fn(),
  clearGuestId: jest.fn(),
}));

const api = apiClient as jest.Mocked<typeof apiClient>;
const storedGuestId = getStoredGuestId as jest.MockedFunction<typeof getStoredGuestId>;
const clearGuest = clearGuestId as jest.MockedFunction<typeof clearGuestId>;
const item = { productId: 'product-1', variantId: 'variant-1', quantity: 1 };

function cart(quantity = 1, savedForLater = false): CartDto {
  return {
    id: 'cart-1', status: 'ACTIVE', createdAt: '2026-10-17T00:00:00Z',
    itemCount: savedForLater ? 0 : quantity, subtotal: savedForLater ? 0 : quantity * 100,
    totalSavings: 0,
    items: [{ ...item, id: 'line-1', cartId: 'cart-1', quantity, savedForLater,
      unitPrice: 100, totalPrice: quantity * 100, createdAt: '2026-10-17T00:00:00Z' }],
  };
}
const response = (value: CartDto) => ({ data: { data: value } });

beforeEach(() => {
  jest.resetAllMocks();
  (getGuestId as jest.MockedFunction<typeof getGuestId>).mockReturnValue('guest-1');
  storedGuestId.mockReturnValue('guest-1');
  clearGuest.mockImplementation(() => { storedGuestId.mockReturnValue(null); });
});

describe('Buy Now selected quantity', () => {
  it('keeps one existing unit at one and charges one unit', async () => {
    api.get.mockResolvedValue(response(cart()));
    const result = await customerCartService.buyNow(item);
    expect(result.itemCount).toBe(1);
    expect(result.subtotal).toBe(100);
    expect(api.post).not.toHaveBeenCalled();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('sets a two-unit bag line to the selected one unit', async () => {
    api.get.mockResolvedValue(response(cart(2)));
    api.patch.mockResolvedValue(response(cart(1)));
    const result = await customerCartService.buyNow(item);
    expect(api.patch).toHaveBeenCalledWith('/cart/items/line-1', { quantity: 1 }, expect.any(Object));
    expect(result.subtotal).toBe(100);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('preserves an intentional selection of two units', async () => {
    api.get.mockResolvedValue(response(cart(1)));
    api.patch.mockResolvedValue(response(cart(2)));
    const result = await customerCartService.buyNow({ ...item, quantity: 2 });
    expect(result.itemCount).toBe(2);
    expect(result.subtotal).toBe(200);
  });

  it('adds once when the selected variant is absent', async () => {
    api.get.mockResolvedValue(response({ ...cart(), items: [{ ...cart().items![0], variantId: 'other-variant' }] }));
    api.post.mockResolvedValue(response(cart()));
    await customerCartService.buyNow(item);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/cart/items', item, expect.any(Object));
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('moves a saved item into the bag without adding another unit', async () => {
    api.get.mockResolvedValue(response(cart(1, true)));
    api.post.mockResolvedValue(response(cart(1)));
    const result = await customerCartService.buyNow(item);
    expect(api.post).toHaveBeenCalledWith('/cart/items/line-1/move-to-cart', {}, expect.any(Object));
    expect(result.itemCount).toBe(1);
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('waits for guest transfer before resolving the selected quantity', async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    api.post.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    api.get.mockResolvedValue(response(cart()));
    const pending = customerCartService.buyNow(item, true);
    expect(api.get).not.toHaveBeenCalled();
    finish(response(cart()));
    const result = await pending;
    expect(result.itemCount).toBe(1);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('does not create another cart item after a failed guest transfer', async () => {
    api.post.mockRejectedValue(new Error('offline'));
    await expect(customerCartService.buyNow(item, true)).rejects.toThrow('Could not transfer your bag');
    expect(api.get).not.toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledTimes(1);
  });
});

describe('guest cart transfer', () => {
  it('shares one request across overlapping login and checkout callers', async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    api.post.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const pending = [customerCartService.merge(), customerCartService.merge(), customerCartService.merge()];
    expect(api.post).toHaveBeenCalledTimes(1);
    finish(response(cart()));
    const results = await Promise.all(pending);
    expect(results.map((value) => value?.itemCount)).toEqual([1, 1, 1]);
    expect(clearGuest).toHaveBeenCalledTimes(1);
  });

  it('retains the guest ID on failure and allows a later retry', async () => {
    api.post.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response(cart()));
    expect(await customerCartService.merge()).toBeNull();
    expect(clearGuest).not.toHaveBeenCalled();
    expect((await customerCartService.merge())?.itemCount).toBe(1);
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(clearGuest).toHaveBeenCalledTimes(1);
  });

  it('does not clear a different guest cart created while the transfer was in flight', async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    api.post.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const pending = customerCartService.merge();
    storedGuestId.mockReturnValue('guest-2');
    finish(response(cart()));
    await pending;
    expect(clearGuest).not.toHaveBeenCalled();
  });
});
