import { PendingSale } from './offline.types';

/**
 * Renders a receipt entirely client-side for an offline-queued sale.
 * Mirrors backend/src/domains/pos/printer.service.ts's thermal template so
 * the printed slip looks the same whether the sale went through live or
 * offline -- but this one never calls the backend, since the whole point is
 * printing while the backend is unreachable. Marked PROVISIONAL because the
 * order number and stock are not yet confirmed by the server.
 */
export function generateOfflineReceiptHtml(sale: PendingSale): string {
  const storeName = "VASANTHI'S SIGNATURE";
  const storeTagline = 'Haute Couture & Boutique';
  const address = 'Road No. 12, Banjara Hills, Hyderabad - 500034';
  const phone = '+91 98765 43210';
  const cashier = sale.receipt.cashierName || 'Counter 1';
  const dateStr = new Date(sale.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const itemsHtml = sale.receipt.items
    .map((item) => {
      const title = item.variantTitle ? `${item.productName} (${item.variantTitle})` : item.productName;
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

  const customerName = sale.receipt.customer?.fullName || 'Walk-in Customer';
  const customerPhone = sale.receipt.customer?.phone || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${sale.clientOrderNumber}</title>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; padding: 0; }
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
    .offline-banner {
      border: 1px dashed #000;
      padding: 3px 4px;
      margin-bottom: 6px;
      text-align: center;
      font-weight: bold;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="offline-banner">OFFLINE SALE -- PENDING SYNC<br/>Ref: ${sale.clientOrderNumber}</div>

  <div class="header text-center">
    <div class="brand-title">${storeName}</div>
    <div class="subtitle">${storeTagline}</div>
    <div>${address}</div>
    <div>Ph: ${phone}</div>
  </div>

  <div class="divider"></div>

  <div>
    <div><b>Invoice:</b> ${sale.clientOrderNumber} (provisional)</div>
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
      <td class="text-right">₹${sale.receipt.subtotal}</td>
    </tr>
    ${
      sale.receipt.discountTotal
        ? `<tr><td>Discount:</td><td class="text-right">-₹${sale.receipt.discountTotal}</td></tr>`
        : ''
    }
    ${
      sale.receipt.taxTotal
        ? `<tr><td>GST Tax:</td><td class="text-right">₹${sale.receipt.taxTotal}</td></tr>`
        : ''
    }
    <tr class="grand-total">
      <td>TOTAL:</td>
      <td class="text-right">₹${sale.receipt.grandTotal}</td>
    </tr>
    <tr>
      <td>Payment Mode:</td>
      <td class="text-right font-bold">${sale.receipt.paymentMethod}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <div class="footer text-center">
    <div class="font-bold">This is a provisional slip.</div>
    <div>Will be confirmed once synced to the server.</div>
    <div>Thank You For Shopping With Us!</div>
  </div>
</body>
</html>
  `.trim();
}
