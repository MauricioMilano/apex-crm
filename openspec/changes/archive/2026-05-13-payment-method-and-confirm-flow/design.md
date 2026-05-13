## Context

Currently, the Payment model stores amount, currency, status, and a string reference to an appointment or subscription, but has **no concept of payment method**. When an appointment is completed, the system auto-creates a Payment with the service price (hardcoded). There is no way for operators to confirm how the client paid, offer installments, or configure interest. The BookingFlow has 4 steps (Service → Employee → Date/Time → Confirm) with zero payment awareness.

Financial reporting aggregates revenue but cannot break down by method or show future receivables from credit installments. The dashboard shows "Monthly Revenue" as a single number.

This design introduces a configurable payment method system with installment support, interest rate hierarchy, a confirmation modal, and optional prepayment at booking time — all grounded in the existing Prisma + Next.js patterns.

## Goals / Non-Goals

**Goals:**
- Allow organizations to define their own payment methods via a `PaymentMethod` table
- Record which method was used, how many installments, and optionally card last four digits on every Payment
- Provide a hierarchical interest rate config (org default → service override)
- Auto-show a "Confirm Payment" modal with defaults when appointment reaches `completed` (skip if covered by subscription)
- Support prepayment during booking when a service requires it
- Upgrade Reports with method filter, distribution chart, and installments receivable view
- Upgrade Dashboard to show revenue split by method
- Seed sensible defaults (Debit, Credit, Cash, PIX, Transfer)

**Non-Goals:**
- Full PCI-compliance / card processing — we store only the last 4 digits and method reference, NOT full PAN
- Payment gateway integration (Stripe, etc.) — this is purely a record-keeping enhancement
- Recurring billing engine — installment tracking is informational, not a collection pipeline
- Multi-currency installments — interest calculations assume same currency as service price

## Decisions

### D1: PaymentMethod as a configurable table (not enum)
A table allows organizations to create, name, and activate their own methods without schema migrations. Each method has a `code` (machine-readable slug: `debit`, `credit`, `cash`, `pix`, `transfer`) and a `requiresInstallments` flag. This is more flexible than a Prisma enum and aligns with the "configurable" requirement.

### D2: Interest rate hierarchy (OrgSetting → Service)
- `OrganizationSetting.defaultInterestRate` — baseline monthly interest % for installment plans
- `Service.interestRate` — override per service (nullable; null = use org default)
- At payment time, the effective rate is `service.interestRate ?? orgSetting.defaultInterestRate ?? 0`
- Calculation: `installmentValue = totalAmount / installments * (1 + rate/100) ^ (installments - 1)` simplified to `totalAmount * (rate/100/12 * (1 + rate/100/12)^n) / ((1 + rate/100/12)^n - 1)` — use price * (1 + monthlyRate * (n-1)) / n for simplicity

### D3: Installments as Int on Payment (no separate table)
Installments are recorded as a simple integer on the Payment row. Future receivable dates can be computed (paidAt + 30d per installment) but not stored separately. This keeps complexity low and avoids over-engineering before a collections feature is needed.

### D4: Auto-modal on `completed`, skip if subscription-covered
In `updateAppointmentStatus`, when status becomes `completed`:
1. If `appointment.clientSubscriptionId` is set → skip payment (plan covers it)
2. Otherwise → instead of auto-creating Payment, the front-end receives a signal to open `ConfirmPaymentModal`
3. The modal pre-fills `amount = service.price`, `method = default from org`, `installments = 1`
4. On confirm, the modal calls `createPayment` with all fields

This decouples the status change from automatic payment creation and puts the operator in control.

### D5: Booking flow prepayment as conditional step
- `Service.requiresPrepayment` (boolean, default false)
- If true, the BookingFlow inserts a step 4.5 (or expandable section in step 4) showing method + installments
- A `prepayment_pending` status or simply creating the Payment at booking time — design choice: create Payment with `status: pending` at booking, then update to `completed` when service is delivered
- If the service is covered by subscription AND requires prepayment, prepayment step is skipped (subscription wins)

### D6: Reports receivable as computed, not stored
"Installments receivable" is computed on the fly by filtering `installments > 1` Payments and projecting remaining installments from `paidAt` date. No schema changes needed beyond what's already planned.

## Schema Design

```prisma
// NEW: Configurable payment methods per organization
model PaymentMethod {
  id                String    @id @default(cuid())
  organizationId    String    @map("organization_id")
  name              String    // "Cartão de Crédito", "Dinheiro", etc.
  code              String    // "credit", "debit", "cash", "pix", "transfer"
  requiresDocs      Boolean   @default(false) @map("requires_docs")
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  payments          Payment[]

  @@unique([organizationId, code])
  @@map("payment_methods")
}

// MODIFIED: Payment — add paymentMethodId, installments, cardLastFour
model Payment {
  // ... existing fields unchanged ...
  paymentMethodId   String?   @map("payment_method_id")
  installments      Int       @default(1) @map("installments")
  cardLastFour      String?   @map("card_last_four")
  paymentMethod     PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
}

// MODIFIED: Service — add requiresPrepayment, interestRate
model Service {
  // ... existing fields unchanged ...
  requiresPrepayment Boolean  @default(false) @map("requires_prepayment")
  interestRate       Decimal? @map("interest_rate") @db.Decimal(4, 2) // monthly %
}

// MODIFIED: OrganizationSetting — add defaultInterestRate
model OrganizationSetting {
  // ... existing fields unchanged ...
  defaultInterestRate Decimal? @map("default_interest_rate") @db.Decimal(4, 2)
}
```

## Flow Diagrams

```
FLOW A: Appointment WITHOUT prepayment
────────────────────────────────────────
  confirmed ──→ completed (via status change)
                    │
                    ▼
          Is covered by subscription?
                    │
           ┌───────┴───────┐
           │               │
          YES              NO
           │               │
           ▼               ▼
      Skip payment    Auto-open ConfirmPaymentModal
                      ┌─────────────────────────┐
                      │ amount: R$ 150.00  [edit]│
                      │ method: ▼ Crédito       │
                      │ parcels: ▼ 2x           │
                      │   2x de R$ 76,50 (2% a.m)│
                      │ descr: [optional]        │
                      │                         │
                      │ [Cancel]  [Confirm]      │
                      └─────────────────────────┘
                           │
                           ▼
                    createPayment(status=completed)


FLOW B: Appointment WITH prepayment
────────────────────────────────────
  Booking Flow (requiresPrepayment=true)
  Step 4.5: Payment
  ┌─────────────────────────┐
  │ method: ▼ Crédito       │
  │ parcels: ▼ 3x           │
  └─────────────────────────┘
       │
       ▼
  createPayment(status=pending)
       │
       ▼
  Appointment created + Payment linked
       │
       ▼
  completed → updatePaymentStatus(payment.id, "completed")
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Installment calculation complexity** — different businesses use different formulas (price table, SAC, etc.) | Start with simplified formula (linear interest). Document it clearly. Make it easy to swap the calculation function later. |
| **Modal not opening** — front-end race condition between status update and modal trigger | Return `{ openPaymentModal: true }` from the action and handle it in the mutation response. Use a callback pattern, not polling. |
| **Prepayment creates Payment before service is delivered** — refund logic needed if cancelled | When prepayment exists and appointment is cancelled, mark Payment as `refunded` (manual process, no auto-refund). Add a note in the cancel flow. |
| **Org with no default interest rate** — divide-by-zero | Default `defaultInterestRate` to `0` in schema. Seed at 0. UI shows "No interest" when rate is 0. |
| **Large number of payment methods** — dropdown becomes unwieldy | Limit to active methods only. Add search if > 10 methods. |

## Migration Plan

1. Deploy schema changes (additive only — no existing data affected):
   - Create `PaymentMethod` table
   - Add columns to `Payment`, `Service`, `OrganizationSetting`
   - Run `pnpm db:migrate`
2. Seed default payment methods in `src/lib/seed.ts`
3. Deploy backend changes (actions, API routes)
4. Deploy frontend changes (modal, booking flow, settings)
5. Deploy reports/dashboard changes

Rollback: Reverse order. New columns are additive and nullable — safe to revert frontend and backend independently.

## Open Questions

- Should installments use **Price Table (francês)** or **SAC** or **simple linear** formula? Decision: simple linear for v1.
- When prepayment is captured at booking, should the operator be able to **change method/parcels** at completion? Decision: yes — the modal re-opens at completion with pre-filled values from the prepayment, editable.
- Should `PaymentMethod` CRUD live in Organization Settings or a dedicated page? Decision: Organization Settings, in a new "Payment Methods" section alongside other configs.
