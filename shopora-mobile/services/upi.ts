/**
 * NPCI UPI standard URI builder and QR code utilities for in-store instant payment.
 */

export interface UpiPaymentDetails {
  vpa: string;
  merchantName: string;
  amount: number;
  note?: string;
  orderNumber?: string;
}

/**
 * Builds the official NPCI UPI Intent URI standard:
 * upi://pay?pa={vpa}&pn={merchantName}&am={amount}&cu=INR&tn={note}
 */
export function buildUpiUri(details: UpiPaymentDetails): string {
  const vpa = (details.vpa || 'vasanthisignature@okhdfcbank').trim();
  const pn = encodeURIComponent(details.merchantName || "Vasanthi's Signature");
  const am = details.amount > 0 ? details.amount.toFixed(2) : '1.00';
  const tn = encodeURIComponent(details.note || 'POS In-Store Bill');
  
  return `upi://pay?pa=${vpa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

/**
 * Returns a high-resolution QR code image URL for the given UPI URI.
 */
export function getFallbackQrImageUrl(upiUri: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(upiUri)}`;
}
