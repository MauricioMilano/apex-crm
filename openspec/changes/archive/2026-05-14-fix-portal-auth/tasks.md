## 1. Auth API — Org Lookup Endpoint

- [x] 1.1 Create `src/app/api/v1/auth/orgs/lookup/route.ts` GET handler — supports `?slug=` (exact match) and `?q=` (partial search, max 10 results)
- [x] 1.2 Create `lookupOrgBySlug` / `searchOrgs` in a server action (`src/actions/auth.ts` or new `src/actions/orgs.ts`) — Prisma queries against `Organization` model returning `{ id, name, slug }`

## 2. Auth API — Org-Scoped Login

- [x] 2.1 Update `loginUser` in `src/actions/auth.ts` — accept optional `orgSlug` parameter; when provided, use `findFirst({ where: { email, organization: { slug: orgSlug } } })`
- [x] 2.2 Update `POST /api/v1/auth/login` route to read `orgSlug` from request body and pass it to `loginUser`
- [x] 2.3 Update `src/actions/auth-client.ts` `login` function to accept and forward `orgSlug`
- [x] 2.4 Update `src/contexts/auth-context.tsx` `login` signature to accept optional `orgSlug` parameter and pass it through

## 3. Portal Login — Org Selector + Credential Removal

- [x] 3.1 Build org autocomplete component using Shadcn `Command` + `Popover` — fetches orgs from `/api/v1/auth/orgs/lookup?q=...` on 2+ chars input
- [x] 3.2 Update `src/app/(client-portal)/portal/login/page.tsx` — add org autocomplete field before email/password, pass selected `orgSlug` to login call
- [x] 3.3 Remove hardcoded demo credentials paragraph from portal login page (line 134: "Demo: client@example.com / Password123!")

## 4. Portal Register — Fix Org Lookup

- [x] 4.1 Update `src/app/(client-portal)/portal/register/page.tsx` `useEffect` — replace fake GET fetch with real call to `/api/v1/auth/orgs/lookup?slug=...`
- [x] 4.2 Display resolved org `name` instead of raw slug in the register form header (fallback to slug if name unavailable)

## 5. CRM Register — Fix `organizationName` Bug

- [x] 5.1 Fix `src/contexts/auth-context.tsx` `register` callback — pass `data.organizationName` instead of hardcoded `'Personal'`; use `data.organizationName ?? 'Personal'` as fallback

## 6. CRM Register — Invite-Join Flow

- [x] 6.1 Create invite-join server action (`src/actions/invite-join.ts`) — validates invite token against `resetToken`/`resetTokenExpires` on User, creates user with passwordHash, sets `isActive: true`, clears token fields, sets session cookie
- [x] 6.2 Update `src/app/(auth)/register/page.tsx` — add two-mode UI (Create Org / Join Org) with conditional form rendering
- [x] 6.3 Wire join form submission to invite-join server action, wire create-org form to existing `useAuth().register()` flow

## 7. Cleanup

- [x] 7.1 Remove hardcoded password from `agents/constrains.md` line 18
