## Why

The client portal auth system has no organization context: the login page accepts any email/password without knowing which org the user belongs to, and the register page requires a `?org=` URL parameter that's difficult to discover. Demo credentials are hardcoded in the portal login page. The CRM register page also has a bug where the organization name from the form is ignored and hardcoded as "Personal".

## What Changes

- **Portal login**: Add org slug autocomplete dropdown so users can select their organization before signing in. Login is then scoped to that org.
- **Portal register**: Keep invite-only (`?org=` in URL). Fix the broken org lookup (GET endpoint doesn't exist). Show the real org name (not just slug) on the register form.
- **Portal login**: Remove hardcoded demo credentials line.
- **Auth API**: `loginUser` now accepts an optional `orgSlug` to scope the user lookup to a specific organization.
- **Auth API**: Add GET handler to `client-register` route for org lookup by slug.
- **CRM register**: Fix `auth-context.tsx` to pass `organizationName` from form instead of hardcoding `'Personal'`.
- **CRM register**: Add a second path "Join existing organization" alongside "Create new organization" — uses invite token system.
- **Credentials**: Remove hardcoded passwords from `agents/constrains.md`.

## Capabilities

### New Capabilities
- `portal-auth-with-org`: Org-aware client portal authentication — org selector on login, org-scoped login logic, org lookup API, register org name resolution.
- `crm-invite-join`: Invite-only join flow for CRM register — admin generates invite link, new user registers via token and joins as employee.

### Modified Capabilities
- (none)

## Impact

- **Files to modify:**
  - `src/app/(client-portal)/portal/login/page.tsx` — add org dropdown, remove demo creds
  - `src/app/(client-portal)/portal/register/page.tsx` — fix org lookup, show real org name
  - `src/contexts/auth-context.tsx` — pass `organizationName` from form, support org-scoped login
  - `src/actions/auth.ts` — `loginUser` accepts `orgSlug` param
  - `src/app/api/v1/auth/login/route.ts` — pass `orgSlug` from request body
  - `src/app/api/v1/auth/client-register/route.ts` — add GET handler for org lookup
  - `src/app/(auth)/register/page.tsx` — add "join org" option with invite token
  - `src/actions/auth.ts` or new action — invite-join server action
  - `agents/constrains.md` — remove hardcoded password
- **Prisma changes:** None (slug and invite-token columns already exist)
- **Dependencies:** None
