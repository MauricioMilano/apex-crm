## Why

The CRM has two disconnected navigation systems (sidebar + top nav) and two profile contexts (internal users and client portal users), both with significant gaps: internal users have no profile page, client portal profile saves to the wrong entity, password change is a placebo, notification preferences persist nowhere, and all navigation is hardcoded in four separate arrays with no role-based filtering. This creates a fragmented UX and makes every new route require changes in multiple files.

## What Changes

- **Client Portal Profile**: Fix `onSaveProfile` to update BOTH `User` and `Client` records. Replace placebo password change with real server action. Make notification preferences persist.
- **Internal Profile Page**: Add `/settings/profile` route for employees/admins to edit name, email, phone, avatar, and password.
- **Avatar Upload**: Create `/api/upload` endpoint and `/api/files/*` serving route. Add Docker volume for persistence.
- **Navigation System**: Create single source of truth (`src/lib/navigation.ts`) with `NavItem[]` supporting `requiredRole` role-based filtering and `context` tags for dashboard vs portal views. Refactor sidebar, header dropdown, client portal nav, and settings sidebar to consume it.
- **Schema**: Add `notificationPreferences Json` field to User model (non-destructive migration).

## Capabilities

### New Capabilities
- `client-profile`: Fix Client Portal profile page — correct save target (User + Client), real password change, persisted notification preferences
- `internal-profile`: New profile page at `/settings/profile` for internal users with personal data editing, avatar, and password change
- `avatar-upload`: API-first avatar upload with local file storage, served via dedicated API route
- `data-driven-navigation`: Centralized navigation config with role-based filtering and multi-context support

### Modified Capabilities

*(No existing capabilities are being modified — all capabilities are new)*

## Impact

- **Schema**: `prisma/schema.prisma` — add `notificationPreferences Json` to User model (non-destructive)
- **Backend**: New server actions (`changePassword`), new API routes (`/api/upload`, `/api/files/*`), updated `updateUserProfile` to accept email
- **Frontend**: New page at `/app/(dashboard)/settings/profile/`, updated `/app/(client-portal)/portal/profile/`, refactored Sidebar, Header, Client Portal layout, Settings layout
- **Infrastructure**: Docker volume `uploads_data:/app/uploads` in `docker-compose.dev.yml`
- **Types**: Unify `NavItem`/`NavSection` types (already exist in `src/types/index.ts`)
- **New file**: `src/lib/navigation.ts`
