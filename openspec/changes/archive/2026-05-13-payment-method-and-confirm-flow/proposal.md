## Why

The CRM tracks payments but lacks payment method information — no distinction between debit, credit, PIX, or cash. Operators have no way to confirm how a client paid, offer installment plans with interest, or configure payment methods per organization. The booking flow ignores payments entirely, and financial reports cannot break down revenue by payment method. This limits the system's usefulness for service businesses that need to track payment methods, manage installments, and offer prepayment options.

## What Changes

- **New `PaymentMethod` model** — configurable table of payment methods per organization (debit, credit, cash, PIX, transfer, etc.), replacing the current hardcoded approach
- **New fields on `Payment`** — `paymentMethodId` (FK → PaymentMethod), `installments` (Int), `cardLastFour` (optional String)
- **New fields on `Service`** — `requiresPrepayment` (boolean), `interestRate` (optional Decimal, overrides org default)
- **New field on `OrganizationSetting`** — `defaultInterestRate` (Decimal, baseline for installment interest)
- **"Confirm Payment" modal** — auto-opens when appointment moves to `completed`, pre-filled with service price, default method, 1x installment. Includes method selector, installment picker with live calculation, description field. Does NOT open if appointment is covered by a subscription plan.
- **Booking flow integration** — if `service.requiresPrepayment === true`, the booking flow shows an extra payment step capturing method + installments at booking time
- **Reports upgrade** — filter by payment method, distribution chart (by method), installments receivable view, CSV/PDF export including method
- **Dashboard upgrade** — monthly revenue split by payment method

## Capabilities

### New Capabilities
- `configurable-payment-methods`: CRUD of PaymentMethod table — organizations create/edit/activate their own payment methods (debit, credit, cash, PIX, etc.)
- `payment-on-completion`: Auto-modal "Confirm Payment" when appointment status changes to `completed`, with method selector, installment picker with interest calculation, and payment recording
- `prepayment-in-booking`: Optional payment step in the booking flow when the selected service requires prepayment — captures method + installments at booking time
- `installment-interest-config`: Hierarchical interest rate configuration — default at OrganizationSetting, overridable per Service
- `financial-reporting-enhanced`: Payment method filter, distribution chart, installments receivable view, method-aware CSV/PDF export
- `dashboard-payment-breakdown`: Monthly revenue card split by payment method

### Modified Capabilities
*(none — all capabilities are new)*

## Impact

- **DB**: New `PaymentMethod` model + new columns on `Payment`, `Service`, `OrganizationSetting`. Migration required (non-destructive, additive only).
- **Backend**: New actions + API routes for PaymentMethod CRUD. Updated `createPayment` action. Updated `updateAppointmentStatus` to trigger modal instead of auto-creating payment. Updated booking flow to support prepayment step.
- **Frontend**: New `ConfirmPaymentModal` component. Updated `BookingFlow` component. Updated Reports page (filters, chart, receivable view). Updated Dashboard (revenue breakdown). Updated Services settings UI (`requiresPrepayment`, `interestRate`). New PaymentMethod management UI in settings.
- **Types**: New TypeScript types for `PaymentMethod`, updated `Payment`, `Service`, `OrganizationSetting` types.
- **Seed**: Seed default payment methods (Debit, Credit, Cash, PIX, Transfer) and default interest rate.
