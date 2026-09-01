import 'reflect-metadata';
import { PosController } from './pos.controller';
import { PERMISSIONS_KEY } from '@domains/auth/guards/permissions.guard';

/**
 * Every POS route is staff-only. Most of them carried JwtAuthGuard alone,
 * which proves who you are and nothing about what you may do -- so any
 * signed-in customer could ring up a sale, look up another customer by phone,
 * open or close a cash drawer, or issue a refund. Two barcode routes had no
 * guard at all.
 *
 * This walks the controller's real route handlers rather than naming them, so
 * a route added later is covered the day it is written.
 */
describe('PosController authorization', () => {
  const routeNames = Object.getOwnPropertyNames(PosController.prototype).filter(
    (name) =>
      name !== 'constructor' &&
      typeof (PosController.prototype as never as Record<string, unknown>)[
        name
      ] === 'function',
  );

  it('has routes to check', () => {
    expect(routeNames.length).toBeGreaterThan(10);
  });

  // Handlers deliberately marked @Public serve a public URL (e.g. an <img>
  // that renders a barcode image directly). They must not carry the pos:view
  // rule -- doing so would break the anonymous fetch. Every other handler
  // is still asserted to be permission-guarded below.
  const isPublicHandler = (name: string) => {
    const handler = (
      PosController.prototype as never as Record<string, object>
    )[name];
    return Reflect.getMetadata('isPublic', handler) === true;
  };
  const guardedRouteNames = routeNames.filter((n) => !isPublicHandler(n));

  it.each(guardedRouteNames)('%s requires a permission, not just a login', (name) => {
    const handler = (
      PosController.prototype as never as Record<string, object>
    )[name];
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, handler);

    expect(permissions).toBeDefined();
    expect(permissions).toContain('pos:view');
  });

  it.each(guardedRouteNames)('%s is guarded', (name) => {
    const handler = (
      PosController.prototype as never as Record<string, object>
    )[name];
    const guards = Reflect.getMetadata('__guards__', handler) as
      unknown[] | undefined;

    // Two barcode routes previously had none at all, so assert presence
    // rather than trusting that a permission decorator implies a guard.
    expect(guards?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});
