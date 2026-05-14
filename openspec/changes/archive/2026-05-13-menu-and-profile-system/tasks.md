## 1. Schema & Data Layer

- [x] 1.1 Add `notificationPreferences Json @default("{}") @map("notification_preferences")` field to User model in `prisma/schema.prisma`
- [x] 1.2 Run `pnpm db:migrate` to apply the new migration

## 2. Backend: Server Actions

- [x] 2.1 Add `email` param to `updateUserProfile()` in `src/actions/auth.ts` — include email in the update and validate uniqueness before saving
- [x] 2.2 Create `changePassword(userId, { currentPassword, newPassword })` server action in `src/actions/auth.ts` — bcrypt.compare current, bcrypt.hash new, update user
- [x] 2.3 Create `updateNotificationPreferences(userId, preferences)` server action in `src/actions/settings.ts` — saves JSON object to `User.notificationPreferences`
- [x] 2.4 Create `updateClientPortalProfile(userId, clientId, data)` server action that calls BOTH `updateUserProfile` and `updateClient` in sequence, with graceful fallback if no Client record exists

## 3. Backend: Avatar Upload API

- [x] 3.1 Create `POST /api/upload/avatar` route — validate file type (png/jpg/webp), size (max 2MB), save to `/app/uploads/avatars/` with unique filename (`u_<userId>_<timestamp>.<ext>`), update `User.avatar`
- [x] 3.2 Create `GET /api/files/avatars/[filename]` route — read file from disk, serve with proper Content-Type and Cache-Control headers, return 404 if not found
- [x] 3.3 Create `/app/uploads/avatars/` directory and ensure it's writable (add `.gitkeep`)

## 4. Infrastructure: Docker

- [x] 4.1 Add `uploads_data:/app/uploads` volume to `docker-compose.dev.yml` app service
- [x] 4.2 Add `uploads_data:` volume declaration at bottom of `docker-compose.dev.yml`

## 5. Frontend: Client Portal Profile Fixes

- [x] 5.1 Replace `onSaveProfile` in `/portal/profile/page.tsx` — call `updateClientPortalProfile` instead of `updateClient`, update both User and Client
- [x] 5.2 Connect `onChangePassword` in `/portal/profile/page.tsx` — call `changePassword` server action, show success/error toast
- [x] 5.3 Connect notification "Save Preferences" button — call `updateNotificationPreferences` action with current toggle states
- [x] 5.4 Load saved notification preferences on mount — read from `currentUser` (user object in auth context) and initialize toggle states

## 6. Frontend: Internal Profile Page

- [x] 6.1 Create `src/app/(dashboard)/settings/profile/page.tsx` with personal info form (firstName, lastName, email, phone), avatar preview, change password section, and danger zone
- [x] 6.2 Connect personal info form to `updateUserProfile` server action
- [x] 6.3 Connect password change form to `changePassword` server action
- [x] 6.4 Add avatar upload UI: file input → preview → upload via `/api/upload/avatar` → update avatar display
- [x] 6.5 Add "Profile" entry at top of Settings sidebar nav in `settings/layout.tsx`
- [x] 6.6 Fix header dropdown: Profile → `/settings/profile`, Settings → `/settings` (keep as-is)

## 7. Frontend: Navigation System

- [x] 7.1 Create `src/lib/navigation.ts` with complete `NAV_CONFIG` — all sidebar, portal, and settings items with `context`, `requiredRole`, and `badge` fields
- [x] 7.2 Create `useFilteredNav(role, context?)` hook that filters `NAV_CONFIG` by role permissions and context tag, with empty section pruning
- [x] 7.3 Create `SidebarNav` component that accepts `NavSection[]` and renders styled links with badges, collapsed-state tooltip support, and active route highlighting
- [x] 7.4 Refactor `sidebar.tsx` to consume `useFilteredNav` + `SidebarNav` — keep shell (logo, collapse toggle, user section, logout) but replace hardcoded nav sections
- [x] 7.5 Refactor Client Portal `layout.tsx` nav to consume `useFilteredNav(userRole, 'portal')`
- [x] 7.6 Refactor Settings `layout.tsx` nav to consume `useFilteredNav(userRole, 'settings')`

## 8. Frontend: Avatar Display Integration

- [x] 8.1 Update `sidebar.tsx` avatar to show `AvatarImage` when `User.avatar` is set, fallback to `AvatarFallback` with initials
- [x] 8.2 Update `header.tsx` avatar dropdown to show `AvatarImage` when `User.avatar` is set
- [x] 8.3 Update all avatar instances across the app (client-card, lead-card, kanban, client detail) to support image avatars where user data is available

## 9. Validation & Polish

- [x] 9.1 Run `pnpm exec tsc --noEmit` — fix any type errors
- [x] 9.2 Run `pnpm lint` — fix lint issues
- [x] 9.3 Run `pnpm build` — verify production build passes
- [x] 9.4 Smoke test: login as admin@apexbusiness.com, verify sidebar renders correctly, navigate to new profile page, edit and save profile
- [x] 9.5 Smoke test: login as client@example.com, navigate to `/portal/profile`, edit name, verify name updates in header, change password, save notification preferences
- [x] 9.6 Smoke test: verify Settings sidebar shows Profile at top, verify header dropdown Profile goes to `/settings/profile`, Settings goes to `/settings`
