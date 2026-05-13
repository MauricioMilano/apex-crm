## Why

The dashboard Monthly Revenue card currently double-counts revenue from subscription plans by summing individual appointment service prices regardless of whether the appointment is covered by a plan. There is no proper payment tracking — `completed` status is used as a proxy for "paid", and subscription plan revenue is not recorded at all. The `billingPeriod` field on plans is also ignored in practice (all periods hardcoded to 30 days). Without a proper Payment model, the CRM cannot produce reliable financial reports.

## What Changes

- **NEW** `Payment` model in Prisma schema — single table tracking all payments (standalone appointments + subscription renewals)
- **BREAKING**: Auto-generate `Payment` records when standalone appointments reach `completed` status (hybrid: staff can adjust)
- **BREAKING**: Auto-generate `Payment` records on subscription renewal, creation (pro-rata), and cancellation (refund)
- **BREAKING**: Fix `billingPeriod` to be respected in subscription renewal logic (30/90/180/365 days instead of hardcoded 30)
- **NEW** Dashboard Monthly Revenue card now queries `Payment` records instead of summing appointment service prices
- **NEW** Full Financial Reports page with filters, CSV export, charts
- **NEW** Payment management UI in appointment details (adjust/create payments, mark paid)
- **NEW** Payment history visible in subscription management

## Capabilities

### New Capabilities
- `payment-model`: Payment record creation, listing, and management (single unified Payment table)
- `payment-automation`: Auto-generation of Payment records on appointment completion, subscription renewal, pro-rata, and refund
- `dashboard-revenue`: Corrected Monthly Revenue card using Payment records
- `financial-reports`: Full financial reports page with filters, export, and charts

### Modified Capabilities

None — no existing specs to modify.

## Impact

- **DB**: New `Payment` model (migration required). New `payment_status` enum.
- **Backend**: New actions `payments.ts`. Modified `appointments.ts` (auto-generate on complete). Modified `client-subscriptions.ts` (respect billingPeriod, generate payments on renewal/pro-rata/refund).
- **Frontend**: Modified Dashboard page (new revenue logic). New Financial Reports page. Modified appointment details UI (payment controls). Modified subscription UI (payment history).
- **Dependencies**: `date-fns` already available for date math. No new external packages needed.
