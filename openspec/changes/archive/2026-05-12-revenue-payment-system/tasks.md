## 1. Database Schema

- [x] 1.1 Add `PaymentStatus` enum and `Payment` model to `prisma/schema.prisma` with fields: id, organizationId, amount (Decimal), currency, status, referenceType, referenceId, adjustedPaymentId (optional), description, paidAt, timestamps
- [x] 1.2 Add `adjusted` to PaymentStatus enum values (pending, completed, refunded, failed, adjusted)
- [x] 1.3 Run migration: `pnpm db:migrate` and generate client: `pnpm db:generate`
- [x] 1.4 Add `Payment` TypeScript interface and `PaymentStatus` type to `src/types/index.ts`

## 2. Payment Backend Actions

- [x] 2.1 Create `src/actions/payments.ts` with `getPayments` (filters: dateFrom, dateTo, referenceType, referenceId, status) and `createPayment` server actions using Zod validation
- [x] 2.2 Add `updatePaymentStatus` action to support changing status (e.g., marking as `adjusted`)
- [x] 2.3 Create `GET /api/v1/payments` and `POST /api/v1/payments` API routes in `src/app/api/v1/payments/`

## 3. Payment Automation — Standalone Appointments

- [x] 3.1 Modify `updateAppointmentStatus` in `src/actions/appointments.ts`: when status changes to `completed` and appointment has no `clientSubscriptionId`, auto-generate a `completed` Payment with `amount = service.price`
- [x] 3.2 Verify Payment is NOT generated when appointment has `clientSubscriptionId` or status is not `completed`

## 4. Payment Automation — Subscriptions (billingPeriod fix + auto-payments)

- [x] 4.1 Create helper function `getBillingPeriodDays(billingPeriod): number` in a shared utility (e.g., `src/lib/billing.ts`) mapping monthly→30, quarterly→90, semiannual→180, annual→365
- [x] 4.2 Create helper function `calculateProRata(planPrice, periodDays, activeDays): number` in `src/lib/billing.ts`
- [x] 4.3 Modify `assignPlan` in `src/actions/client-subscriptions.ts`: use `getBillingPeriodDays` for `currentPeriodEnd` calculation; generate pro-rata or full Payment on creation
- [x] 4.4 Modify `renewPeriodIfNeeded` in `src/actions/client-subscriptions.ts`: use `getBillingPeriodDays` for period advancement; generate `completed` Payment on each renewal
- [x] 4.5 Modify `cancelSubscription` in `src/actions/client-subscriptions.ts`: generate refund (negative) Payment with pro-rata for unused days when cancelled mid-cycle

## 5. Dashboard Revenue Card

- [x] 5.1 Modify `src/app/(dashboard)/dashboard/page.tsx`: replace current appointment-based revenue calculation with Payment-based calculation (sum of `completed` Payments where `paidAt` is in current month)
- [x] 5.2 Fetch Payments in the CRM context or via a dedicated fetch in the DashboardPage; add `payments` to `CRMContextValue` if needed
- [x] 5.3 Update Monthly Revenue card description from \"completed appointments\" to \"recorded payments\"
- [x] 5.4 Ensure trend comparison (current month vs previous month) uses same Payment-based logic

## 6. Financial Reports Page

- [x] 6.1 Create `src/app/(dashboard)/reports/page.tsx` — dedicated Financial Reports page with layout scaffolding
- [x] 6.2 Add Reports link to dashboard sidebar navigation (`src/components/dashboard/sidebar.tsx`)
- [x] 6.3 Build date range filter component and payment type filter (appointment / subscription / all)
- [x] 6.4 Build summary cards (total revenue, payment count, average payment, vs previous period)
- [x] 6.5 Build monthly revenue chart (bar/line chart using a simple library or inline SVG; differentiate appointment vs subscription revenue)
- [x] 6.6 Build paginated payments table (date, description, type, amount, status)
- [x] 6.7 Implement CSV export (server-side endpoint generating CSV from current filters)

## 7. Payment UI in Appointment Details

- [x] 7.1 Add Payment section to appointment detail page showing related Payments (via `referenceType=appointment`)
- [x] 7.2 Add "Record Payment" button/modal allowing staff to create manual Payments or adjust existing ones
- [x] 7.3 Implement adjustment flow: new Payment creation marks previous as `adjusted`
- [x] 8.1 Add Payment history section to subscription detail view showing related Payments (via `referenceType=subscription`)
- [x] 8.2 Allow manual Payment creation for subscriptions (e.g., manual renewal charge)

## 9. Validation & Polish

- [x] 9.1 Run typecheck: `pnpm exec tsc --noEmit` — fix any type errors
- [x] 9.2 Run lint: `pnpm lint` — fix any lint issues
- [x] 9.3 Run build: `pnpm build` — verify production build succeeds
- [x] 9.4 Test flow: create standalone appointment → complete → verify Payment auto-generated → dashboard revenue updates
- [x] 9.5 Test flow: create subscription plan → assign to client → verify Payment generated → cancel mid-cycle → verify refund
