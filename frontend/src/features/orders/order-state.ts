export interface OrderStateInput {
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  grandTotal?: number;
  totalAmount?: number;
  paidAmount?: number;
  refundedAmount?: number;
  refundDue?: number;
  amountDue?: number;
  canRetryPayment?: boolean;
  payments?: { status: string; amount: number; method?: string }[];
}

export function getOrderPresentation(order: OrderStateInput) {
  const total = Number(order.grandTotal ?? order.totalAmount ?? 0);
  const payments = order.payments ?? [];
  const paidAmount = order.paidAmount ?? payments.filter((p) => ['CAPTURED', 'COMPLETED'].includes(p.status)).reduce((sum, p) => sum + Number(p.amount), 0);
  const cod = order.paymentMethod === 'COD' || payments.some((p) => p.method === 'COD');
  const cancelled = order.status === 'CANCELLED';
  const paid = paidAmount >= total && total > 0;
  const pending = order.status === 'PENDING' && !cod;
  const paymentStatus = order.paymentStatus || (cod && !paid ? 'COD_DUE' : paid ? 'PAID' : 'UNPAID');
  const paymentLabels: Record<string, string> = {
    PAID: 'Paid', UNPAID: 'Awaiting payment', AUTHORIZED: 'Payment processing', PARTIALLY_PAID: 'Partially paid',
    COD_DUE: 'Pay on delivery', REFUNDED: 'Refunded', PARTIALLY_REFUNDED: 'Partially refunded',
  };
  const titles: Record<string, string> = { SHIPPED: 'Your order is on its way', OUT_FOR_DELIVERY: 'Your order is out for delivery', DELIVERED: 'Your order has been delivered', RETURN_REQUESTED: 'Return requested', RETURN_APPROVED: 'Return approved', RETURN_REJECTED: 'Return declined', RETURN_COMPLETED: 'Return completed' };
  const title = cancelled ? 'Order cancelled' : pending ? paid ? 'Payment received · checking your order' : 'Your order is awaiting payment' : titles[order.status] || 'Your order is confirmed';
  const description = cancelled ? Number(order.refundDue || 0) > 0
    ? 'Payment was received for this cancelled order. Our team needs to complete your refund.' : 'This order will not be dispatched.'
    : pending ? paid ? 'We have received your payment. Please refresh to check fulfillment confirmation. Avoid paying again.'
    : 'Complete payment for this order to confirm delivery. If your account was debited, check the status before retrying.'
    : order.status.startsWith('RETURN_') ? 'Check the order updates below for the progress of your return and refund.'
    : order.status === 'DELIVERED' ? 'Your delivery is complete. Contact us if you need help with this order.'
    : ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) ? 'Track your shipment for the latest delivery updates.'
    : cod ? 'Your order is ready for fulfillment. Pay the order total when it is delivered.'
    : 'Your payment is received and we will keep you updated as your order is prepared.';
  return { total, paidAmount, paymentStatus, paymentLabel: paymentLabels[paymentStatus] || paymentStatus.replaceAll('_', ' '),
    cod, cancelled, pending, paid, title, description,
    canRetry: order.canRetryPayment ?? (pending && !paid && !cancelled),
    tone: cancelled ? 'neutral' : pending ? 'pending' : 'success' };
}
