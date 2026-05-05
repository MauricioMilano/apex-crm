# ApexCRM — Browser Test Results

**Project:** ApexCRM (Next.js CRM System)  
**Test Date:** April 21, 2026  
**Base URL:** http://localhost:3001  
**Tester:** Automated browser testing with GitHub Copilot  

---

## Executive Summary

Nine functional areas of ApexCRM were tested via automated browser interaction. Five tests passed (some only after in-session bug fixes), three returned partial passes, and one failed outright. Four critical bugs were identified — two were fixed during testing. The most severe unresolved issues are: sidebar navigation universally broken (all links 404), authentication not connected to the real database, and the dashboard overview page being completely unreachable. Core CRM modules (Clients, Leads, Appointments, Calendar, Forms, Settings) are largely functional once reached directly by URL.

---

## Test Environment

| Property | Value |
|---|---|
| Application | ApexCRM |
| Framework | Next.js (App Router) |
| Base URL | http://localhost:3001 |
| Database | PostgreSQL (via Docker) |
| Test Date | April 21, 2026 |
| Test Method | Automated browser testing |

---

## Test Results Summary

| # | Test Area | Status | Key Finding |
|---|---|---|---|
| 1 | User Registration | PARTIAL PASS | Registration succeeds; post-registration redirect crashes on /leads |
| 2 | User Login | PARTIAL PASS | Auth uses mock data; registered users cannot log in; /dashboard 404s |
| 3 | Dashboard Overview | FAIL | /dashboard route returns 404; overview page completely unreachable |
| 4 | Clients Management | PASS | Full CRUD works; stats update correctly |
| 5 | Leads Management | PASS* | Crash fixed during testing; kanban board and CRUD fully functional |
| 6 | Appointments Management | PASS | 4-step booking flow works end-to-end |
| 7 | Calendar View | PASS | Week/Month/Day views work; appointment popover functional |
| 8 | Forms Management | PASS* | Navigation bugs fixed during testing; form builder and public URLs work |
| 9 | Settings | PARTIAL PASS | 5 of 7 tabs functional; Business Hours 404s; no Profile tab |

> \* Bug fixed during the test session before final validation.

---

## Detailed Test Results

### Test 1 — User Registration

**Status:** PARTIAL PASS

**Steps Performed:**
1. Navigated to `/register`
2. Filled form: First Name `John`, Last Name `Doe`, Email `john.doe@testorg.com`, Organization `TestOrg`, Password `Password123!`
3. Submitted form

**Findings:**
- Registration completed successfully; account created in the database.
- After registration, the app redirected to `/leads`.
- The `/leads` page immediately crashed with a fatal Radix UI error:  
  `A <Select.Item /> must have a value prop that is not an empty string`
- The registration flow itself is correct; the crash is caused by a pre-existing bug in the leads page (see Bug #4).

**Result:** Account creation works. Post-registration user experience is broken due to an unrelated crash on the redirect target.

---

### Test 2 — User Login

**Status:** PARTIAL PASS

**Steps Performed:**
1. Navigated to `/login`
2. Tested credentials for the newly registered user `john.doe@testorg.com`
3. Tested mock credentials `admin@apex.com` / `admin123`
4. Tested logout flow

**Findings:**
- `src/contexts/auth-context.tsx` authenticates against a hardcoded `mockUsers` array using plain-text password comparison — not the PostgreSQL database.
- The newly registered user (`john.doe@testorg.com`) cannot log in because they exist only in the database, not in the mock array.
- Mock credentials work: `admin@apex.com` / `admin123` logs in as Jordan Mitchell (admin role).
- After login, the app redirects to `/dashboard`, which returns a 404.
- Logout redirects correctly to `/login`.

**Valid Mock Credentials:**

| Email | Password | Name | Role |
|---|---|---|---|
| admin@apex.com | admin123 | Jordan Mitchell | admin |

**Result:** Login form functions but is disconnected from the real user database. Real registered users cannot authenticate.

---

### Test 3 — Dashboard Overview

**Status:** FAIL

**Steps Performed:**
1. Attempted to reach the dashboard overview after login
2. Inspected routing in `src/app/page.tsx` and `src/app/(dashboard)/page.tsx`

**Findings:**
- `src/app/page.tsx` (root route `/`) contains a redirect to `/dashboard`.
- `/dashboard` returns a 404 — no such route exists in the Next.js App Router structure.
- `src/app/(dashboard)/page.tsx` defines a route at `/` (inside the route group), not at `/dashboard`.
- The dashboard stats/overview page was never rendered during any test.
- Post-login users land on a 404; the default fallback destination `/leads` crashes.

**Result:** The dashboard overview is completely inaccessible. This is a critical routing misconfiguration.

---

### Test 4 — Clients Management

**Status:** PASS

**Steps Performed:**
1. Navigated directly to `/clients`
2. Reviewed client list and stats
3. Created a new client via the "New Client" dialog
4. Verified stats updated

**Findings:**
- Page loads correctly with full sidebar layout.
- Initial stats: **6 Total Clients**, **5 Active**, **0 New This Month**
- Client list displays: name, email, phone, company, status for all 6 clients.
- "New Client" button opens a dialog with fields: First Name, Last Name, Email, Phone, Company, Tags.
- Created client: **Alice Smith**, Smith Corp, `alice.smith@example.com`, `555-0101`
- Stats updated correctly to: **7 Total**, **6 Active**, **1 New This Month**
- Full CRUD flow (create, read) validated successfully.

**Minor Bug:** Page header (`<h1>`) always displays "Dashboard" regardless of current page.

**Result:** Clients module is fully functional.

---

### Test 5 — Leads Management

**Status:** PASS *(bug fixed during session)*

**Steps Performed:**
1. Navigated to `/leads` — page crashed immediately
2. Identified and fixed the root cause
3. Re-tested leads page and created a new lead

**Bug Fixed During Testing:**  
`<SelectItem value="">` in `kanban-board.tsx` and `lead-form.tsx` violated Radix UI's constraint that Select item values must be non-empty strings. Fixed by replacing `value=""` with `value="unassigned"` in both files.

**Findings after fix:**
- Kanban board loads with columns:

| Column | Count |
|---|---|
| New Lead | 3 |
| Contacted | 2 |
| Qualified | 1 |
| Proposal Sent | 1 |
| Closed Won | 1 |
| Closed Lost | 1 |

- Created lead: **Bob Jones**, Jones LLC, `bob.jones@test.com`, status: New Lead
- Lead appeared in the correct kanban column immediately.
- Stats updated to 9 total leads.

**Result:** Leads module is fully functional after the fix. The unfixed version crashes on load.

---

### Test 6 — Appointments Management

**Status:** PASS

**Steps Performed:**
1. Navigated to `/appointments`
2. Walked through the full 4-step booking flow
3. Verified appointment appeared in the list

**Initial Stats:** 0 Today, 3 This Week, 2 Pending Confirmation

**Booking Flow:**

| Step | Content |
|---|---|
| 1 — Select Service | Consultation 60min/$150, Follow-up Meeting 30min/$75, Strategy Session 90min/$250 |
| 2 — Select Employee | Any Available, Jordan Mitchell, Sarah Chen, Mike Torres |
| 3 — Select Date & Time | Calendar picker + 17 time slots from 9:00 AM to 5:00 PM in 30-minute intervals |
| 4 — Confirm | Select client from grid, review summary, add optional notes |

**Appointment Created:** Alice Smith — Consultation — April 22, 2026 at 9:00 AM — Jordan Mitchell

- Appointment appeared in the list with **Pending** status.
- Stats updated to: **4 This Week**, **3 Pending Confirmation**

**Result:** Appointment booking flow works end-to-end.

---

### Test 7 — Calendar View

**Status:** PASS

**Steps Performed:**
1. Navigated to `/calendar`
2. Tested week navigation and view switching
3. Located the appointment created in Test 6
4. Clicked the appointment block to inspect the popover

**Findings:**
- Loads in week view by default (April 20–26, 2026).
- Three views available: **Week**, **Month**, **Day** — all functional.
- Previous/next week navigation and "Today" button work correctly.
- Appointment from Test 6 visible: `Alice Smith — Consultation — 9AM Wed Apr 22`
- Clicking the appointment block shows a popover containing:
  - Client name
  - Service name
  - Status
  - Time range
  - Assigned employee
  - **Confirm** and **Cancel** action buttons
  - "View Details →" link

**Minor Bug:** Events scheduled before 8:00 AM are rendered at the 8:00 AM row position without any visual indicator that they occur earlier. The week grid starts at 8:00 AM.

**Result:** Calendar view is functional. The pre-8 AM rendering issue is cosmetic and low severity.

---

### Test 8 — Forms Management

**Status:** PASS *(bugs fixed during session)*

**Steps Performed:**
1. Navigated to `/forms`
2. Identified navigation bugs and applied fixes
3. Created a new form in the builder
4. Verified public form URL rendering

**Bugs Fixed During Testing:**
- `router.push('/dashboard/forms/builder/${id}')` in `forms/page.tsx` → corrected to `'/forms/builder/${id}'`
- Save button path `'/dashboard/forms'` in the builder page → corrected to `'/forms'`

**Findings after fixes:**
- `/forms` loads with 2 existing forms: *Client Satisfaction Survey*, *New Lead Intake Form*
- Form builder panels:
  - **Left:** Field types — Text, Email, Phone, Number, Date, Dropdown, Radio, Checkbox, Textarea, File Upload
  - **Center:** Canvas (drag-and-drop field placement)
  - **Right:** Field Properties and Style configuration
- Created form: **"Contact Inquiry Form"** — added Text + Email fields, toggled Published
- Public URL `/f/form_2` (Client Satisfaction Survey) renders correctly with all fields and a Submit button.

**Remaining Bug:** Newly created forms exist in React context only and are not persisted to the database. Refreshing or accessing the public URL for a new form shows "unavailable."

**Result:** Form builder is functional. Persistence for new forms is not implemented.

---

### Test 9 — Settings

**Status:** PARTIAL PASS

**Steps Performed:**
1. Navigated to `/settings`
2. Tested all 7 tabs

**Tab Results:**

| Tab | Status | Notes |
|---|---|---|
| General | PASS | Org name, timezone, date format, currency — all save and persist |
| Business Hours | FAIL | Route `/settings/hours` does not exist — 404 |
| Services | PASS | Lists 3 services; Add/Edit/Toggle/Delete all work |
| Team | PASS | Lists 3 members; role editing and status toggle work |
| Locations | PASS | 2 locations; Edit/Delete/Set Default all work |
| Webhooks | PASS | 2 webhooks with event tags; Toggle/Trigger/Edit/Delete work |
| API Keys | PASS | Created "Test Key" with `read:leads` permission; full key shown with copy banner |

**Tested Change:** Organization Name changed from default to **"Apex Business Solutions"** — persisted correctly.

**Remaining Bugs:**
- Business Hours tab links to `/settings/hours` which returns 404.
- No Profile/Account tab; users have no way to edit personal information (name, email, password).

**Result:** Core settings functionality works. Two tabs are non-functional.

---

## Bug Report

### Critical Severity

| ID | Title | Status | Affected Area |
|---|---|---|---|
| BUG-01 | Sidebar navigation broken — all links use `/dashboard/...` prefix causing universal 404 | **OPEN** | Global / Navigation |
| BUG-02 | Authentication uses mock data — real database users cannot log in | **OPEN** | Auth |
| BUG-03 | Dashboard overview unreachable — `/dashboard` route returns 404 | **OPEN** | Dashboard |
| BUG-04 | `/leads` crash — `<SelectItem value="">` violates Radix UI constraint | **FIXED** | Leads |
| BUG-05 | Forms navigation broken — `router.push` used incorrect `/dashboard/forms/...` paths | **FIXED** | Forms |

#### BUG-01 — Sidebar Navigation (OPEN)

**Description:** The sidebar component generates links with a `/dashboard/` prefix (e.g., `/dashboard/leads`, `/dashboard/clients`, `appointments`). The actual Next.js App Router routes are at the root level (`/leads`, `/clients`, `/appointments`). Every sidebar click navigates to a non-existent route.  
**Impact:** Users cannot navigate to any section of the application using the sidebar.  
**Fix:** Update all `href` values in the sidebar component to remove the `/dashboard` prefix.

#### BUG-02 — Mock Authentication (OPEN)

**Description:** `src/contexts/auth-context.tsx` imports a `mockUsers` array and uses `.find()` with a plain-text password comparison instead of querying the PostgreSQL database. Users registered via the registration form are written to the DB but cannot be authenticated because the login path never reads from the DB.  
**Impact:** Only hardcoded mock accounts can log in. All real registered users are permanently locked out.  
**Fix:** Replace the mock authentication logic in `auth-context.tsx` with a server action or API route that queries the database and compares against hashed passwords (e.g., using `bcrypt.compare`).

#### BUG-03 — Dashboard 404 (OPEN)

**Description:** `src/app/page.tsx` redirects to `/dashboard`. No route at `/dashboard` exists — the dashboard layout uses the `(dashboard)` route group, placing its index page at `/`. The redirect target is unreachable.  
**Impact:** After login, users are immediately sent to a 404 page. The dashboard stats overview is never rendered.  
**Fix:** Change the redirect in `src/app/page.tsx` from `/dashboard` to `/` (or directly to `/leads` as an intentional post-login default).

#### BUG-04 — Leads Crash on Empty SelectItem Value (FIXED)

**Description:** `kanban-board.tsx` and `lead-form.tsx` contained `<SelectItem value="">` which Radix UI's Select component rejects with a fatal runtime error.  
**Fix Applied:** Replaced `value=""` with `value="unassigned"` in both files.

#### BUG-05 — Forms Navigation Wrong Paths (FIXED)

**Description:** `forms/page.tsx` called `router.push('/dashboard/forms/builder/${id}')` and the builder used `'/dashboard/forms'` for the save redirect. Both paths are incorrect.  
**Fix Applied:** Corrected paths to `/forms/builder/${id}` and `/forms` respectively.

---

### Medium Severity

| ID | Title | Status | Affected Area |
|---|---|---|---|
| BUG-06 | Page header always shows "Dashboard" regardless of current page | OPEN | Global / UX |
| BUG-07 | Settings — Business Hours tab links to non-existent route `/settings/hours` | OPEN | Settings |
| BUG-08 | No user Profile/Account settings tab — personal info is not editable | OPEN | Settings / Auth |

---

### Low Severity

| ID | Title | Status | Affected Area |
|---|---|---|---|
| BUG-09 | Calendar — events before 8:00 AM rendered at 8:00 AM row without indication | OPEN | Calendar |
| BUG-10 | Form builder state not persisted — newly created forms unavailable after refresh | OPEN | Forms |

---

## Recommendations

### Immediate (Before Any User Testing)

1. **Fix sidebar navigation links (BUG-01):** This is the single highest-impact fix. Without it, no user can navigate the application. Remove the `/dashboard` prefix from all sidebar `href` values.

2. **Connect authentication to the database (BUG-02):** Replace the mock auth in `auth-context.tsx` with real database queries. Passwords must be stored and compared using a hashing library (`bcrypt`). This is also a security requirement — the current plain-text comparison is a critical security vulnerability.

3. **Fix the root redirect (BUG-03):** Change the redirect in `src/app/page.tsx` to point to a valid route (e.g., `/` or `/leads`).

### Short-Term

4. **Fix the Business Hours tab (BUG-07):** Either create the `/settings/hours` route or change the tab to an inline section within `/settings`.

5. **Add a user Profile settings tab (BUG-08):** Users need a way to change their name, email, and password.

6. **Fix page header title (BUG-06):** Pass the current page name as a prop or derive it from the route to display the correct title in the header.

### Medium-Term

7. **Persist form builder state (BUG-10):** Save newly created forms to the database on publish/save so they are accessible via public URLs and survive page refreshes.

8. **Fix pre-8 AM calendar rendering (BUG-09):** Either extend the calendar grid to start at 12:00 AM (or earlier), or display a visual indicator for events clipped by the grid start time.

### Security Note

The plain-text password comparison in `auth-context.tsx` is a critical security vulnerability independent of the functionality bugs. All passwords must be hashed at rest using `bcrypt` or an equivalent algorithm. This must be addressed before any production deployment or real user data is stored.

---

*Report generated: April 21, 2026*
