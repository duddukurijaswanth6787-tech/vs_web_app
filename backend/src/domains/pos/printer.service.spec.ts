import { Test, TestingModule } from '@nestjs/testing';
import { PrinterService } from './printer.service';

describe('PrinterService (Phase 2)', () => {
  let service: PrinterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrinterService],
    }).compile();

    service = module.get<PrinterService>(PrinterService);
  });

  it('should generate thermal receipt HTML', () => {
    const html = service.generateHtmlInvoiceReceipt({
      orderNumber: 'ORD-20260811-POS101',
      grandTotal: 1468,
      items: [
        {
          productId: 'prod-1',
          productName: 'Designer Kurti',
          variantTitle: 'Blue / L',
          quantity: 2,
          unitPrice: 699,
        },
      ],
      customer: { fullName: 'Anjali', phone: '9876543210' },
      paymentMethod: 'UPI',
    });

    expect(html).toContain('ORD-20260811-POS101');
    expect(html).toContain("VASANTHI'S SIGNATURE");
    expect(html).toContain('Anjali');
    expect(html).toContain('₹1468');
    expect(html).toContain('UPI');
  });

  it('should generate ESC/POS binary buffer for thermal receipt', () => {
    const escposBuffer = service.buildEscPosInvoiceReceipt({
      orderNumber: 'ORD-20260811-POS101',
      grandTotal: 1468,
      items: [
        {
          productId: 'prod-1',
          productName: 'Designer Kurti',
          quantity: 2,
          unitPrice: 699,
        },
      ],
      paymentMethod: 'CASH',
    });

    expect(Buffer.isBuffer(escposBuffer)).toBe(true);
    expect(escposBuffer.length).toBeGreaterThan(50);
    // Check for ESC/POS init command (0x1B 0x40)
    expect(escposBuffer[0]).toBe(0x1b);
    expect(escposBuffer[1]).toBe(0x40);
  });

  it('should generate TSPL label printer commands', () => {
    const tspl = service.buildTsplStickerLabel({
      productName: 'Designer Kurti',
      variantTitle: 'Blue / L',
      sku: 'KUR-BLU-L-005',
      barcode: '890100000005',
      price: 699,
      quantity: 15,
    });

    expect(tspl).toContain('SIZE 50 mm, 25 mm');
    expect(tspl).toContain('BARCODE 200,80,"128",40,1,0,2,2,"890100000005"');
    expect(tspl).toContain('PRINT 1,15');
  });
});
