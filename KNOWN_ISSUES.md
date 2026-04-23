# ApexCRM — Known Issues & Features To Fix

> Generated: 2026-04-23  
> Last updated: 2026-04-23 (17 of 23 issues resolved)  
> App running at http://localhost:3001  
> Credentials: `admin@apexbusiness.com` / `Password123!`

---

## ✅ Resolved Issues

### ~~1. All `/api/v1/*` routes are unauthenticated~~ — FIXED
All API routes now call `withSessionOrApiAuth(request)` and return 401 if unauthenticated. Bearer API key auth is also supported.

### ~~2. `/api/v1/auth/me` accepts arbitrary user ID~~ — FIXED
`/auth/me` now reads the session cookie only; arbitrary ID parameters are ignored.

### ~~3. Session stored in `localStorage` (XSS-exploitable)~~ — FIXED
Session is now stored in an HTTP-only `crm_session` cookie set by the server. `auth-context.tsx` has been rewritten to call `getCurrentUser()` (no arguments) on mount.

### ~~4. New team members saved with plaintext password `'changeme'`~~ — FIXED
`inviteTeamMember` now generates a cryptographically random temporary password and stores it hashed with bcrypt.

### ~~5. API responses expose `passwordHash` and `magicLinkToken`~~ — FIXED
Prisma `select` clauses in clients, leads, and appointments routes now exclude `passwordHash` and `magicLinkToken` from all nested user objects.

### ~~8. Settings — General: hardcoded org ID~~ — FIXED
`getOrganization` and `updateOrganization` now use `currentUser.organizationId` from the auth context.

### ~~10. Settings — Team: invite uses hardcoded `organizationId: 'org_1'`~~ — FIXED
Invite now uses `currentUser.organizationId`.

### ~~11. Settings — Locations: hardcoded `org_1`~~ — FIXED
New locations use `currentUser.organizationId`.

### ~~12. Settings — Services: hardcoded `organizationId: 'org_1'`~~ — FIXED
New services use `currentUser.organizationId`.

### ~~13. Settings — Webhooks: hardcoded `organizationId: 'org_1'`~~ — FIXED
New webhooks use `currentUser.organizationId`.

### ~~15. Dashboard trend percentages are hardcoded constants~~ — FIXED
Trends are now computed from real current-month vs. previous-month DB counts.

### ~~16. Lead form default `organizationId` is `'org_1'`~~ — FIXED
Falls back to `currentUser.organizationId ?? ''`.

### ~~17. Client form default `organizationId` is `'org_1'`~~ — FIXED
Falls back to `currentUser.organizationId ?? ''`.

### ~~18. Booking flow hardcodes `organizationId: 'org_1'`~~ — FIXED
Uses `currentUser.organizationId ?? ''`.

### ~~19. Form builder defaults to `organizationId: 'org_1'`~~ — FIXED
Falls back to `currentUser.organizationId ?? ''`.

### ~~20. Forms list page creates forms with `organizationId: 'org_1'`~~ — FIXED
Uses `currentUser.organizationId ?? ''`.

### ~~23. Public form page loads entire CRM dataset via `useCRM()`~~ — FIXED
Public form page now fetches only form data via `/api/v1/public/forms/[id]`. A dedicated `/api/v1/public/forms/[id]/submit` endpoint handles form submissions without exposing CRM data.

---

## 🟠 High — Broken Features (Remaining)

### 6. Magic link login is a fake `setTimeout` stub — no email is sent
**File:** `src/app/(auth)/login/page.tsx` lines 75–82  
**Issue:**
```ts
await new Promise((resolve) => setTimeout(resolve, 800));
toast.success('Magic link sent! Check your inbox.');
```
No email is sent. No API is called. It always "succeeds" silently.  
**Fix:** Call a real API endpoint that generates a `magicLinkToken`, stores it with an expiry in the DB, and emails the link to the user. Requires an email service (e.g. Resend, SendGrid).

---

### 7. Settings — General: timezone, dateFormat, currency only saved to `localStorage`
**File:** `src/app/(dashboard)/settings/page.tsx` lines 81–84, 91  
**Issue:** Settings are loaded from and saved to `localStorage`. Only `orgName` is written to the DB. All other preferences are lost on a different browser/device.  
**Fix:** Add `timezone`, `dateFormat`, and `currency` columns to the `Organization` model and persist all fields via `updateOrganization`. Requires a Prisma migration.

---

### 9. Settings — Team: working hours saved to `localStorage` only
**File:** `src/app/(dashboard)/settings/team/page.tsx` lines 74–107  
**Issue:** `HOURS_KEY`, `loadHours()`, `saveHours()` all use `localStorage`. Working hours never reach the database.  
**Fix:** Persist working hours in the DB via a server action. Requires a Prisma migration to add a working hours model.

---

### 14. Team invite has no invitation flow — new user has no way to log in
**File:** `src/app/(dashboard)/settings/team/page.tsx` lines 280–292  
**Issue:** `handleInvite()` creates the user with a bcrypt-hashed random password (fixed in #4), but the new user has no way to receive or use that password — no invitation email is sent.  
**Fix:** Send an invitation email with a time-limited token; new user completes registration via the link. Requires an email service (see #6).

---

## 🟡 Medium — Client Portal & Other (Remaining)

### 21. Client portal loads the entire CRM dataset (all clients, leads, etc.)
**File:** `src/app/(client-portal)/portal/dashboard/page.tsx` line 36  
**Issue:** `useCRM()` loads all 10 CRM collections into the portal. A portal end-client can inspect all other clients' data from the browser network tab.  
**Fix:** Create client-scoped API endpoints; portal should only fetch the authenticated client's own records.

---

### 22. Appointment cancellation has no ownership check
**File:** `src/app/(client-portal)/portal/appointments/page.tsx` lines 74–78  
**Issue:** `handleCancel` calls `updateAppointment(apptId, { status: 'cancelled' })` with no server-side verification that the appointment belongs to the current portal client.  
**Fix:** Add an ownership check in the PATCH handler before allowing status changes.

---

## Summary

| Status | Count | Category |
|--------|-------|----------|
| ✅ Fixed | 17 | Security, org IDs, dashboard trends, public form |
| 🟠 Remaining — High | 4 | Magic link email, localStorage settings, team invite flow |
| 🟡 Remaining — Medium | 2 | Client portal data scope, appointment ownership |
| **Total** | **23** | |
