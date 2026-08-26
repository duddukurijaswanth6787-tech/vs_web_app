import 'reflect-metadata';
import { AiPromptController } from './ai-prompt.controller';
import { ROLES_KEY } from '@domains/auth/guards/roles.guard';
import { DEFAULT_TEMPLATES, PROMPT_TYPES, unsupportedVariables } from './ai-prompt.types';

/**
 * Prompt templates shape copy that ends up on the storefront, so they are
 * super_admin only -- a normal admin, a staff account and a customer are all
 * refused. Asserted on the controller class rather than a route list so a
 * route added later inherits the same bar.
 */
describe('AiPromptController authorization', () => {
  it('restricts the whole controller to super_admin', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, AiPromptController);

    expect(roles).toEqual(['super_admin']);
    expect(roles).not.toContain('admin');
    expect(roles).not.toContain('customer');
  });

  it('has no route that opts out of the class guard', () => {
    const routes = Object.getOwnPropertyNames(AiPromptController.prototype).filter(
      (n) => n !== 'constructor',
    );
    expect(routes.length).toBeGreaterThan(3);

    for (const name of routes) {
      const handler = (AiPromptController.prototype as never as Record<string, object>)[name];
      const override = Reflect.getMetadata(ROLES_KEY, handler);
      // A handler may repeat the roles, but must never widen them.
      if (override) expect(override).toEqual(['super_admin']);
      expect(Reflect.getMetadata('isPublic', handler)).toBeFalsy();
    }
  });
});

/** Every shipped template must be usable, not just the one anyone edits. */
describe('the eight default templates', () => {
  it('covers all eight prompt types', () => {
    expect(Object.keys(DEFAULT_TEMPLATES).sort()).toEqual([...PROMPT_TYPES].sort());
  });

  it.each(PROMPT_TYPES)('%s is complete and valid', (type) => {
    const t = DEFAULT_TEMPLATES[type];

    expect(t.name.trim()).not.toBe('');
    expect(t.status).toBe('ACTIVE');
    // Without this the prompt carries no product information at all.
    expect(t.template).toContain('{{product_fields}}');
    expect(t.template).toContain('{{rules}}');
    expect(t.rules.trim()).not.toBe('');
    expect(unsupportedVariables(t.template)).toEqual([]);
  });
});
