import { Test, TestingModule } from '@nestjs/testing';
import { BarcodeService } from './barcode.service';

describe('BarcodeService (Phase 2)', () => {
  let service: BarcodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarcodeService],
    }).compile();

    service = module.get<BarcodeService>(BarcodeService);
  });

  it('should generate Code128 barcode buffer', async () => {
    const buffer = await service.generateBarcodeBuffer('890100000005');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate Code128 barcode data URL', async () => {
    const dataUrl = await service.generateBarcodeDataUrl('890100000005');
    expect(dataUrl).toContain('data:image/png;base64,');
  });

  it('should generate QR code data URL', async () => {
    const qrDataUrl = await service.generateQrCodeDataUrl(
      'https://vasanthidesigners.com/pay/123',
    );
    expect(qrDataUrl).toContain('data:image/png;base64,');
  });

  it('should generate 50x25mm single sticker label HTML', async () => {
    const html = await service.generateSingleStickerLabelHtml({
      storeName: 'VASANTHI DESIGNERS',
      productName: "Women's Designer Kurti",
      variantTitle: 'Blue / L / Cotton',
      sku: 'KUR-BLU-L-005',
      price: 699,
      barcode: '890100000005',
    });

    expect(html).toContain('VASANTHI DESIGNERS');
    expect(html).toContain('KUR-BLU-L-005');
    expect(html).toContain('₹699');
    expect(html).toContain('data:image/png;base64,');
  });

  it('should generate batch sticker labels HTML for N copies', async () => {
    const batchHtml = await service.generateBatchStickersHtml({
      productName: 'Designer Kurti',
      variantTitle: 'Blue / L',
      sku: 'KUR-BLU-L-005',
      barcode: '890100000005',
      price: 699,
      quantity: 5,
    });

    expect(batchHtml).toContain('Batch Label Stickers (5 copies)');
    expect(batchHtml.match(/class="sticker-page"/g)?.length).toBe(5);
  });
});
