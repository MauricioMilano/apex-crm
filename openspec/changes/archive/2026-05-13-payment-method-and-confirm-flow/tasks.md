## 1. Database Schema (Prisma)

- [x] 1.1 Add `PaymentMethod` model to `prisma/schema.prisma` with fields: id, organizationId, name, code, requiresDocs, isActive, timestamps. Add relation to Organization and Payment.
- [x] 1.2 Add `paymentMethodId` (optional FK → PaymentMethod), `installments` (Int, default 1), `cardLastFour` (optional String) to `Payment` model.
- [x] 1.3 Add `requiresPrepayment` (Boolean, default false) and `interestRate` (optional Decimal @db.Decimal(4,2)) to `Service` model.
- [x] 1.4 Add `defaultInterestRate` (optional Decimal @db.Decimal(4,2)) to `OrganizationSetting` model.
- [x] 1.5 Generate Prisma migration and apply: `pnpm db:migrate`

## 2. TypeScript Types

- [x] 2.1 Add `PaymentMethod` interface to `src/types/index.ts`.
- [x] 2.2 Update `Payment` interface with `paymentMethodId`, `installments`, `cardLastFour`, `paymentMethod` (optional joined).
- [x] 2.3 Update `Service` interface with `requiresPrepayment`, `interestRate`.
- [x] 2.4 Update `OrganizationSetting` interface with `defaultInterestRate`.

## 3. Seed Data

- [x] 3.1 Update `src/lib/seed.ts` to create 5 default payment methods (Debit, Credit, Cash, PIX, Transfer) per organization. Credit has `requiresDocs = true`.
- [x] 3.2 Update `src/lib/seed.ts` to set `defaultInterestRate` on organization settings.

## 4. Backend — PaymentMethod CRUD

- [x] 4.1 Create `src/actions/payment-methods.ts` with server actions: `getPaymentMethods`, `createPaymentMethod`, `updatePaymentMethod`, `deletePaymentMethod`. Each scoped to `DEFAULT_ORG_ID`. Use Zod validation.
- [x] 4.2 Create `src/app/api/v1/payment-methods/route.ts` (GET list, POST create).
- [x] 4.3 Create `src/app/api/v1/payment-methods/[id]/route.ts` (GET one, PATCH update, DELETE).

## 5. Backend — Payment Actions Update

- [x] 5.1 Update `createPaymentSchema` in `src/actions/payments.ts` to accept `paymentMethodId`, `installments`, `cardLastFour`.
- [x] 5.2 Update `getPayments` to support filtering by `paymentMethodId` and include the `paymentMethod` relation in the response.

## 6. Backend — Appointment Completion Flow

- [x] 6.1 Modify `updateAppointmentStatus` (and `updateAppointment`) in `src/actions/appointments.ts`: when status = `completed`, if `clientSubscriptionId` exists, skip payment. Otherwise, return `openPaymentModal: true` + `defaultPaymentAmount`.
- [x] 6.2 Update the CRM context's `updateAppointment` to handle the `openPaymentModal` signal from the API response and store `pendingPayment`.
- [x] 6.3 In the API route `PATCH /api/v1/appointments/[id]`, propagate the `openPaymentModal` flag in the response.

## 7. Frontend — Confirm Payment Modal

- [x] 7.1 Create `src/components/payments/confirm-payment-modal.tsx` with: amount input (pre-filled), method dropdown (active methods only), installment selector with live calculation, cardLastFour (optional), description (optional).
- [x] 7.2 Implement installment calculation utility in `src/lib/payment.ts`: function `calculateInstallments(amount, installments, monthlyRate)` returns array of `{installmentNumber, value, total}`.
- [x] 7.3 Integrate modal into `src/app/(dashboard)/appointments/[id]/page.tsx` — auto-open when `openPaymentModal` signal is received. Wire the "Confirm" button to call the payments API.
- [x] 7.4 Add "Pending" status display for prepayments in the appointment detail payments list.

## 8. Frontend — Booking Flow Prepaintegration

- [x] 8.1 Add payment step to `src/components/appointments/booking-flow.tsx`: when selected service has `requiresPrepayment = true`, show step 4 with method + installment selectors.
- [x] 8.2 Wire the prepayment data to the `addAppointment` call — create Payment with status = pending alongside the appointment.
- [x] 8.3 Hide payment step if the client's subscription covers the selected service.

## 9. Frontend — Payment Method Management UI

- [x] 9.1 Create settings page/section at `src/app/(dashboard)/settings/payment-methods/page.tsx` with list of methods + add/edit/deactivate controls.
- [x] 9.2 Create `src/components/settings/payment-method-form.tsx` form component for creating/editing a payment method.
- [x] 9.3 Add navigation link in settings layout to the new Payment Methods page.

## 10. Frontend — Service Settings Update

- [x] 10.1 Update the service form in Settings → Services to include `requiresPrepayment` (checkbox) and `interestRate` (optional number input).
- [x] 10.2 Update the service CRUD actions and API routes to accept and persist these new fields, if not already auto-wired.

## 11. Frontend — Reports Upgrade

- [x] 11.1 Add payment method filter dropdown to `src/app/(dashboard)/reports/page.tsx`.
- [x] 11.2 Add distribution chart (pie or stacked bar) showing revenue split by payment method.
- [x] 11.3 Add "Installments Receivable" section showing projected future amounts.
- [x] 11.4 Update CSV export to include `paymentMethod`, `installments`, `cardLastFour` columns.
- [x] 11.5 Ensure all filters and chart data update reactively when date/method filters change.
- [x] 12.1 Update the Monthly Revenue card in `src/app/(dashboard)/dashboard/page.tsx` to include an inline stacked bar showing contribution by payment method.
- [x] 12.2 Fetch payment methods alongside payments data for method name resolution.

## 13. Validation & Polish

- [x] 13.1 Run `pnpm exec tsc --noEmit` — fix any type errors. ✅ Passed
- [x] 13.2 Run `pnpm lint` — lint clean for our changes (pre-existing errors in other files remain) ✅
- [x] 13.3 Run `pnpm build --no-lint` — production build succeeds ✅
- [x] 13.4 Run `pnpm db:seed` and verify default payment methods are created.
- [x] 13.5 Manual smoke test: create appointment with prepayment → confirm modal appears at completion → verify reports filter by method.
