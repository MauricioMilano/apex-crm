## Why

CRM clients need recurring service plans (subscriptions) alongside one-off services. Currently, every `Service` has a fixed price paid per appointment. Businesses offering membership models — monthly plans that include a set of services — have no way to model this in the system. This blocks a significant revenue model for service-based businesses like gyms, clinics, salons, and consulting firms.

## What Changes

- **New Prisma models**: `SubscriptionPlan`, `SubscriptionPlanService`, `ClientSubscription`
- **Modified model**: `Appointment` gains optional `clientSubscriptionId` to track plan-covered appointments
- **New Settings page** (`/settings/plans`): Admin CRUD for subscription plans — name, price, billing period, max appointments per period, and which services are included
- **New Settings section** (`/settings/subscriptions` or integrated into Clients page): Admin assigns/cancels plans per client
- **New Client Portal registration**: Clients can self-register via an org-specific invite link (slug-based) — creates `User(role: client)` + `Client` record
- **New Client Portal pages**: `/portal/plans` (view available plans), `/portal/subscriptions` (my active subscriptions with usage progress)
- **Modified Client Portal dashboard**: Shows subscription usage summary card
- **Modified Booking Flow**: Services included in an active subscription show as "Included in Plan X" instead of price; client selects which plan to use when multiple apply
- **New API routes** (`/api/v1/subscription-plans`, `/api/v1/client-subscriptions`)
- **New Server Actions** for subscription CRUD and assignment
- **No payment gateway integration** — subscriptions are operational only (no billing engine)

## Capabilities

### New Capabilities
- `subscription-plan-management`: Admin CRUD for subscription plans, including which services are included and per-period limits
- `client-subscription-management`: Admin assigns, updates, and cancels client subscriptions; tracks usage cycles
- `client-self-registration`: Clients register via org invite link, creating their user account and client profile
- `client-portal-subscriptions`: Client-facing pages to view available plans and manage active subscriptions with progress tracking
- `subscription-aware-booking`: Booking flow detects active subscriptions and handles plan-covered appointments

### Modified Capabilities
<!-- None — no existing spec-level requirements are changing -->

## Impact

| Area | Change |
|------|--------|
| **Prisma Schema** | 3 new models + 1 field on `Appointment`; migration required |
| **Backend Actions** | New: `subscription-plans.ts`, `client-subscriptions.ts`, `client-registration.ts` |
| **API Routes** | New: `/api/v1/subscription-plans`, `/api/v1/client-subscriptions`, `PATCH /api/v1/clients/:id/subscriptions` |
| **Admin UI** | New: `/settings/plans` page; Clients page updated with subscription management |
| **Client Portal** | New: `/portal/register`, `/portal/plans`, `/portal/subscriptions`; modified: dashboard, booking flow |
| **CRM Context** | New state/actions for subscription plans and client subscriptions |
| **Types** | New TypeScript interfaces for `SubscriptionPlan`, `SubscriptionPlanService`, `ClientSubscription` |
