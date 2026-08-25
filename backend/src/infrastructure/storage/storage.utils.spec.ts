import { StorageUtils } from './storage.utils';

describe('StorageUtils.generateKey', () => {
  it('derives the extension from the validated MIME type, ignoring a spoofed filename extension', () => {
    // A client could send Content-Type: application/pdf (an allowed type)
    // while naming the file "x.svg" to try to get it served back with a
    // browser-executable Content-Type. The key must end in .pdf, not .svg.
    const key = StorageUtils.generateKey('products', 'p1', 'application/pdf');
    expect(key).toMatch(/\.pdf$/);
    expect(key).not.toMatch(/\.svg$/);
  });

  it('produces no extension for an unrecognized MIME type', () => {
    const key = StorageUtils.generateKey('products', 'p1', 'image/svg+xml');
    expect(key).not.toContain('.svg');
  });
});
