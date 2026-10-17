export const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKING', 'CANCELLED'],
  PACKING: ['READY_TO_SHIP'],
  READY_TO_SHIP: ['SHIPPED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURN_APPROVED', 'RETURN_REJECTED'],
  RETURN_APPROVED: ['RETURN_COMPLETED', 'RETURN_REJECTED'],
  RETURN_REJECTED: ['RETURN_REQUESTED'],
  RETURN_COMPLETED: ['RETURN_REQUESTED'],
  CANCELLED: [],
};

interface PaymentStateInput {
  grandTotal: unknown;
  status: string;
  channel?: string | null;
  paymentMethod?: string | null;
  payments?: {
    status: string;
    amount: unknown;
    method?: string | null;
    currency?: string;
  }[];
  refunds?: { status: string; amount: unknown }[];
}

export function getOrderState(order: PaymentStateInput) {
  const payments = order.payments ?? [];
  const isPos = Boolean(order.channel?.toUpperCase().includes('POS'));
  const cod =
    order.paymentMethod === 'COD' || payments.some((p) => p.method === 'COD');
  const money = (value: unknown) => Math.round(Number(value || 0) * 100) / 100;
  const total = money(order.grandTotal);
  const paidAmount = money(
    payments
      .filter((p) => ['CAPTURED', 'COMPLETED', 'REFUNDED'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.amount), 0),
  );
  const refundedAmount = money(
    (order.refunds ?? [])
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + Number(r.amount), 0),
  );
  const amountDue = Math.max(0, money(total - paidAmount));
  const refundDue =
    order.status === 'CANCELLED'
      ? Math.max(0, money(paidAmount - refundedAmount))
      : 0;
  const paid = paidAmount >= total && total > 0;
  const canFulfill =
    !['CANCELLED', 'RETURN_COMPLETED'].includes(order.status) &&
    (paid || cod || isPos);
  let paymentStatus = 'UNPAID';
  if (refundedAmount > 0)
    paymentStatus =
      refundedAmount >= paidAmount && paidAmount > 0
        ? 'REFUNDED'
        : 'PARTIALLY_REFUNDED';
  else if (paid) paymentStatus = 'PAID';
  else if (paidAmount > 0) paymentStatus = 'PARTIALLY_PAID';
  else if (cod) paymentStatus = 'COD_DUE';
  else if (payments.some((p) => p.status === 'AUTHORIZED'))
    paymentStatus = 'AUTHORIZED';
  const paymentMethod = cod
    ? 'COD'
    : order.paymentMethod || payments[0]?.method || 'UNKNOWN';
  return {
    paymentMethod,
    paymentStatus,
    paidAmount,
    refundedAmount,
    amountDue,
    refundDue,
    canFulfill,
    canRetryPayment: order.status === 'PENDING' && !cod && !paid && !isPos,
    allowedTransitions: (ORDER_TRANSITIONS[order.status] ?? []).filter(
      (next) =>
        ![
          'CONFIRMED',
          'PROCESSING',
          'PACKING',
          'READY_TO_SHIP',
          'SHIPPED',
        ].includes(next) || canFulfill,
    ),
  };
}
