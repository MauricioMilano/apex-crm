## Why

Client portal registration at `/portal/register` is broken — the layout redirects unauthenticated users to login before they see the page, and registration requires a `?org=` invite link with no way for users to select their organization. This makes self-registration impossible for new clients, blocking the primary client acquisition funnel.

## What Changes

- **Portal register page**: Add `OrgAutocomplete` dropdown so users can select their organization instead of requiring `?org=` in the URL
- **Portal layout**: Exempt `/portal/register` from auth redirect (alongside `/portal/login`)
- **Registration form**: Add optional birth date field
- **Prisma schema**: Add `birthDate` column to `User` and `Client` models
- **Server action**: Update `registerClient` schema to accept optional `birthDate`
- **Login page "Register" link**: Keep it pointing to `/portal/register` — it now works without `?org=`

## Capabilities

### New Capabilities
- `client-self-registration`: Open client portal registration with org selection via autocomplete, optional birth date collection, and auto-login on success

### Modified Capabilities
- (none)

## Impact

- `src/app/(client-portal)/layout.tsx` — add `/portal/register` as public route exception
- `src/app/(client-portal)/portal/register/page.tsx` — add OrgAutocomplete, remove `?org=` requirement, add birth date field
- `src/actions/client-registration.ts` — extend Zod schema with optional `birthDate`, pass to Prisma create
- `prisma/schema.prisma` — add `birthDate` (DateTime?) to both `User` and `Client` models
- `pnpm db:migrate` — generate migration for new column
- No API route changes needed (existing `GET /api/v1/auth/orgs/lookup` and `POST /api/v1/auth/client-register` handle the flow)
