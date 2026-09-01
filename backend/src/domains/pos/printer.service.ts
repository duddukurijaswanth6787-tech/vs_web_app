import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { PreviewReceiptDto, GenerateBatchStickersDto } from './pos.types';
import { BarcodeService } from './barcode.service';

interface StoreSettings {
  storeName: string;
  storeDescription: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  // Fields printed in the GST-compliant invoice header.
  gstin: string;
  city: string;
  state: string;
  pincode: string;
}

const FALLBACK_SETTINGS: StoreSettings = {
  storeName: "Vasanthi's Signature",
  storeDescription: 'Premium ethnic wear & boutique',
  address: 'Road No. 12, Banjara Hills, Hyderabad - 500034',
  phone: '+91 98765 43210',
  email: 'support@vsboutique.shop',
  website: 'www.vsboutique.shop',
  // Left blank when the shop hasn't configured them yet -- rendering shows
  // a dash rather than fake data, so an unset GSTIN is visible on the paper.
  gstin: '',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500034',
};

const BELOW_TWENTY = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

@Injectable()
export class PrinterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly barcodeService: BarcodeService,
  ) {}

  private async getStoreSettings(): Promise<StoreSettings> {
    const settings = await this.prisma.websiteSetting.findFirst({
      where: { deletedAt: null },
    });
    if (!settings) return FALLBACK_SETTINGS;
    return {
      storeName: settings.storeName || FALLBACK_SETTINGS.storeName,
      storeDescription:
        settings.storeDescription || FALLBACK_SETTINGS.storeDescription,
      address: settings.companyAddress || FALLBACK_SETTINGS.address,
      phone: settings.supportPhone || FALLBACK_SETTINGS.phone,
      email: settings.supportEmail || FALLBACK_SETTINGS.email,
      website: FALLBACK_SETTINGS.website,
      gstin: settings.companyGstin || FALLBACK_SETTINGS.gstin,
      city: settings.companyCity || FALLBACK_SETTINGS.city,
      state: settings.companyState || FALLBACK_SETTINGS.state,
      pincode: settings.companyPincode || FALLBACK_SETTINGS.pincode,
    };
  }

  /** Converts a whole rupee amount into words using the Indian numbering system. */
  private numberToWords(amount: number): string {
    const twoDigits = (n: number): string => {
      if (n < 20) return BELOW_TWENTY[n];
      const t = Math.floor(n / 10);
      const r = n % 10;
      return TENS[t] + (r ? ` ${BELOW_TWENTY[r]}` : '');
    };
    const threeDigits = (n: number): string => {
      if (n < 100) return twoDigits(n);
      const h = Math.floor(n / 100);
      const r = n % 100;
      return `${BELOW_TWENTY[h]} Hundred${r ? ` ${twoDigits(r)}` : ''}`;
    };

    let n = Math.round(amount);
    if (n === 0) return 'Zero';

    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundred = n;

    const parts: string[] = [];
    if (crore) parts.push(`${threeDigits(crore)} Crore`);
    if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
    if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
    if (hundred) parts.push(threeDigits(hundred));
    return parts.join(' ');
  }

  /**
   * Fetches the HSN code for each item's product so it can be printed against
   * the line -- required on a GST tax invoice for garments.
   */
  private async loadHsnCodes(
    dto: PreviewReceiptDto,
  ): Promise<Map<string, string>> {
    const ids = Array.from(
      new Set(dto.items.map((i) => i.productId).filter(Boolean)),
    ) as string[];
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, hsnCode: true },
    });
    return new Map(rows.map((r) => [r.id, r.hsnCode || '']));
  }

  /**
   * Two customers in the same state pay CGST + SGST (split half-and-half);
   * a customer in a different state pays IGST at the full rate on one line.
   *
   * A walk-in with no state given is treated as intra-state, since the shop
   * itself is the place of supply.
   */
  private isInterstate(store: StoreSettings, dto: PreviewReceiptDto): boolean {
    const customerState = (dto.customer?.state || '').trim().toLowerCase();
    if (!customerState) return false;
    return customerState !== store.state.trim().toLowerCase();
  }

  private computeTotals(dto: PreviewReceiptDto, interstate: boolean) {
    const subtotal = dto.items.reduce(
      (s, i) => s + i.unitPrice * i.quantity,
      0,
    );
    const discountTotal = dto.discountTotal || 0;
    const taxableAmount = Math.max(0, subtotal - discountTotal);
    const taxTotal = dto.taxTotal || 0;
    const igstAmount = interstate ? taxTotal : 0;
    const cgstAmount = interstate
      ? 0
      : Math.round((taxTotal / 2) * 100) / 100;
    const sgstAmount = interstate ? 0 : taxTotal - cgstAmount;
    const fullGstRate =
      taxableAmount > 0
        ? Math.round((taxTotal / taxableAmount) * 1000) / 10
        : 0;
    const halfGstRate =
      Math.round((fullGstRate / 2) * 10) / 10;
    return {
      subtotal,
      discountTotal,
      taxableAmount,
      taxTotal,
      igstAmount,
      cgstAmount,
      sgstAmount,
      fullGstRate,
      halfGstRate,
      interstate,
    };
  }

  async generateHtmlInvoiceReceipt(dto: PreviewReceiptDto): Promise<string> {
    const store = await this.getStoreSettings();
    const interstate = this.isInterstate(store, dto);
    const {
      subtotal,
      discountTotal,
      taxableAmount,
      taxTotal,
      igstAmount,
      cgstAmount,
      sgstAmount,
      fullGstRate,
      halfGstRate,
    } = this.computeTotals(dto, interstate);
    // Looked up once from the DB rather than repeated per line -- keeps the
    // rendering path a single query even for a big cart.
    const hsnByProduct = await this.loadHsnCodes(dto);

    const [nameLine1, ...nameRest] = store.storeName.split(' ');
    const nameLine2 = nameRest.join(' ');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });

    const customerName = dto.customer?.fullName || 'Walk-in Customer';
    const customerPhone = dto.customer?.phone || '';

    const barcodeDataUrl = await this.barcodeService.generateBarcodeDataUrl(
      dto.orderNumber,
      'code128',
      2,
      8,
    );
    const feedbackQrDataUrl = await this.barcodeService.generateQrCodeDataUrl(
      `https://${store.website}/contact`,
    );

    const itemsHtml = dto.items
      .map((item, idx) => {
        const total = item.unitPrice * item.quantity;
        const hsn = hsnByProduct.get(item.productId) || '-';
        return `
        <tr>
          <td class="center">${idx + 1}</td>
          <td class="item-name">${item.productName}</td>
          <td class="center hsn-cell">${hsn}</td>
          <td class="center">${item.variantTitle || '-'}</td>
          <td class="center">${item.quantity}</td>
          <td class="right">${item.unitPrice.toFixed(2)}</td>
          <td class="right">${total.toFixed(2)}</td>
        </tr>`;
      })
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${dto.orderNumber}</title>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; padding: 0; }
    }
    body {
      width: 76mm;
      margin: 0 auto;
      padding: 4mm 3mm;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      box-sizing: border-box;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .brand-mark { font-size: 16px; color: #0284c7; }
    .store-name-1 { font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin-top: 2px; }
    .store-name-2 { font-family: Georgia, 'Times New Roman', serif; font-size: 13px; font-weight: 700; letter-spacing: 4px; margin-top: 1px; }
    .store-desc { font-size: 8px; letter-spacing: 1px; color: #555; text-transform: uppercase; margin-top: 3px; }
    .tagline { font-size: 8px; font-style: italic; color: #0284c7; margin-top: 3px; }
    .dashed { border-top: 1px dashed #000; margin: 5px 0; }
    .info-line { font-size: 8px; line-height: 1.6; }
    .meta-row { display: flex; justify-content: space-between; font-size: 9px; margin: 2px 0; }
    .meta-label { color: #444; }
    .meta-val { font-weight: 700; }
    .bill-to-badge { display: inline-block; background: #111; color: #fff; font-size: 8px; font-weight: 800; letter-spacing: 1px; padding: 2px 8px; border-radius: 3px; margin-top: 4px; }
    .bill-to-line { font-size: 9px; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; font-size: 8px; margin-top: 4px; }
    thead tr { background: #111; color: #fff; }
    th { padding: 3px 2px; text-align: center; font-size: 7px; text-transform: uppercase; }
    td { padding: 3px 2px; vertical-align: top; border-bottom: 1px dashed #ddd; }
    .item-name { text-align: left; word-break: break-word; }
    .totals-table { width: 100%; font-size: 9px; margin-top: 4px; }
    .totals-table td { padding: 1.5px 0; border: none; }
    .discount-row { color: #c0392b; }
    .grand-total-box { border: 1.5px solid #000; border-radius: 3px; padding: 5px 6px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; }
    .grand-total-label { font-size: 12px; font-weight: 800; }
    .grand-total-value { font-size: 15px; font-weight: 900; }
    .words-line { font-size: 8px; font-style: italic; text-align: center; margin-top: 4px; }
    .payment-badge { display: inline-block; background: #111; color: #fff; font-size: 8px; font-weight: 800; letter-spacing: 1px; padding: 2px 8px; border-radius: 3px; margin-top: 2px; }
    .code-block { text-align: center; margin-top: 6px; }
    .code-block img.barcode { height: 9mm; }
    .code-block img.qr { width: 20mm; height: 20mm; margin-top: 4px; }
    .code-caption { font-size: 7px; color: #555; letter-spacing: 0.5px; margin-top: 2px; }
    .policy-title { font-size: 8px; font-weight: 800; }
    .policy-list { font-size: 7.5px; margin: 3px 0 0; padding-left: 12px; line-height: 1.5; }
    .gstin-line { font-size: 9px; font-weight: 700; letter-spacing: 0.5px; margin-top: 3px; }
    .invoice-title { font-family: Georgia, 'Times New Roman', serif; font-size: 11px; font-weight: 800; letter-spacing: 3px; margin-top: 2px; }
    .hsn-cell { font-family: monospace; font-size: 7.5px; }
    .thank-you { font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 16px; text-align: center; margin-top: 4px; }
    .visit-again { font-size: 8px; font-weight: 800; letter-spacing: 1px; text-align: center; }
    .footer-line { font-size: 7px; text-align: center; letter-spacing: 0.5px; color: #444; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="center">
    <div class="brand-mark">❖</div>
    <div class="store-name-1">${nameLine1.toUpperCase()}</div>
    ${nameLine2 ? `<div class="store-name-2">${nameLine2.toUpperCase()}</div>` : ''}
    <div class="store-desc">${store.storeDescription}</div>
    <div class="tagline">Style that defines you ♡</div>
  </div>

  <div class="dashed"></div>

  <div class="info-line center">
    ${store.address}<br/>
    ${store.city}${store.pincode ? ` - ${store.pincode}` : ''}${store.state ? `, ${store.state}` : ''}<br/>
    ${store.email} &nbsp;|&nbsp; ${store.phone}<br/>
    ${store.website}
  </div>

  <div class="gstin-line center">GSTIN: <b>${store.gstin || '—'}</b></div>
  <div class="invoice-title center">TAX INVOICE${dto.isReprint ? ' (DUPLICATE COPY)' : ''}</div>

  <div class="dashed"></div>

  <div class="meta-row"><span class="meta-label">Invoice No.</span><span class="meta-val">${dto.orderNumber}</span></div>
  <div class="meta-row"><span class="meta-label">Date</span><span class="meta-val">${dateStr}</span></div>
  <div class="meta-row"><span class="meta-label">Time</span><span class="meta-val">${timeStr}</span></div>
  ${dto.cashierName ? `<div class="meta-row"><span class="meta-label">Cashier</span><span class="meta-val">${dto.cashierName}</span></div>` : ''}

  <div class="bill-to-badge">BILL TO</div>
  <div class="bill-to-line">${customerName}${customerPhone ? `<br/>Mobile: ${customerPhone}` : ''}${dto.customer?.state ? `<br/>State: ${dto.customer.state}` : ''}${dto.customer?.gstin ? `<br/>GSTIN: ${dto.customer.gstin}` : ''}</div>
  <div class="bill-to-line" style="color:#555;font-size:8px;">Place of Supply: ${dto.customer?.state || store.state}${interstate ? ' (Inter-state -- IGST)' : ' (Intra-state)'}</div>

  <div class="dashed"></div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th style="text-align:left">Item</th>
        <th>HSN</th>
        <th>Size</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amt</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <table class="totals-table">
    <tr><td>Sub Total</td><td class="right">₹${subtotal.toFixed(2)}</td></tr>
    ${discountTotal ? `<tr class="discount-row"><td>Discount</td><td class="right">-₹${discountTotal.toFixed(2)}</td></tr>` : ''}
    <tr><td>Taxable Amount</td><td class="right">₹${taxableAmount.toFixed(2)}</td></tr>
    ${
      taxTotal
        ? interstate
          ? `
    <tr><td>IGST (${fullGstRate}%)</td><td class="right">₹${igstAmount.toFixed(2)}</td></tr>`
          : `
    <tr><td>CGST (${halfGstRate}%)</td><td class="right">₹${cgstAmount.toFixed(2)}</td></tr>
    <tr><td>SGST (${halfGstRate}%)</td><td class="right">₹${sgstAmount.toFixed(2)}</td></tr>`
        : ''
    }
  </table>

  <div class="grand-total-box">
    <span class="grand-total-label">GRAND TOTAL</span>
    <span class="grand-total-value">₹${dto.grandTotal.toFixed(2)}</span>
  </div>
  <div class="words-line">Rupees ${this.numberToWords(dto.grandTotal)} Only</div>

  <div class="dashed"></div>

  <div class="payment-badge">PAYMENT DETAILS</div>
  <div class="bill-to-line">Method: <b>${dto.paymentMethod || 'UPI/POS'}</b></div>
  ${dto.transactionId ? `<div class="bill-to-line">Transaction ID: <b>${dto.transactionId}</b></div>` : ''}

  <div class="code-block">
    <img src="${barcodeDataUrl}" class="barcode" alt="${dto.orderNumber}" />
    <div class="code-caption">${dto.orderNumber}</div>
    <img src="${feedbackQrDataUrl}" class="qr" alt="Scan for feedback" />
    <div class="code-caption">SCAN FOR FEEDBACK</div>
  </div>

  <div class="dashed"></div>

  <div class="policy-title">Return / Exchange Policy</div>
  <ul class="policy-list">
    <li>Return or exchange within 7 days of delivery.</li>
    <li>Item must be unused, unwashed, with tags attached.</li>
    <li>See our Cancellation &amp; Refund Policy for details.</li>
  </ul>

  <div class="thank-you">Thank You!</div>
  <div class="visit-again">VISIT AGAIN</div>

  <div class="dashed"></div>
  <div class="footer-line">♥ YOUR TRUST, OUR INSPIRATION ♥</div>
</body>
</html>
    `.trim();
  }

  async buildEscPosInvoiceReceipt(dto: PreviewReceiptDto): Promise<Buffer> {
    const store = await this.getStoreSettings();
    const interstate = this.isInterstate(store, dto);
    const {
      subtotal,
      discountTotal,
      taxableAmount,
      taxTotal,
      igstAmount,
      cgstAmount,
      sgstAmount,
      fullGstRate,
      halfGstRate,
    } = this.computeTotals(dto, interstate);
    const hsnByProduct = await this.loadHsnCodes(dto);
    const commands: number[] = [];

    const appendBytes = (bytes: number[]) => commands.push(...bytes);
    const appendText = (text: string) => {
      for (let i = 0; i < text.length; i++) commands.push(text.charCodeAt(i));
    };
    const appendLine = (text = '') => appendText(text + '\n');

    // ESC/POS Initialization
    appendBytes([0x1b, 0x40]); // Initialize
    appendBytes([0x1b, 0x61, 0x01]); // Align Center
    appendBytes([0x1d, 0x21, 0x11]); // Double width + height
    appendBytes([0x1b, 0x45, 0x01]); // Bold On
    appendLine(store.storeName.toUpperCase());
    appendBytes([0x1d, 0x21, 0x00]); // Normal size
    appendLine(store.storeDescription);
    appendBytes([0x1b, 0x45, 0x00]); // Bold Off
    appendLine('Style that defines you');
    appendLine(store.address);
    appendLine(`${store.city} - ${store.pincode}, ${store.state}`);
    appendLine(`${store.phone}  |  ${store.email}`);
    if (store.gstin) appendLine(`GSTIN: ${store.gstin}`);
    appendBytes([0x1b, 0x45, 0x01]);
    appendLine(dto.isReprint ? 'TAX INVOICE (DUPLICATE COPY)' : 'TAX INVOICE');
    appendBytes([0x1b, 0x45, 0x00]);
    appendLine('--------------------------------');

    appendBytes([0x1b, 0x61, 0x00]); // Align Left
    appendLine(`Invoice : ${dto.orderNumber}`);
    appendLine(`Date    : ${new Date().toLocaleDateString('en-IN')}`);
    if (dto.cashierName) appendLine(`Cashier : ${dto.cashierName}`);
    appendLine(
      `Customer: ${dto.customer?.fullName || 'Walk-in'}${dto.customer?.phone ? ` (${dto.customer.phone})` : ''}`,
    );
    if (dto.customer?.gstin) appendLine(`Cust GSTIN: ${dto.customer.gstin}`);
    appendLine(
      `Place of Supply: ${dto.customer?.state || store.state}${interstate ? ' (IGST)' : ''}`,
    );
    appendLine('--------------------------------');

    appendLine('Item          HSN   Qty  Rate   Total');
    appendLine('----------------------------------------');
    dto.items.forEach((item) => {
      const name =
        item.productName.length > 12
          ? item.productName.slice(0, 12)
          : item.productName.padEnd(12);
      const hsnRaw = hsnByProduct.get(item.productId) || '-';
      const hsn = (hsnRaw.length > 5 ? hsnRaw.slice(0, 5) : hsnRaw).padEnd(5);
      const qty = String(item.quantity).padStart(3);
      const price = String(item.unitPrice.toFixed(0)).padStart(5);
      const total = String(
        (item.unitPrice * item.quantity).toFixed(0),
      ).padStart(6);
      appendLine(`${name} ${hsn} ${qty} ${price} ${total}`);
    });
    appendLine('----------------------------------------');

    appendLine(`Sub Total:            Rs.${subtotal.toFixed(2)}`);
    if (discountTotal)
      appendLine(`Discount:            -Rs.${discountTotal.toFixed(2)}`);
    appendLine(`Taxable Amount:       Rs.${taxableAmount.toFixed(2)}`);
    if (taxTotal) {
      if (interstate) {
        appendLine(
          `IGST (${fullGstRate}%):          Rs.${igstAmount.toFixed(2)}`,
        );
      } else {
        appendLine(
          `CGST (${halfGstRate}%):          Rs.${cgstAmount.toFixed(2)}`,
        );
        appendLine(
          `SGST (${halfGstRate}%):          Rs.${sgstAmount.toFixed(2)}`,
        );
      }
    }
    appendLine('--------------------------------');
    appendBytes([0x1b, 0x45, 0x01]); // Bold On
    appendLine(`GRAND TOTAL:          Rs.${dto.grandTotal.toFixed(2)}`);
    appendBytes([0x1b, 0x45, 0x00]); // Bold Off
    appendBytes([0x1b, 0x61, 0x01]); // Align Center
    appendLine(`Rupees ${this.numberToWords(dto.grandTotal)} Only`);
    appendBytes([0x1b, 0x61, 0x00]); // Align Left
    appendLine(`Payment: ${dto.paymentMethod || 'POS'}`);
    if (dto.transactionId) appendLine(`Txn ID  : ${dto.transactionId}`);
    appendLine('--------------------------------');

    // Native ESC/POS QR code (GS ( k), pointed at the feedback page.
    appendBytes([0x1b, 0x61, 0x01]); // Align Center
    const qrData = `https://${store.website}/contact`;
    const storeQr = (
      pL: number,
      pH: number,
      cn: number,
      fn: number,
      data: number[] = [],
    ) => appendBytes([0x1d, 0x28, 0x6b, pL, pH, 0x31, cn, fn, ...data]);
    storeQr(3, 0, 0x31, 0x43, [0x06]); // module size 6
    storeQr(3, 0, 0x31, 0x45, [0x31]); // error correction level M
    const qrBytes = Buffer.from(qrData, 'utf8');
    const storeLen = qrBytes.length + 3;
    storeQr(storeLen & 0xff, (storeLen >> 8) & 0xff, 0x31, 0x50, [
      0x30,
      ...qrBytes,
    ]); // store data
    appendBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]); // print QR
    appendLine('SCAN FOR FEEDBACK');
    appendLine('--------------------------------');

    appendLine('Return/Exchange within 7 days.');
    appendLine('Unused, with tags attached.');
    appendLine('--------------------------------');
    appendLine('Thank You For Shopping!');
    appendLine('VISIT AGAIN');
    appendLine('--------------------------------\n\n\n');

    // Cut Paper Command (GS V 65 0)
    appendBytes([0x1d, 0x56, 0x41, 0x03]);
    // Drawer Kick Command (ESC p 0 25 250)
    appendBytes([0x1b, 0x70, 0x00, 0x19, 0xfa]);

    return Buffer.from(commands);
  }

  /**
   * TSPL is the raw command language most TSC/Zebra-compatible thermal label
   * printers speak. Coordinates are in dots at the printer's native 8
   * dots/mm resolution, so each size's numbers are just its mm dimensions
   * scaled by 8 -- keep that in mind if a printer's actual DPI differs.
   * Not verified against real hardware; test a single label before printing
   * a batch on a new printer/size.
   */
  buildTsplStickerLabel(dto: GenerateBatchStickersDto): string {
    const store = dto.storeName || 'VASANTHI DESIGNERS';
    const title = dto.variantTitle
      ? `${dto.productName} (${dto.variantTitle})`
      : dto.productName;
    const labelSize = dto.labelSize || 'SMALL';

    if (labelSize === 'MEDIUM') {
      return `
SIZE 75 mm, 40 mm
GAP 2 mm, 0 mm
DIRECTION 1
CLS
TEXT 300,20,"3.fmt",0,1,1,2,"${store}"
TEXT 300,50,"2.fmt",0,1,1,2,"${title}"
BARCODE 60,90,"128",60,1,0,2,2,"${dto.barcode}"
QRCODE 470,85,"M",4,"A",0,"${dto.barcode}"
TEXT 60,260,"2.fmt",0,1,1,1,"SKU: ${dto.sku}"
TEXT 400,260,"3.fmt",0,1,1,2,"Rs.${dto.price}"
PRINT 1,${dto.quantity}
      `.trim();
    }

    if (labelSize === 'LARGE') {
      return `
SIZE 100 mm, 50 mm
GAP 2 mm, 0 mm
DIRECTION 1
CLS
TEXT 400,20,"3.fmt",0,1,1,2,"${store}"
TEXT 400,55,"2.fmt",0,1,1,2,"${title}"
BARCODE 60,110,"128",80,1,0,2,2,"${dto.barcode}"
QRCODE 600,95,"M",6,"A",0,"${dto.barcode}"
TEXT 60,300,"2.fmt",0,1,1,1,"SKU: ${dto.sku}"
TEXT 550,320,"3.fmt",0,1,1,2,"Rs.${dto.price}"
PRINT 1,${dto.quantity}
      `.trim();
    }

    // SMALL (default) -- original 50x25mm layout.
    return `
SIZE 50 mm, 25 mm
GAP 2 mm, 0 mm
DIRECTION 1
CLS
TEXT 200,20,"3.fmt",0,1,1,2,"${store}"
TEXT 200,50,"2.fmt",0,1,1,2,"${title}"
BARCODE 200,80,"128",40,1,0,2,2,"${dto.barcode}"
TEXT 50,140,"2.fmt",0,1,1,1,"SKU: ${dto.sku}"
TEXT 350,140,"3.fmt",0,1,1,2,"Rs.${dto.price}"
PRINT 1,${dto.quantity}
    `.trim();
  }
}
