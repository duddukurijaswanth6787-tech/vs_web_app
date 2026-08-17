import { Injectable } from '@nestjs/common';
import { PreviewReceiptDto, GenerateBatchStickersDto } from './pos.types';

@Injectable()
export class PrinterService {
  generateHtmlInvoiceReceipt(dto: PreviewReceiptDto): string {
    const storeName = "VASANTHI'S SIGNATURE";
    const storeTagline = 'Haute Couture & Boutique';
    const address = 'Road No. 12, Banjara Hills, Hyderabad - 500034';
    const phone = '+91 98765 43210';
    const cashier = dto.cashierName || 'Counter 1';
    const dateStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const itemsHtml = dto.items
      .map((item) => {
        const title = item.variantTitle
          ? `${item.productName} (${item.variantTitle})`
          : item.productName;
        const itemTotal = item.unitPrice * item.quantity;
        return `
        <tr>
          <td class="item-name">${title}</td>
          <td class="center">${item.quantity}</td>
          <td class="right">₹${item.unitPrice}</td>
          <td class="right">₹${itemTotal}</td>
        </tr>
      `;
      })
      .join('\n');

    const customerName = dto.customer?.fullName || 'Walk-in Customer';
    const customerPhone = dto.customer?.phone || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${dto.orderNumber}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      width: 76mm;
      margin: 0 auto;
      padding: 4mm 2mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #000;
      background: #fff;
      box-sizing: border-box;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .header { margin-bottom: 8px; }
    .brand-title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
    .subtitle { font-size: 10px; margin-bottom: 4px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { border-bottom: 1px dashed #000; text-align: left; padding: 2px 0; }
    td { padding: 3px 0; vertical-align: top; }
    .item-name { width: 45%; word-break: break-word; }
    .center { text-align: center; }
    .right { text-align: right; }
    .totals-table td { padding: 2px 0; }
    .grand-total { font-size: 13px; font-weight: bold; }
    .footer { margin-top: 12px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header text-center">
    <div class="brand-title">${storeName}</div>
    <div class="subtitle">${storeTagline}</div>
    <div>${address}</div>
    <div>Ph: ${phone}</div>
  </div>

  <div class="divider"></div>

  <div>
    <div><b>Invoice:</b> ${dto.orderNumber}</div>
    <div><b>Date:</b> ${dateStr}</div>
    <div><b>Cashier:</b> ${cashier}</div>
    <div><b>Customer:</b> ${customerName} ${customerPhone ? `(${customerPhone})` : ''}</div>
  </div>

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="center">Qty</th>
        <th class="right">Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="divider"></div>

  <table class="totals-table">
    <tr>
      <td>Subtotal:</td>
      <td class="text-right">₹${dto.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)}</td>
    </tr>
    ${
      dto.discountTotal
        ? `
    <tr>
      <td>Discount:</td>
      <td class="text-right">-₹${dto.discountTotal}</td>
    </tr>`
        : ''
    }
    ${
      dto.taxTotal
        ? `
    <tr>
      <td>GST Tax:</td>
      <td class="text-right">₹${dto.taxTotal}</td>
    </tr>`
        : ''
    }
    <tr class="grand-total">
      <td>TOTAL:</td>
      <td class="text-right">₹${dto.grandTotal}</td>
    </tr>
    <tr>
      <td>Payment Mode:</td>
      <td class="text-right font-bold">${dto.paymentMethod || 'UPI/POS'}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <div class="footer text-center">
    <div>Thank You For Shopping With Us!</div>
    <div class="font-bold">No Returns After 10 Days</div>
    <div>www.vasanthidesigners.com</div>
  </div>
</body>
</html>
    `.trim();
  }

  buildEscPosInvoiceReceipt(dto: PreviewReceiptDto): Buffer {
    const commands: number[] = [];

    // Helper functions
    const appendBytes = (bytes: number[]) => commands.push(...bytes);
    const appendText = (text: string) => {
      for (let i = 0; i < text.length; i++) {
        commands.push(text.charCodeAt(i));
      }
    };
    const appendLine = (text = '') => {
      appendText(text + '\n');
    };

    // ESC/POS Initialization
    appendBytes([0x1b, 0x40]); // Initialize
    appendBytes([0x1b, 0x61, 0x01]); // Align Center
    appendBytes([0x1b, 0x45, 0x01]); // Bold On

    appendLine("VASANTHI'S SIGNATURE");
    appendLine('Haute Couture & Boutique');
    appendBytes([0x1b, 0x45, 0x00]); // Bold Off
    appendLine('Road No. 12, Banjara Hills, Hyd');
    appendLine('Ph: +91 98765 43210');
    appendLine('--------------------------------');

    appendBytes([0x1b, 0x61, 0x00]); // Align Left
    appendLine(`Invoice : ${dto.orderNumber}`);
    appendLine(`Date    : ${new Date().toLocaleDateString('en-IN')}`);
    appendLine(`Customer: ${dto.customer?.fullName || 'Walk-in'}`);
    appendLine('--------------------------------');

    appendLine('Item          Qty   Price   Total');
    appendLine('--------------------------------');

    dto.items.forEach((item) => {
      const name =
        item.productName.length > 12
          ? item.productName.slice(0, 12)
          : item.productName.padEnd(12);
      const qty = String(item.quantity).padStart(3);
      const price = String(item.unitPrice).padStart(7);
      const total = String(item.unitPrice * item.quantity).padStart(7);
      appendLine(`${name} ${qty} ${price} ${total}`);
    });

    appendLine('--------------------------------');
    appendBytes([0x1b, 0x45, 0x01]); // Bold On
    appendLine(`TOTAL:                ₹${dto.grandTotal}`);
    appendBytes([0x1b, 0x45, 0x00]); // Bold Off
    appendLine(`Payment: ${dto.paymentMethod || 'POS'}`);
    appendLine('--------------------------------');

    appendBytes([0x1b, 0x61, 0x01]); // Align Center
    appendLine('Thank You For Shopping!');
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
