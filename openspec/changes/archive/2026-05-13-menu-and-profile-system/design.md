## Context

The CRM has two user-facing contexts (internal dashboard and client portal) with independent navigation and profile systems. Currently:

- **Navigation**: Hardcoded in 4 separate files (`sidebar.tsx`, `header.tsx`, portal `layout.tsx`, settings `layout.tsx`). Adding a route requires editing multiple files. No role-based filtering. No central source of truth.
- **Profile**: Internal users have NO profile page. Client portal profile page exists but saves to the wrong entity (`Client` instead of `User`) and password change is a no-op.
- **Avatar**: `User.avatar` field exists in schema but is never written. `AvatarImage` component exists but is never used — only `AvatarFallback` with initials.
- **Notifications**: 3 toggle switches with no persistence mechanism.
- **Infrastructure**: App runs inside Docker; no volume for uploads.

## Goals / Non-Goals

**Goals:**
- Single source of truth for all navigation items with role-based filtering
- Internal profile page at `/settings/profile` for employees/admins
- Client portal profile that correctly updates BOTH User and Client records
- Real password change server action (not placebo)
- Avatar upload flow with persistent storage via Docker volume
- Notification preferences persisted in User JSON field
- All changes backward-compatible (no breaking UI changes)

**Non-Goals:**
- Real-time notification delivery (email/SMS sending infrastructure) — this only persists user preferences
- External file storage (S3/R2) — using local disk with API route serving
- Multi-tenant file isolation — avatar uploads are per-user but stored in flat structure
- Dynamic nav item registration from plugins/modules — config is compile-time

## Decisions

### 1. Navigation Architecture: Centralized Config with Context Tags

**Chosen**: Single `src/lib/navigation.ts` exporting `NAV_CONFIG` with `context` field for scoping.

**Structure:**
```typescript
// src/lib/navigation.ts
export type NavContext = 'dashboard' | 'portal' | 'settings'

export interface NavItem {
  title: string
  href: string
  icon?: string
  badge?: string           // query key for dynamic badge
  requiredRole?: UserRole[]
  context?: NavContext[]   // which layouts show this item
  children?: NavItem[]
}

export interface NavSection {
  title?: string
  items: NavItem[]
}
```

**Why context over separate arrays**: Single source of truth. One array to rule them all. Layouts filter by context + role. Adding a route = one entry.

**Alternatives considered:**
- Separate arrays per layout: simpler but duplicates data, drifts over time
- File-system based routing detection: too magical, no role filtering at config level

### 2. Profile Save Strategy: Dual Write (User + Client)

**Chosen**: When client portal user saves profile, call BOTH `updateUserProfile()` and `updateClient()` within the same action.

**Data flow:**
```
onSaveProfile(data)
  → Server action: updateClientPortalProfile(currentUser.id, data)
    → prisma.user.update({ where: { id: userId }, data: { firstName, lastName, email, phone } })
    → prisma.client.update({ where: { id: clientId }, data: { firstName, lastName, email, phone } })
    → Return updated user (without passwordHash)
```

**Why dual write**: The `User` record drives auth-context (header, sidebar initials). The `Client` record drives business operations (assignee, tags, notes). They were never linked by FK — only by email match in frontend code. Dual write keeps them in sync without schema migration.

### 3. Avatar Storage: Local Disk + API Route

**Chosen**: Files saved to `/app/uploads/avatars/` via `POST /api/upload`, served via `GET /api/files/avatars/[filename]`.

**Why not /public**: Files outside `/public` are not directly accessible, giving us control over access control, content-type headers, and future migration to S3.

**Why not base64**: Bloats the User row, no CDN possible, larger payloads.

**Docker volume**: `uploads_data:/app/uploads` added to `docker-compose.dev.yml`. Directory created at container start if missing.

### 4. Notification Preferences: JSON Field on User

**Chosen**: `notificationPreferences Json @default("{}") @map("notification_preferences")`

**Schema**: Non-destructive migration. Existing users get empty object. Frontend treats missing keys as defaults (all true).

### 5. Password Change: Server Action

**Chosen**: New action `changePassword(userId, { currentPassword, newPassword })` in `src/actions/auth.ts`.

**Flow:**
1. Lookup user by ID
2. `bcrypt.compare(currentPassword, user.passwordHash)` — fail if mismatch
3. `bcrypt.hash(newPassword, 12)` — hash new password
4. `prisma.user.update({ where: { id }, data: { passwordHash } })`
5. Return success

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Dual write breaks if Client doesn't exist** | Must handle case where client portal user has no Client record — skip client update gracefully |
| **Email unique constraint violation on User** | Validate email uniqueness before update; return clear error |
| **Docker volume for uploads not created** | Add `mkdir -p` on startup or let Docker create it; document in dev setup |
| **Nav config refactor touches 4+ components simultaneously** | Phase it: (1) create config + hook, (2) refactor sidebar, (3) refactor portal nav, (4) refactor settings nav |
| **Avatar upload without size/type validation** | Add validation in API route: max 2MB, only png/jpg/webp |
| **notificationPreferences JSON schema evolves** | Use empty object default; frontend code handles missing keys gracefully |

## Open Questions

- Should avatar filenames include user ID prefix for easier cleanup? (e.g., `u_<userId>_<timestamp>.jpg`)
- Should the `data-driven-navigation` include a `badge` query mechanism (e.g., `'leads:unread'` key that a hook resolves)? Or keep badges out of scope initially?
