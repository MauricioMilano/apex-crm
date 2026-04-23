# ApexCRM — Known Issues & Features To Fix

> Generated: 2026-04-23  
> App running at http://localhost:3001  
> Credentials: `admin@apexbusiness.com` / `Password123!`

---

## 🔴 Critical — Security

### 1. All `/api/v1/*` routes are unauthenticated
**Files:** All files under `src/app/api/v1/*/route.ts`  
**Issue:** Every API route (clients, leads, appointments, users, forms, services, webhooks, api-keys, locations, lead-statuses) has **no authentication check**. `withApiAuth()` exists in `src/lib/api-helpers.ts` but is never called.  
**Impact:** Anyone can read, create, update, and delete all CRM data without credentials.  
**Fix:** Call `withApiAuth(request)` in each route handler and return 401 if unauthenticated.

---

### 2. `/api/v1/auth/me` accepts user ID in query string — no session check
**File:** `src/app/api/v1/auth/me/route.ts` line 7–8  
**Issue:** `const id = request.nextUrl.searchParams.get('id')` — any unauthenticated caller can fetch any user's profile by supplying an arbitrary user ID.  
**Fix:** Use a signed session cookie; do not accept an arbitrary ID from the client.

---

### 3. Session stored in `localStorage` (XSS-exploitable)
**File:** `src/contexts/auth-context.tsx` line 58  
**Issue:** `crm_session_user_id` stored in `localStorage`. An XSS attack would steal session IDs.  
**Fix:** Use an HTTP-only cookie with a server-set session token.

---

### 4. New team members saved with plaintext stub password `'changeme'`
**File:** `src/app/(dashboard)/settings/team/page.tsx` line 290  
**Issue:** `passwordHash: 'changeme'` is written directly to the `passwordHash` DB field without hashing.  
**Fix:** Generate a bcrypt-hashed temporary password or use a proper invite-flow (see #14).

---

### 5. API responses expose `passwordHash` and `magicLinkToken`
**Files:** `src/app/api/v1/clients/route.ts`, `src/app/api/v1/leads/route.ts`, `src/app/api/v1/appointments/route.ts`  
**Issue:** Responses that include nested `assignee` objects return the full user record including `passwordHash` and `magicLinkToken`.  
**Fix:** Select only safe user fields (`id`, `firstName`, `lastName`, `email`, `role`) in Prisma queries using `select` or strip sensitive fields before returning.

---

## 🟠 High — Broken Features

### 6. Magic link login is a fake `setTimeout` stub — no email is sent
**File:** `src/app/(auth)/login/page.tsx` lines 75–82  
**Issue:**
```ts
await new Promise((resolve) => setTimeout(resolve, 800));
toast.success('Magic link sent! Check your inbox.');
```
No email is sent. No API is called. It always "succeeds" silently.  
**Fix:** Call a real API endpoint that generates a `magicLinkToken`, stores it with an expiry in the DB, and emails the link to the user.

---

### 7. Settings — General: timezone, dateFormat, currency only saved to `localStorage`
**File:** `src/app/(dashboard)/settings/page.tsx` lines 81–84, 91  
**Issue:** Settings are loaded from and saved to `localStorage`. Only `orgName` is written to the DB. All other preferences are lost on a different browser/device.  
**Fix:** Add `timezone`, `dateFormat`, and `currency` columns to the `Organization` model and persist all fields via `updateOrganization`.

---

### 8. Settings — General: hardcoded org ID `'org_apex_business_solutions'`
**File:** `src/app/(dashboard)/settings/page.tsx` lines 87, 93  
**Issue:** `getOrganization('org_apex_business_solutions')` is hardcoded. Any user registered under a different org will silently fail to load or save settings.  
**Fix:** Read the org ID from the authenticated user's session/context.

---

### 9. Settings — Team: working hours saved to `localStorage` only
**File:** `src/app/(dashboard)/settings/team/page.tsx` lines 74–107  
**Issue:** `HOURS_KEY`, `loadHours()`, `saveHours()` all use `localStorage`. Working hours never reach the database.  
**Fix:** Persist working hours in the DB via a server action.

---

### 10. Settings — Team: invite uses hardcoded `organizationId: 'org_1'`
**File:** `src/app/(dashboard)/settings/team/page.tsx` lines 283, 290  
**Issue:** New team members are assigned to `'org_1'` — a nonexistent organization in the seeded DB — and get the stub password `'changeme'` (see #4).  
**Fix:** Use the current user's real `organizationId`.

---

### 11. Settings — Locations: default location stored in `localStorage`; hardcoded `org_1`
**File:** `src/app/(dashboard)/settings/locations/page.tsx` lines 74–79, 117  
**Issue:** The "default" location preference is browser-local. New locations are created with `organizationId: 'org_1'`.  
**Fix:** Add `isDefault` to the `Location` DB model; use real org ID when creating.

---

### 12. Settings — Services: hardcoded `organizationId: 'org_1'`
**File:** `src/app/(dashboard)/settings/services/page.tsx` line 96  
**Issue:** New services are created with `organizationId: 'org_1'` instead of the current user's org.  
**Fix:** Use the current user's real `organizationId`.

---

### 13. Settings — Webhooks: hardcoded `organizationId: 'org_1'`
**File:** `src/app/(dashboard)/settings/webhooks/page.tsx` line 133  
**Issue:** New webhooks are created with `organizationId: 'org_1'`.  
**Fix:** Use the current user's real `organizationId`.

---

### 14. Team invite has no invitation flow — new user has no way to log in
**File:** `src/app/(dashboard)/settings/team/page.tsx` lines 280–292  
**Issue:** `handleInvite()` calls `addUser()` directly with a stub password and no email. The created user has no way to authenticate.  
**Fix:** Send an invitation email with a time-limited token; new user completes registration via the link.

---

## 🟡 Medium — Data Integrity / Incorrect Behavior

### 15. Dashboard trend percentages are hardcoded constants
**File:** `src/app/(dashboard)/page.tsx` lines 68–70  
**Issue:**
```ts
const leadTrend = totalLeads > 0 ? 12.5 : 0;    // always 12.5%
const clientTrend = activeClients > 0 ? 8.3 : 0; // always 8.3%
const revenueTrend = monthlyRevenue > 0 ? 15.2 : 0; // always 15.2%
```
These are permanent placeholders that never reflect real growth.  
**Fix:** Query previous month's counts and compute real percentage deltas.

---

### 16. Lead form default `organizationId` is `'org_1'`
**File:** `src/components/leads/lead-form.tsx` line 62  
**Issue:** Default prop `organizationId = 'org_1'`. Leads created without an explicit org ID go to the wrong org.  
**Fix:** Require `organizationId` prop from the authenticated user's context.

---

### 17. Client form default `organizationId` is `'org_1'`
**File:** `src/components/clients/client-form.tsx` line 54  
**Issue:** Same as #16 for clients.  
**Fix:** Require `organizationId` prop from the authenticated user's context.

---

### 18. Booking flow hardcodes `organizationId: 'org_1'`
**File:** `src/components/appointments/booking-flow.tsx` line 112  
**Issue:** New appointments created through the booking flow are assigned to `'org_1'`.  
**Fix:** Pass real org ID from context.

---

### 19. Form builder defaults to `organizationId: 'org_1'`
**File:** `src/components/forms/form-builder.tsx` lines 162, 184  
**Issue:** `organizationId: existingForm?.organizationId ?? 'org_1'` — new forms fall back to wrong org.  
**Fix:** Use real org ID from context as the fallback.

---

### 20. Forms list page creates forms with `organizationId: 'org_1'`
**File:** `src/app/(dashboard)/forms/page.tsx` line 60  
**Issue:** Same pattern as #19 at the page level.  
**Fix:** Use real org ID from context.

---

## 🟡 Medium — Client Portal

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

## 🟡 Medium — Public Form Page

### 23. Public form page loads entire CRM dataset via `useCRM()`
**File:** `src/app/f/[formId]/page.tsx`  
**Issue:** The public-facing form page (accessible without any login) calls `useCRM()`, which fetches all clients, leads, appointments, users, etc. This exposes sensitive CRM data to any public visitor who lands on a form URL.  
**Fix:** Replace with a single dedicated public API endpoint `/api/v1/public/forms/[id]` that returns only the form fields needed to render the form. Form submission should POST to a separate `/api/v1/public/forms/[id]/submit` endpoint.

---

## Summary

| Priority | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 5 | Security vulnerabilities |
| 🟠 High | 9 | Broken features (stubs, localStorage, wrong org IDs) |
| 🟡 Medium | 9 | Data integrity / portal / public form issues |
| **Total** | **23** | |
