## Context

The CRM currently has no payment tracking. Revenue on the dashboard is calculated by filtering `completed` appointments and summing their associated `Service.price`. This causes double-counting when appointments are covered by subscription plans (they have `clientSubscriptionId` set but their service price is still counted individually). Additionally, the subscription renewal system hardcodes 30-day periods regardless of `billingPeriod` (monthly/quarterly/semiannual/annual), and plan payments are never recorded as financial events.

The system is in development — no production data or real payment processing exists. This allows us to design the ideal model now.

## Goals / Non-Goals

**Goals:**
- Create a single `Payment` model that records all financial events (standalone appointments + subscription plans)
- Auto-generate Payment records on: appointment completion (standalone), subscription creation (pro-rata), subscription renewal, subscription cancellation (refund)
- Allow manual Payment adjustments (new record, original marked as erroneous)
- Fix subscription period to respect `billingPeriod`
- Correct the Dashboard Monthly Revenue card to sum `Payment.amount` within the month
- Build a full Financial Reports page with date filters, type filters, CSV export, charts
- Add Payment management UI in appointment details

**Non-Goals:**
- Integration with real payment gateways (Stripe, PagSeguro, etc.) — this is a record-keeping system, not payment processing
- Tax calculation or invoice generation
- Multi-currency reporting (single currency per org from `OrganizationSetting`)
- Recurring revenue recognition (MRR/ARR metrics) — plain monthly sum is sufficient

## Decisions

### 1. Single Payment table vs separate tables for appointments vs subscriptions

**Decision:** Single `Payment` table with polymorphic `referenceType`/`referenceId`.

**Rationale:** Simpler queries for "all revenue in a month" (`SUM(amount) WHERE paidAt IN month`). No UNIONs. Easy to add future reference types (e.g., "refund", "credit"). The `referenceType` enum keeps the schema clean and extensible.

**Alternatives considered:**
- Separate `AppointmentPayment` and `SubscriptionPayment` tables → harder to aggregate, more joins
- Just adding `isPaid` to Appointment → doesn't capture plan revenue, no audit trail for adjustments

### 2. Payment adjustment strategy

**Decision:** When adjusting a Payment, create a NEW Payment record and set the original's status to `adjusted`. The adjustment Payment can have a different amount (positive or negative).

**Rationale:** Full audit trail. Original record is never mutated. The sum of `completed` Payments minus `adjusted` originals minus `refunded` gives the correct revenue.

**Example flow:**
```
1. Appointment completed → Payment(auto) R$ 50,00  [status: completed]
2. Staff adjusts to R$ 45,00 → Payment(adjust) R$ 45,00 [status: completed]
                           → Payment(auto) status → adjusted
3. Revenue contribution: R$ 45,00 (only the completed + adjusted records)
```

### 3. Pro-rata calculation method

**Decision:** Pro-rata = `planPrice * (activeDays / totalDaysInPeriod)`. For creation, active days = days from start date to end of first billing period. For cancellation, refund = remaining unused days.

**Formula:**
```
proRataAmount = planPrice × (activeDays / periodDays)
refundAmount  = planPrice × (unusedDays / periodDays)  [negative Payment]
```

Where `periodDays` = billing period in days (30/90/180/365), `activeDays` = days in the partial period the subscription was/will-be active.

**Example:**
- Plan R$ 200/mo, starts Jan 15, 31-day January:
  - `activeDays` = 17 (Jan 15 to Jan 31 inclusive)
  - `periodDays` = 31
  - `proRataAmount` = R$ 200 × (17/31) = R$ 109,68

### 4. Fixing billingPeriod in subscription logic

**Decision:** Replace hardcoded `30 * 24 * 60 * 60 * 1000` with dynamic calculation from `SubscriptionPlan.billingPeriod`:
- `monthly` → 30 days
- `quarterly` → 90 days
- `semiannual` → 180 days
- `annual` → 365 days

**Rationale:** Without this fix, a "quarterly R$ 600" plan would charge R$ 600 every 30 days instead of every 90 days, making all financial data incorrect. This is a bugfix that must ship with the revenue system.

### 5. Payment generation for standalone appointments

**Decision:** When `updateAppointmentStatus` is called with status `completed` AND the appointment has no `clientSubscriptionId`, auto-generate a Payment with `amount = service.price`.

**Rationale:** Zero-friction for the common case. The hybrid model (auto + manual adjust) covers edge cases like discounts or package deals without requiring extra UI for every completion.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Auto-generated Payment amounts might be wrong (discounts, promos) | Hybrid model allows adjustment. Staff can create a new Payment and mark the auto one as `adjusted`. |
| Pro-rata math for partial months could have edge cases (leap years, Feb) | Use `date-fns` `differenceInCalendarDays` for consistent day counts. Always round to 2 decimal places. |
| Changing subscription periods from 30-day to billingPeriod-aware could break existing subscriptions | Existing subscriptions have `currentPeriodEnd` dates based on 30-day logic. Migration: add script/setting to recalculate next period based on billingPeriod. For dev/staging, simple reset is acceptable. |
| Financial Reports page is a large UI effort | Scope as "tab within dashboard" initially. CSV export can be a simple button generating a server-side CSV. |
| No authentication for reports beyond standard CRM auth | Acceptable — same session/auth model as the rest of the CRM. Add TODO for future role-based financial access if needed. |
