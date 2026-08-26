import { buildThemeCss } from './server-theme';

/**
 * These colours are interpolated straight into a <style> block on every
 * customer-facing page. A value that is not a colour is a CSS injection: a
 * string that closes the rule can open another one and restyle -- or hide --
 * anything on the page, including the price.
 *
 * The API validates on save and again on read; this is the last line before
 * the value reaches the document.
 */
describe('buildThemeCss', () => {
  it('emits a :root block for real colours', () => {
    expect(buildThemeCss({ 'brand-primary': '#0284c7' })).toBe(
      ':root{--brand-primary:#0284c7;}',
    );
  });

  it('accepts shorthand hex', () => {
    expect(buildThemeCss({ 'footer-bg': '#abc' })).toContain('--footer-bg:#abc;');
  });

  it.each([
    ['rule-closing injection', 'red;} body{display:none}'],
    ['appended declaration', '#0284c7; background-image: url(https://evil.example/x)'],
    ['url value', 'url(https://evil.example/x)'],
    ['legacy expression', 'expression(alert(1))'],
    ['indirection through another var', 'var(--x)'],
    ['not hex at all', 'rebeccapurple'],
    ['too short', '#12345'],
    ['non-hex digits', '#zzzzzz'],
  ])('drops %s', (_label, value) => {
    const css = buildThemeCss({ 'footer-bg': value });
    expect(css).toBe('');
  });

  it('drops a token name that could break out of the property', () => {
    // The token becomes `--<name>`, so it has to be constrained too.
    const css = buildThemeCss({ 'x:red;}body{display:none': '#ffffff' });
    expect(css).toBe('');
  });

  it('keeps the good colours when one is bad', () => {
    // One rejected value must not discard the rest of the palette.
    const css = buildThemeCss({
      'brand-primary': '#0284c7',
      'footer-bg': 'red;}body{display:none}',
      'header-bg': '#ffffff',
    });
    expect(css).toContain('--brand-primary:#0284c7;');
    expect(css).toContain('--header-bg:#ffffff;');
    expect(css).not.toContain('display:none');
  });

  it('emits nothing at all when there is nothing valid', () => {
    // An empty string means no <style> tag is rendered, so globals.css wins.
    expect(buildThemeCss({})).toBe('');
  });
});
