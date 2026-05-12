## 1. Database (Prisma Schema & Migration)

- [x] 1.1 Add `BillingPeriod` enum (`monthly`, `quarterly`, `semiannual`, `annual`) to schema
- [x] 1.2 Add `SubscriptionStatus` enum (`active`, `cancelled`, `expired`) to schema
- [x] 1.3 Add `SubscriptionPlan` model with fields: id, organizationId, name, description, price, billingPeriod, maxApptsPerPeriod, isActive, timestamps
- [x] 1.4 Add `SubscriptionPlanService` model with unique constraint on [planId, serviceId] and optional maxPerPeriod
- [x] 1.5 Add `ClientSubscription` model with fields: id, clientId, planId, status, startDate, endDate, currentPeriodStart, currentPeriodEnd, appointmentsUsed, timestamps
- [x] 1.6 Add optional `clientSubscriptionId` field to `Appointment` model with relation to `ClientSubscription`
- [x] 1.7 Run `pnpm db:migrate` to create migration
- [x] 1.8 Run `pnpm db:generate` to update Prisma client

## 2. TypeScript Types

- [x] 2.1 Add `BillingPeriod` type to `src/types/index.ts`
- [x] 2.2 Add `SubscriptionStatus` type to `src/types/index.ts`
- [x] 2.3 Add `SubscriptionPlan` interface to `src/types/index.ts`
- [x] 2.4 Add `SubscriptionPlanService` interface to `src/types/index.ts`
- [x] 2.5 Add `ClientSubscription` interface to `src/types/index.ts`
- [x] 2.6 Update `Appointment` interface with optional `clientSubscriptionId`

## 3. Backend — Server Actions

- [x] 3.1 Create `src/actions/subscription-plans.ts` with: `getPlans`, `getPlan`, `createPlan`, `updatePlan`, `deletePlan`
- [x] 3.2 Create `src/actions/client-subscriptions.ts` with: `getClientSubscriptions`, `assignPlan`, `cancelSubscription`, `renewPeriodIfNeeded`
- [x] 3.3 Create `src/actions/client-registration.ts` with: `registerClient` action (creates User + Client, org lookup by slug)
- [x] 3.4 Modify `src/actions/services.ts` — add `getServicesWithPlanStatus(clientId)` that returns services enriched with plan coverage info
- [x] 3.5 Modify `src/actions/appointments.ts` — when creating appointment with `clientSubscriptionId`, increment `appointmentsUsed` on the `ClientSubscription`
- [x] 3.6 Add `renewExpiredPeriods` utility to auto-advance subscription cycles on read

## 4. Backend — API Routes

- [x] 4.1 Create `src/app/api/v1/subscription-plans/route.ts` (GET list, POST create)
- [x] 4.2 Create `src/app/api/v1/subscription-plans/[id]/route.ts` (GET, PATCH, DELETE)
- [x] 4.3 Create `src/app/api/v1/clients/[id]/subscriptions/route.ts` (GET list, POST assign)
- [x] 4.4 Create `src/app/api/v1/client-subscriptions/[id]/route.ts` (PATCH cancel)
- [x] 4.5 Create `src/app/api/v1/auth/client-register/route.ts` (POST — client self-registration)

## 5. Admin UI — Settings: Subscription Plans

- [x] 5.1 Create `src/app/(dashboard)/settings/plans/page.tsx` — list all plans with table
- [x] 5.2 Add Dialog for creating/editing plan (name, description, price, billingPeriod, maxApptsPerPeriod)
- [x] 5.3 Add service selection UI within plan dialog (multi-select from active services)
- [x] 5.4 Add per-service limit configuration in plan dialog
- [x] 5.5 Add delete confirmation with FK protection
- [x] 5.6 Add navigation item in `settings/layout.tsx` sidebar for "Plans"

## 6. Admin UI — Client Subscription Management

- [x] 6.1 Add subscription section to existing clients page (or create new page)
- [x] 6.2 Add "Assign Plan" button/dialog on client profile — select plan and confirm
- [x] 6.3 Show client's subscriptions list with status, usage, period dates
- [x] 6.4 Add "Cancel" action for active subscriptions with confirmation

## 7. Client Portal — Self-Registration

- [x] 7.1 Create `src/app/(client-portal)/portal/register/page.tsx` with registration form (firstName, lastName, email, password)
- [x] 7.2 Add org slug lookup via query parameter (`?org=apex-crm`)
- [x] 7.3 Add error states (invalid slug, email taken, validation errors)
- [x] 7.4 Add "Already have an account? Sign In" link on registration page
- [x] 7.5 Add "Don't have an account? Register" link on `/portal/login` page

## 8. Client Portal — My Subscriptions Page

- [x] 8.1 Create `src/app/(client-portal)/portal/subscriptions/page.tsx` — list all client subscriptions
- [x] 8.2 Show each subscription: plan name, status badge, period dates, usage bar (x of y)
- [x] 8.3 Add expandable details: included services list, per-service limits
- [x] 8.4 Add "Cancel Subscription" button with AlertDialog confirmation
- [x] 8.5 Create `src/app/(client-portal)/portal/plans/page.tsx` — list available plans (not yet subscribed)
- [x] 8.6 Add "Subscribe" button on available plans that creates a new ClientSubscription

## 9. Client Portal — Dashboard Subscription Card

- [x] 9.1 Add subscription summary card to dashboard (`/portal/dashboard/page.tsx`)
- [x] 9.2 Card shows each active subscription with progress bar and usage count

## 10. Client Portal — Modified Booking Flow

- [x] 10.1 Update `BookingFlow` to fetch client's active subscriptions on mount
- [x] 10.2 Modify service card rendering: show "Included in [Plan]" instead of price when covered
- [x] 10.3 Add plan selector UI when multiple subscriptions cover the same service
- [x] 10.4 Show limit-reached message when plan is exhausted (fallback to standalone price)
- [x] 10.5 Pass `clientSubscriptionId` when creating appointment under a plan
- [x] 10.6 Update confirmation summary to show "Included in [Plan]" vs price

## 11. Client Portal — Navigation

- [x] 11.1 Add "Plans" nav link (`/portal/plans`) in `src/app/(client-portal)/layout.tsx`
- [x] 11.2 Add "My Subscriptions" nav link (`/portal/subscriptions`) in same layout

## 12. CRM Context

- [x] 12.1 Add `subscriptionPlans` state + fetch to CRM context
- [x] 12.2 Add `clientSubscriptions` state + fetch for current client to CRM context
- [x] 12.3 Add `addSubscriptionPlan`, `updateSubscriptionPlan`, `deleteSubscriptionPlan` actions
- [x] 12.4 Add `assignPlan`, `cancelSubscription` actions

## 13. Tests

- [ ] 13.1 Unit tests for subscription plan Server Actions (CRUD, validation)
- [ ] 13.2 Unit tests for client subscription actions (assign, cancel, renew period)
- [ ] 13.3 Unit tests for client registration action (create User + Client)
- [ ] 13.4 Unit tests for booking limit enforcement (global + per-service)
- [ ] 13.5 Integration test: book appointment under subscription increments counter
- [ ] 13.6 Integration test: block booking when limit reached

## 14. Seed Data

- [x] 14.1 Add sample subscription plans to seed script (e.g., "Basic", "Premium", "Unlimited")
- [x] 14.2 Add sample plan-service associations to seed
- [x] 14.3 Add sample client subscription for demo client `client@example.com`

## 15. Validation & Polish

- [x] 15.1 Run typecheck (`pnpm exec tsc --noEmit`) and fix any errors
- [x] 15.2 Run lint (`pnpm lint`) — ESLint not configured (pre-existing)
- [x] 15.3 Run build (`pnpm build`) to verify production build
- [x] 15.4 Run test suite (`pnpm test:unit`) — no test script yet (pre-existing)
- [ ] 15.5 Manual QA of full flow: register client → assign plan → book included service → verify counter
