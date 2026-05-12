## Context

Currently, the CRM has a single `Service` model with a fixed `price` field. Every appointment is billed per-service. There is no concept of subscription plans, recurring billing cycles, or plan-covered appointments. Clients exist as a `Client` record but have no self-registration flow — they are created exclusively by admins.

The client portal (`(client-portal)/`) has login, dashboard, booking, appointments, and profile pages. Booking shows all active services with their prices. The auth system uses a `User` model with roles (`admin`, `employee`, `client`), but there is no mechanism for clients to create their own account.

This design introduces subscription plans as an operational concept (no payment gateway), client self-registration via org invite slugs, and modifies the booking flow to be plan-aware.

## Goals / Non-Goals

**Goals:**
- Allow admins to create subscription plans that group services with a recurring price and per-period usage limits
- Allow admins to assign multiple active subscriptions per client
- Allow clients to self-register via an org-specific invite link
- Show plan-covered services as "included" in the booking flow (no price displayed)
- Track per-cycle usage and auto-renew monthly (30-day rolling periods)
- Show subscription progress in the client portal dashboard and a dedicated page
- Support both per-plan global limits and per-service limits (optional)

**Non-Goals:**
- Payment gateway integration (Stripe, Asaas, etc.) — subscriptions are operational only
- Invoice generation or billing history
- Pro-rating or partial period calculations
- Public plan catalog visible without authentication
- Automated email/SMS renewal or usage alerts (future enhancement)
- Plan change mid-cycle (upgrade/downgrade) — admin must cancel and reassign

## Decisions

### 1. Same Service, Two Contexts
- **Decision**: A single `Service` can be sold both as standalone (pay per appointment) and included in a subscription plan.
- **Rationale**: Avoids duplicating service entries (e.g., "Haircut Standalone" vs "Haircut Plan"). The same `Service` is referenced by `SubscriptionPlanService`. The booking flow determines context based on the client's active subscriptions.
- **Alternative considered**: Separate `Service` types via an enum field — rejected because it would require maintaining parallel service catalogs.

### 2. Invite Link via Org Slug
- **Decision**: Admin configures an org-level slug (e.g., `apex-crm`). Clients register at `/portal/register?org=<slug>`. Any client with the link can register — the slug acts as a shared secret.
- **Rationale**: Simple to implement, no per-client invite tokens to manage. The slug is set once per organization.
- **Alternative considered**: Per-client email invites with unique tokens — more secure but adds complexity (email delivery, token expiry, resend logic). Can be layered on later.

### 3. Monthly Auto-Renewal (30-day cycles)
- **Decision**: Each `ClientSubscription` has `currentPeriodStart` and `currentPeriodEnd`. At the end of each 30-day period, the system auto-resets `appointmentsUsed` to 0 and advances the period. No admin action required.
- **Rationale**: Simple and predictable. Since there's no billing, auto-renewal is the expected behavior for operational subscriptions.
- **Alternative considered**: Manual renewal by admin — rejected because "monthly cycle" implies automatic progression.

### 4. Multiple Active Subscriptions Per Client
- **Decision**: A client can have multiple `ClientSubscription` records with `status: active` simultaneously. Each is independent with its own cycle and usage counter.
- **Rationale**: Businesses offer tiered or category-specific plans (e.g., "Hair Plan" + "Spa Plan"). A client might subscribe to both.
- **Impact**: Booking flow must let the client choose which plan to use when a service is covered by multiple active subscriptions.

### 5. Plan Limits — Global + Per-Service
- **Decision**: `SubscriptionPlan` has an optional `maxApptsPerPeriod` (global cap). `SubscriptionPlanService` has an optional `maxPerPeriod` (per-service cap within the plan). If both are set, the more restrictive applies at booking time.
- **Rationale**: Supports both "8 appointments total per month" and "max 4 haircuts per month" within the same plan. Null means unlimited.

### 6. Appointment Tracks Subscription Usage
- **Decision**: `Appointment` gains an optional `clientSubscriptionId` foreign key. When an appointment is created under a plan, this field is set and `appointmentsUsed` is incremented on the `ClientSubscription`.
- **Rationale**: Clean separation — existing appointment logic is untouched for standalone bookings. The FK allows querying "appointments made under plan X" and enforcing limits.

## Data Model

```prisma
model SubscriptionPlan {
  id                   String                    @id @default(cuid())
  organizationId       String                    @map("organization_id")
  name                 String
  description          String?
  price                Decimal                   @db.Decimal(10, 2)
  billingPeriod        BillingPeriod             @default(monthly)
  maxApptsPerPeriod    Int?                      @map("max_appts_per_period")
  isActive             Boolean                   @default(true) @map("is_active")
  createdAt            DateTime                  @default(now()) @map("created_at")
  updatedAt            DateTime                  @updatedAt @map("updated_at")

  organization         Organization              @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  planServices         SubscriptionPlanService[]
  clientSubscriptions  ClientSubscription[]

  @@map("subscription_plans")
}

model SubscriptionPlanService {
  id            String            @id @default(cuid())
  planId        String            @map("plan_id")
  serviceId     String            @map("service_id")
  maxPerPeriod  Int?              @map("max_per_period")

  plan          SubscriptionPlan  @relation(fields: [planId], references: [id], onDelete: Cascade)
  service       Service           @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@unique([planId, serviceId])
  @@map("subscription_plan_services")
}

model ClientSubscription {
  id                 String            @id @default(cuid())
  clientId           String            @map("client_id")
  planId             String            @map("plan_id")
  status             SubscriptionStatus @default(active)
  startDate          DateTime          @default(now()) @map("start_date")
  endDate            DateTime?         @map("end_date")
  currentPeriodStart DateTime          @default(now()) @map("current_period_start")
  currentPeriodEnd   DateTime          @map("current_period_end")
  appointmentsUsed   Int               @default(0) @map("appointments_used")
  createdAt          DateTime          @default(now()) @map("created_at")
  updatedAt          DateTime          @updatedAt @map("updated_at")

  client             Client            @relation(fields: [clientId], references: [id], onDelete: Cascade)
  plan               SubscriptionPlan  @relation(fields: [planId], references: [id])
  appointments       Appointment[]

  @@map("client_subscriptions")
}

enum BillingPeriod {
  monthly
  quarterly
  semiannual
  annual

  @@map("billing_period")
}

enum SubscriptionStatus {
  active
  cancelled
  expired

  @@map("subscription_status")
}
```

**Modified model — Appointment** (add field):
```prisma
  clientSubscriptionId String?             @map("client_subscription_id")
  clientSubscription   ClientSubscription? @relation(fields: [clientSubscriptionId], references: [id])
```

### Client Registration (no new model)
The existing `User` model is used with `role: client`. Registration creates:
1. `User { organizationId, email, passwordHash, firstName, lastName, role: "client" }`
2. `Client { organizationId, firstName, lastName, email }` (linked by email)

The registration page reads the `org` query parameter to look up the organization by slug and pre-fills the `organizationId`.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE REGISTRO                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Client opens /portal/register?org=apex-crm                         │
│       │                                                              │
│       ▼                                                              │
│  POST /api/v1/auth/client-register                                   │
│       │                                                              │
│       ├── Lookup Organization by slug                                │
│       ├── Create User { role: client, organizationId }               │
│       ├── Create Client { organizationId, email }                    │
│       ├── Set session cookie                                         │
│       └── Return user                                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    BOOKING FLOW (modificado)                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: Select Service                                              │
│       │                                                              │
│       ├── Client has active subscription covering this service?      │
│       │     YES → Show badge "Included in [Plan Name]"               │
│       │            If multiple plans → show selector                 │
│       │     NO  → Show price "$X.XX"                                │
│       │                                                              │
│       ▼                                                              │
│  Step 4: Confirm (modified summary)                                  │
│       ├── If using plan: "Service: Haircut (Included in Premium)"   │
│       ├── If standalone: "Service: Haircut — $50.00"                │
│       │                                                              │
│       ▼                                                              │
│  POST /api/v1/appointments (with optional clientSubscriptionId)     │
│       │                                                              │
│       └── Increment appointmentsUsed on ClientSubscription           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/subscription-plans` | List plans |
| POST | `/api/v1/subscription-plans` | Create plan |
| GET | `/api/v1/subscription-plans/:id` | Get plan details |
| PATCH | `/api/v1/subscription-plans/:id` | Update plan |
| DELETE | `/api/v1/subscription-plans/:id` | Delete plan (check FK) |
| GET | `/api/v1/clients/:id/subscriptions` | List client's subscriptions |
| POST | `/api/v1/clients/:id/subscriptions` | Assign plan to client |
| PATCH | `/api/v1/client-subscriptions/:id` | Update/cancel subscription |
| POST | `/api/v1/auth/client-register` | Client self-registration |

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Slug-based registration is unauthenticated — anyone with the link can register | Spam/unwanted accounts | Slug is a shared secret; admin controls who receives it. Rate-limit registration per IP. Future: add CAPTCHA or allowlist domains. |
| No billing means no churn enforcement | Clients with expired subs still access portal | System auto-expires subs (status: expired) when period ends. Client sees "no active plans" but keeps account. |
| Appointment under subscription increments counter — race condition | Over-counting if concurrent bookings | Use Prisma `update({ where: { id, appointmentsUsed: <current> } })` with retry, or a database-level optimistic lock. |
| Admin assigns plans manually — large client bases | Operational overhead | Future enhancement: self-service plan selection by client. For now, manual assignment matches the "hybrid" model. |
| Multiple plans covering same service | Booking UX complexity | Client picks which plan to use via radio/dropdown. Default to plan with most remaining appointments. |

## Migration Plan

1. Add new models and field via Prisma migration (`pnpm db:migrate`)
2. Generate Prisma client (`pnpm db:generate`)
3. Update TypeScript types
4. Implement backend (actions + API routes)
5. Implement admin UI (settings pages)
6. Implement client portal (registration + subscription pages)
7. Modify booking flow
8. Update CRM context
9. Run seed script with sample subscription plans
10. Test all flows

## Open Questions

<!-- Resolved during exploration — no open questions remain. -->
