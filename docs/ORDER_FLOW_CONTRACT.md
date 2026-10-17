# Customer and administrator order flow

This implementation uses [Shopify's separate payment, fulfillment and return states](https://help.shopify.com/en/manual/fulfillment/managing-orders/order-status) and [Baymard's checkout guidance](https://baymard.com/blog/checkout-flow-ux-optimization) as reference patterns. The store keeps its existing authentication, Razorpay integration, COD configuration and visual brand.

## Customer contract

- Cart quantities are authoritative; checkout shows the server preview and must finish preview validation before placing an order.
- One order is created for one checkout attempt. A payment dismissal or verification error keeps the existing order available for payment retry; it must not create a second order from the same attempt.
- Online payment success means the gateway has captured the order's complete payable amount and the backend has reconciled it. A modal callback alone does not prove payment success.
- The order receipt displays a pending, confirmed, cancelled, or refund-required state from the server. It never labels pending funds as paid.
- COD is recorded as a manual payment due on delivery and is confirmed according to the enabled store setting.
- Customer actions and totals appear consistently in the order list, receipt, and tracking information.

## Administrator contract

- Order responses add `paymentStatus`, `paidAmount`, `refundedAmount`, `amountDue`, `refundDue`, `canFulfill`, `canRetryPayment`, and `allowedTransitions`.
- Payment statuses are `UNPAID`, `AUTHORIZED`, `PARTIALLY_PAID`, `PAID`, `COD_DUE`, `PARTIALLY_REFUNDED`, or `REFUNDED`. The order's fulfillment `status` remains separate.
- Order lists support server-side workflow views: awaiting payment, to fulfill, in transit, completed, and cancelled.
- Confirmation, stock deduction/release/restoration and order transitions are serialized per order. Repeated requests cannot apply stock movements twice.
- Shipping requires an eligible order and a real recorded waybill. Typing a carrier name or generating a local string must not mark an unpaid order as shipped.
- A paid cancellation is flagged with a refund due until enough completed refunds exist. Refund approval uses a stable provider idempotency key.

## Payment and recovery API contract

- `POST /checkout/place-order`: validates the active cart and address, records payment choice, reserves stock with the order, and returns the order plus its gateway configuration when online payment is requested.
- `POST /payments`: accepts an owned order, derives amount and currency from that order, and reuses a viable pending gateway order for retry. Supplied mismatched money is rejected.
- `POST /payments/:id/verify`: verifies ownership, signature, gateway amount, currency, provider order and capture state. It returns pending authorization honestly and reconciles captured funds idempotently.
- Verified capture webhooks and administrator gateway sync use the same reconciliation operation. Failed payment attempts do not cancel an order that can still be retried within its payment window.
- Expiry cancels only an order that is still unpaid when its locked state is inspected. A late captured payment on a cancelled order is recorded and surfaced for refund rather than silently resurrecting fulfillment.

## Validation

Regression tests cover ownership/amount binding, notification failures, idempotent capture and stock transitions, pending versus paid receipts, payment retry, administrator action guards, real waybill requirements, and the already-fixed cart quantity flow. Browser tests mock all write APIs; production health and deployment checks are read-only.

Release validation on 18 October 2026:

- 452 backend unit tests passed.
- 15 PostgreSQL integration tests passed in an isolated database, including concurrent capture and refund approval, refund limits, late capture, owned reservations, cancellation, real waybills, and partial restocking.
- 8 Chromium browser checks passed with mocked API traffic.
- Backend and frontend production builds succeeded.

Automatic DTDC booking remains unavailable because its adapter was a stub. It now returns an explicit error. Administrators can book directly with the carrier and record the actual waybill. Delhivery booking, pickup and tracking now report carrier failures instead of inventing successful results.

Existing historical stock discrepancies are not automatically rewritten by this release. The new movement accounting prevents repeated movements for subsequent order actions.
