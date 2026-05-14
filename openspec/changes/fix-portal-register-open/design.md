## Context

The client portal has two auth pages: login (`/portal/login`) and register (`/portal/register`). The login page was fixed in a previous change (`2026-05-14-fix-portal-auth`) to include an org autocomplete and org-scoped login. The register page was left broken:

1. The `(client-portal)/layout.tsx` only exempts `/portal/login` from auth — any unauthenticated visit to `/portal/register` gets redirected to login
2. The register page requires `?org=` in the URL (invite-only), but the login page links to `/portal/register` without it, creating a dead-end
3. No birth date field exists on User or Client models

The backend API already supports registration (`POST /api/v1/auth/client-register`) and org lookup (`GET /api/v1/auth/orgs/lookup`). Both work correctly.

## Goals / Non-Goals

**Goals:**
- Make `/portal/register` accessible to unauthenticated visitors
- Add `OrgAutocomplete` (existing component) to the register form so users select their org
- Add optional birth date field to registration form and persist it
- Remove the `?org=` URL requirement from register page
- Keep auto-login and redirect to `/portal/dashboard` on success (already works)

**Non-Goals:**
- Changing the login page's auth flow or org selector (already works)
- Adding password reset to portal auth (separate initiative)
- Magic link implementation (tracked separately)
- Email verification on registration (out of scope)
- Phone field on registration (user chose not to include it)

## Decisions

### Decision 1: Layout exception — widen `isLoginPage` to `isPublicPage`

Change the layout to treat both `/portal/login` and `/portal/register` as public routes. Use an array:

```typescript
const PUBLIC_PORTAL_ROUTES = ['/portal/login', '/portal/register']
const isPublicPage = PUBLIC_PORTAL_ROUTES.includes(pathname)
```

**Alternatives considered:**
- `pathname.startsWith('/portal/')` — too broad, would expose dashboard pages
- Route group middleware — would require restructuring the route groups

### Decision 2: Reuse existing `OrgAutocomplete` component

The `OrgAutocomplete` component already exists at `src/components/org-autocomplete.tsx`. It's used in the login page and works identically for register: user types 2+ chars, debounced fetch to `/api/v1/auth/orgs/lookup?q=...`, selects an org, stores the slug. No changes needed to the component itself.

### Decision 3: `?org=` URL param becomes fallback, not requirement

Previously `?org=` was required. Now it's optional:
- If `?org=slug` is present: auto-select that org (pre-filled, useful for invite links)
- If absent: user selects org via autocomplete (normal flow)

This preserves backward compatibility with existing invite links.

### Decision 4: Birth date on both User and Client models

Birth date (stored as `birthDate`, `DateTime?`) is added to both models:

```
User.birthDate    → nullable DateTime
Client.birthDate  → nullable DateTime
```

**Why both?** The User model is the auth identity; the Client model is the CRM record. Keeping birth date on both avoids a join for display on either side. This duplicates data but for a single field that rarely changes, the trade-off is acceptable.

**Alternatives considered:**
- Only on Client (requires join for user-facing display)
- Only on User (requires join for CRM display)

### Decision 5: Zod schema extended with `birthDate` as optional string

The client form will collect birth date as an `<input type="date">` string (`YYYY-MM-DD`). The Zod schema coerces it to a `Date` or `undefined`:

```typescript
birthDate: z.string().optional()
```

The server action converts the string to `new Date(birthDate)` before passing to Prisma.

## Risks / Trade-offs

- **[Risk]** Existing invite links with `?org=` continue to work, but the resolved org name display changes — previously the page showed "Join {orgName}" in the header. This is preserved since the org name resolution API call still runs on mount. → **No migration needed**
- **[Risk]** Adding a `birthDate` field to User model requires a DB migration. Since it's nullable, existing rows are unaffected. → **Safe migration**
- **[Trade-off]** Duplicating `birthDate` on User + Client slightly denormalizes the schema. For a single optional field that rarely changes, this is acceptable and avoids cross-model joins for display.
