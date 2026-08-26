import { ThemeService } from './theme.service';
import { THEME_TOKENS } from './theme.types';

/**
 * Theme colours are rendered inside a <style> block on customer-facing pages,
 * so a value that is not a colour is a CSS injection: a string that closes the
 * rule can open another one and restyle -- or hide -- anything on the page.
 * Validation is the whole defence, on the way in and again on the way out.
 */
describe('ThemeService', () => {
  const build = (stored?: string) => {
    const prisma = {
      appSetting: {
        findUnique: jest
          .fn()
          .mockResolvedValue(stored === undefined ? null : { value: stored }),
        upsert: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
    };
    return {
      service: new ThemeService(prisma as never, { log: jest.fn() } as never),
      prisma,
    };
  };

  describe('rejects anything that is not a colour', () => {
    const attacks = [
      'red;} body{display:none}',
      '#0284c7;} .price{visibility:hidden',
      'url(https://evil.example/x)',
      'expression(alert(1))',
      'var(--something-else)',
      'rgb(1,2,3)', // legitimate CSS, but not the format this field accepts
      'javascript:alert(1)',
      '#12345',
      '#zzzzzz',
      '',
    ];

    it.each(attacks)('refuses %p', async (value) => {
      const { service, prisma } = build();
      if (value === '') {
        // Empty is the documented way to clear one colour back to its default.
        await service.updateColors('admin-1', { 'footer-bg': value });
        const saved = JSON.parse(prisma.appSetting.upsert.mock.calls[0][0].create.value);
        expect(saved['footer-bg']).toBeUndefined();
        return;
      }
      await expect(
        service.updateColors('admin-1', { 'footer-bg': value }),
      ).rejects.toThrow(/hex colour/i);
      expect(prisma.appSetting.upsert).not.toHaveBeenCalled();
    });
  });

  it('refuses a section that does not exist', async () => {
    // Otherwise the stored blob grows keys that nothing renders, and a typo
    // looks like it saved.
    const { service, prisma } = build();
    await expect(
      service.updateColors('admin-1', { 'footer-bgg': '#ffffff' }),
    ).rejects.toThrow(/unknown theme section/i);
    expect(prisma.appSetting.upsert).not.toHaveBeenCalled();
  });

  it('accepts a real colour and normalises it', async () => {
    const { service, prisma } = build();
    await service.updateColors('admin-1', { 'footer-bg': '  #AABBCC ' });

    const saved = JSON.parse(prisma.appSetting.upsert.mock.calls[0][0].create.value);
    expect(saved['footer-bg']).toBe('#aabbcc');
  });

  it('filters injected values that reached the database another way', async () => {
    // A row edited directly in the database, or written before validation
    // existed, must still not reach the page.
    const { service } = build(
      JSON.stringify({
        'footer-bg': 'red;} body{display:none}',
        'header-bg': '#123456',
        'not-a-token': '#ffffff',
      }),
    );

    const colors = await service.getColors();
    expect(colors).toEqual({ 'header-bg': '#123456' });
  });

  it('survives a malformed blob rather than taking the storefront down', async () => {
    const { service } = build('{ not json');
    await expect(service.getColors()).resolves.toEqual({});
  });

  it('serves defaults for anything unset', async () => {
    const { service } = build();
    const theme = await service.getTheme();

    expect(theme.colors['brand-primary']).toBe(THEME_TOKENS['brand-primary']);
    expect(Object.keys(theme.colors)).toEqual(
      expect.arrayContaining(Object.keys(THEME_TOKENS)),
    );
  });

  it('lets a saved colour win over the default', async () => {
    const { service } = build(JSON.stringify({ 'brand-primary': '#ff0000' }));
    const theme = await service.getTheme();

    expect(theme.colors['brand-primary']).toBe('#ff0000');
    expect(theme.defaults['brand-primary']).toBe(THEME_TOKENS['brand-primary']);
  });
});
