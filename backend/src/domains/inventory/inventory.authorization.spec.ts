import 'reflect-metadata';
import { InventoryController } from './inventory.controller';
import { PERMISSIONS_KEY } from '@domains/auth/guards/permissions.guard';

/**
 * The inventory reads were reachable without a token. findAll enumerates every
 * stock level the business holds and findMovements is the internal ledger --
 * each write-off with its reason and the staff member who made it. The only
 * globally registered guard is the rate limiter, so nothing else was stopping
 * an anonymous caller.
 *
 * Asserted per handler rather than by counting decorators, so a route added
 * later without a permission fails here instead of shipping open.
 */
describe('InventoryController authorization', () => {
  const handlers = Object.getOwnPropertyNames(
    InventoryController.prototype,
  ).filter((name) => name !== 'constructor');

  it('exposes no handler without a permission', () => {
    expect(handlers.length).toBeGreaterThan(10);

    const unguarded = handlers.filter((name) => {
      const handler = (
        InventoryController.prototype as never as Record<string, object>
      )[name];
      return !Reflect.getMetadata(PERMISSIONS_KEY, handler);
    });

    expect(unguarded).toEqual([]);
  });

  it.each([
    ['findAll', 'inventory:view'],
    ['getStockSummary', 'inventory:view'],
    ['findMovements', 'inventory:view'],
    ['findById', 'inventory:view'],
    ['findByVariantId', 'inventory:view'],
    ['create', 'inventory:update'],
    ['adjustStock', 'inventory:update'],
  ])('%s requires %s', (handlerName, permission) => {
    const handler = (
      InventoryController.prototype as never as Record<string, object>
    )[handlerName];

    expect(handler).toBeDefined();
    expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toContain(permission);
  });

  it('never lets a read carry a write permission', () => {
    // Granting inventory:update to a read would force anyone who may look at
    // stock to also be able to change it.
    for (const name of ['findAll', 'findMovements', 'findByVariantId']) {
      const handler = (
        InventoryController.prototype as never as Record<string, object>
      )[name];
      expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).not.toContain(
        'inventory:update',
      );
    }
  });
});
