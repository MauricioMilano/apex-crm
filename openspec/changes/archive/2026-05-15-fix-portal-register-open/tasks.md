## 1. Prisma — Add birthDate to Schema

- [x] 1.1 Add `birthDate DateTime?` to `User` model in `prisma/schema.prisma`
- [x] 1.2 Add `birthDate DateTime?` to `Client` model in `prisma/schema.prisma`
- [x] 1.3 Run `pnpm db:migrate` to generate migration for the new column

## 2. Server Action — Extend client-registration Schema

- [x] 2.1 Update `src/actions/client-registration.ts` — add `birthDate: z.string().optional()` to Zod schema
- [x] 2.2 Pass `birthDate` (converted to `Date` or `undefined`) to both `prisma.user.create` and `prisma.client.create`

## 3. Layout — Make Register Route Public

- [x] 3.1 Update `src/app/(client-portal)/layout.tsx` — change `isLoginPage` to `isPublicPage` array checking both `/portal/login` and `/portal/register`

## 4. Register Page — Rework with Org Autocomplete

- [x] 4.1 Update `src/app/(client-portal)/portal/register/page.tsx` — replace `?org=` URL requirement with `OrgAutocomplete` component (import from `@/components/org-autocomplete`)
- [x] 4.2 Add `orgSlug` field to `registerSchema` with `.min(1, 'Please select your organization')` validation
- [x] 4.3 Add optional birth date field using `<input type="date">` to the form
- [x] 4.4 Update `onSubmit` to send `orgSlug` (from form state, not URL) + `birthDate` to the API
- [x] 4.5 Remove the "Invalid Link" fallback UI (no longer needed — org selection is in the form)
- [x] 4.6 Pass `?org=` from URL params as initial value for the autocomplete if present (backward compat)
