## Context

The CRM has two separate auth systems — CRM auth (for admins/employees at `/login`, `/register`) and client portal auth (for clients at `/portal/login`, `/portal/register`). Both currently lack proper organization scoping:

- Portal login has no org context — any user can log in if they know email/password
- Portal login hardcodes demo credentials in the UI
- Portal register requires `?org=` in URL but the lookup API doesn't exist (only POST is handled)
- CRM register ignores the `organizationName` form field and hardcodes `"Personal"`
- CRM register only supports "create new org" — no way to join an existing org

## Goals / Non-Goals

**Goals:**
- Add org selector (autocomplete dropdown) to portal login page
- Scope portal login authentication to the selected organization
- Fix portal register org lookup (add GET endpoint, resolve real org name)
- Remove all hardcoded demo credentials from pages and docs
- Fix CRM register to pass `organizationName` from form to server action
- Add "Join existing organization" invite flow to CRM register

**Non-Goals:**
- Password reset/recovery flow changes (separate from invite)
- Magic link email implementation (tracked as known issue #6)
- Portal registration becoming public (stays invite-only via `?org=`)
- Client portal data scoping beyond auth (tracked as known issue #21)

## Decisions

### Decision 1: Org selector UX — Command + Popover (Shadcn)

The org autocomplete will use Shadcn's `Command` + `Popover` components, already available in the codebase. When the user types 2+ characters, a debounced fetch queries `/api/v1/auth/orgs/lookup?q=...` and shows results in a command palette-style dropdown. The selected org's slug is stored in form state and sent with the login request.

**Alternatives considered:**
- Native `<datalist>`: Simpler but unstyled and inconsistent across browsers
- React Select: External dependency — violates the Shadcn-only constraint
- Server-side render all orgs: Doesn't scale beyond a few orgs

### Decision 2: Org lookup API — new route `/api/v1/auth/orgs/lookup`

A dedicated GET route with two query modes:
- `?slug=<slug>` → exact match, returns single org (used by register page)
- `?q=<query>` → partial slug search, returns max 10 results (used by login autocomplete)

**Why not extend `client-register`?** The register route is semantically about registration, not org discovery. A separate route is cleaner and reusable.

### Decision 3: `loginUser` accepts optional `orgSlug` parameter

The function signature changes from `loginUser(email, password)` to `loginUser(email, password, orgSlug?)`. When `orgSlug` is provided, the Prisma query uses `findFirst` with `{ email, organization: { slug: orgSlug } }`. When absent, it falls back to `findUnique({ where: { email } })` for backward compatibility.

**Threading path:**
```
portal/login/page.tsx
  → useAuth().login(email, password, orgSlug?)   ← signature extended
    → auth-client.ts loginAction(email, password, orgSlug?)
      → POST /api/v1/auth/login { email, password, orgSlug }
        → loginUser(email, password, orgSlug)
          → prisma.user.findFirst({ where: { email, organization: { slug: orgSlug } } })
```

### Decision 4: Invite flow reuses `resetToken`/`resetTokenExpires` on User model

Avoids Prisma schema changes by repurposing the existing `resetToken` and `resetTokenExpires` fields on the `User` model:

1. Admin invites team member → system creates a `User` with `isActive: false`, `role: "employee"`, generates a random token (via `crypto.randomBytes(32).toString("hex")`), stores bcrypt hash in `resetToken` with 7-day expiry in `resetTokenExpires`
2. System sends invite email with link: `/register?invite=<token>&email=<email>`
3. User clicks link → redirected to `/register` with pre-selected "Join" flow, email pre-filled
4. User fills name + password → server validates token against `resetToken`, updates user with `passwordHash`, `firstName`, `lastName`, sets `isActive: true`, clears `resetToken`/`resetTokenExpires`

**Conflict risk:** If a user simultaneously has a pending password reset and a pending invite, the `resetToken` would be overwritten. In practice this doesn't happen because invites target non-existent users (before account creation). Documented as a known limitation.

### Decision 5: CRM register page uses state machine (create vs join)

The page is restructured as a two-step flow:
```
┌─────────────────────────────────────┐
│  How would you like to proceed?     │
│                                     │
│  ┌─────────────────┐  ┌──────────┐ │
│  │  Create          │  │  Join    │ │
│  │  Organization    │  │  Existing│ │
│  │                  │  │  Org     │ │
│  │  [I'm an admin]  │  │[invite]  │ │
│  └────────┬────────┘  └─────┬────┘ │
│           │                  │       │
│           ▼                  ▼       │
│  ┌─────────────────┐  ┌──────────┐ │
│  │ Org name         │  │ Invite   │ │
│  │ First, Last      │  │ token    │ │
│  │ Email, Password  │  │ First,   │ │
│  │                  │  │ Last     │ │
│  │                  │  │ Email    │ │
│  │                  │  │ Password │ │
│  └─────────────────┘  └──────────┘ │
└─────────────────────────────────────┘
```

### Decision 6: `auth-context.tsx` register passes `organizationName` from form

Current bug: `organizationName: 'Personal'` hardcoded. Fix: use `data.organizationName ?? 'Personal'` as fallback.

## Risks / Trade-offs

- **[Risk]** Invite token reuse: `resetToken` field is shared with password reset flow → **Mitigation:** Clear token immediately after invite is claimed. Invite-only applies to new users (no existing `resetToken` at creation time).
- **[Risk]** Org slug collision: Two orgs with similar names could confuse users in autocomplete → **Mitigation:** Show org `name` (not slug) in dropdown, with slug as subtitle. Display format: "ACME Business Solutions (acmebiz)".
- **[Trade-off]** Portal register stays invite-only: Users without an invite link can't register. This is intentional — prevents unauthorized client registration. The login page org dropdown doesn't help with registration.
- **[Trade-off]** No Prisma migration: Repurposing `resetToken` is pragmatic but semantically imprecise. If the invite flow expands later, a dedicated `Invite` model would be cleaner.
- **[Risk]** CRM login page doesn't get org selector: Out of scope per non-goals. CRM users log into their own org context via session.
