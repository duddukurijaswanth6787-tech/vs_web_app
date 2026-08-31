import { PrinterService } from './printer.service';
import { PreviewReceiptDto } from './pos.types';

/**
 * A tax invoice for two customers in different states needs different totals
 * blocks: intra-state charges CGST + SGST at half the rate each, inter-state
 * charges a single IGST line at the full rate. Getting this wrong is a GST
 * compliance issue, not a display quirk.
 */
describe('invoice GST split', () => {
  const svc = Object.create(PrinterService.prototype) as PrinterService;

  const store = {
    storeName: 'Vasanthi',
    storeDescription: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    city: '',
    state: 'Telangana',
    pincode: '',
  };

  const dto = (state?: string): PreviewReceiptDto =>
    ({
      orderNumber: 'ORD-1',
      grandTotal: 1120,
      taxTotal: 120,
      discountTotal: 0,
      items: [
        {
          productId: 'p1',
          productName: 'Kurti',
          quantity: 1,
          unitPrice: 1000,
        } as unknown,
      ],
      customer: state ? { state } : undefined,
    }) as PreviewReceiptDto;

  it('splits into CGST + SGST when the customer is in the shop state', () => {
    const inter = (svc as any).isInterstate(store, dto('telangana'));
    const t = (svc as any).computeTotals(dto('telangana'), inter);
    expect(inter).toBe(false);
    expect(t.igstAmount).toBe(0);
    expect(t.cgstAmount + t.sgstAmount).toBeCloseTo(120);
    expect(t.halfGstRate).toBe(6);
  });

  it('uses a single IGST line when the customer is in a different state', () => {
    const inter = (svc as any).isInterstate(store, dto('Karnataka'));
    const t = (svc as any).computeTotals(dto('Karnataka'), inter);
    expect(inter).toBe(true);
    expect(t.igstAmount).toBe(120);
    expect(t.cgstAmount).toBe(0);
    expect(t.sgstAmount).toBe(0);
    expect(t.fullGstRate).toBe(12);
  });

  it('treats a walk-in with no state as intra-state (place of supply is the shop)', () => {
    const inter = (svc as any).isInterstate(store, dto());
    expect(inter).toBe(false);
  });
});
