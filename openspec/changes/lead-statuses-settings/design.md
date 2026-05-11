## Context

The `LeadStatus` model exists in Prisma with fields: `id`, `organizationId`, `name`, `color`, `order`, `isDefault`. API routes at `/api/v1/lead-statuses` and `/api/v1/lead-statuses/[id]` support full CRUD. The CRM context (`crm-context.tsx`) provides `leadStatuses[]`, `addLeadStatus`, `updateLeadStatus`, and `deleteLeadStatus` hooks. The leads page and kanban board already sort statuses by `.order asc`. There is no settings UI — users cannot manage statuses today.

The closest existing pattern is `settings/services/page.tsx`: a CRUD table with add/edit dialog and delete confirmation, using Shadcn/UI components and the CRM context hooks.

## Goals / Non-Goals

**Goals:**
- Provide a settings page to CRUD lead statuses
- Allow reordering via up/down arrow buttons (Option B — no new dependencies)
- Manage default status with radio-group semantics
- Display lead count per status to prevent accidental deletion of active pipelines
- Follow existing settings page patterns (dark theme, Shadcn/UI, `useCRM` context)

**Non-Goals:**
- Drag-and-drop reordering (deferred to a future enhancement)
- Color picker beyond the predefined Tailwind palette
- Bulk operations (import/export, clone)
- Archiving/deactivating statuses (only delete)
- Per-user or per-role visibility of statuses

## Decisions

### D1: Up/Down arrow buttons for reordering (Option B)
```
Row 1  ──  New Lead  ──  ↑  ↓
Row 2  ──  Contacted  ──  ↑  ↓
Row 3  ──  Proposal   ──  ↑  ↓
```
- **Rationale**: Zero new dependencies, simple server action, works on all browsers/devices
- **Alternative considered**: Native HTML drag-and-drop or `@dnd-kit`. Rejected because it adds ~50KB of dependency and significantly more implementation complexity for a settings page
- **Behavior**: Clicking ↑ swaps the row with the one above; clicking ↓ swaps with the one below. Each click calls a single server action that reorders two statuses

### D2: Color selection via palette, not hex input
- Use the same 10-color palette already referenced in `STATUS_COLOR_MAP` (blue, yellow, green, purple, emerald, red, orange, gray, pink, indigo)
- Each swatch displays the actual Tailwind color as a visual circle
- Store as the Tailwind color name (string) in the `color` field — consistent with `src/types/index.ts` comment ("Tailwind color token")
- This avoids the mismatch between the schema storing hex and the type describing a Tailwind token

### D3: Default status with radio-group behavior
- Only one status can be `isDefault = true` at a time
- Toggling a status as default sends `isDefault: true`; the backend unsets all others in the same organization
- If the deleted status was the default, the next lowest-order status becomes the new default

### D4: Follow `settings/services/page.tsx` pattern exactly
- Same component structure: page → table → add/edit dialog → delete AlertDialog
- Same styling: `bg-gray-900`, `border-gray-800`, `text-gray-100` dark theme tokens
- Same dialog pattern: `DialogContent` with `DialogFooter` containing Cancel + primary action
- Reuses `useCRM` hooks directly — no new API routes needed

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Deleting a status with existing leads | FK constraint (`ON DELETE RESTRICT`) prevents it at DB level; UI shows lead count to warn users |
| Deleting the only default status | Backend enforces at least one default; UI disables delete if count === 1 |
| Color mismatch between stored value and `STATUS_COLOR_MAP` | Validate color is one of the 10 known Tailwind tokens; reject unknown values |
| Reordering race condition (two users reordering simultaneously) | Low probability on a small team; can add optimistic concurrency later if needed |

## Migration Plan

No migration needed. The `LeadStatus` model and `order` field already exist. This change only adds a UI layer on top of existing infrastructure.

## Open Questions

1. Should we add a "cannot delete" warning message that explains leads reference this status?
2. Should the color palette include more options (e.g., teal, lime, violet) beyond the current 10?
3. Should we allow renaming the default "New Lead" / "Closed Won" seeded statuses?
