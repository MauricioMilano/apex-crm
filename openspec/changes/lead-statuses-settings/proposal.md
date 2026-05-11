## Why

The `LeadStatus` model already has full CRUD infrastructure (Prisma schema, API routes, CRM context hooks), but there is no user-facing settings page to manage lead statuses. Users cannot create, edit, delete, or reorder statuses — the pipeline stages are hardcoded or seeded. This blocks organizations from customizing their sales pipeline to match their actual workflow.

## What Changes

- Add a new **Lead Statuses** settings page at `/settings/lead-statuses`
- Add a navigation item in the settings sidebar linking to the new page
- Table view listing all lead statuses with: name, color swatch, default badge, lead count, order number
- **Add** dialog: name input, color palette picker, "Set as default" toggle
- **Edit** dialog: same form pre-filled with existing values
- **Delete** confirmation via AlertDialog (blocked by FK if leads reference the status)
- **Reorder** via up/down arrow buttons per row (Option B) — swaps `.order` values
- **Default toggle** with radio-group behavior: selecting one unsets all others

## Capabilities

### New Capabilities
- `lead-statuses-management`: UI for creating, editing, deleting, and reordering lead statuses from Settings

### Modified Capabilities
<!-- None — no existing spec-level requirements are changing -->

## Impact

| Area | Change |
|------|--------|
| **Settings nav** | `settings/layout.tsx` — new nav item |
| **New page** | `settings/lead-statuses/page.tsx` — new file |
| **CRM context** | `crm-context.tsx` — already has `addLeadStatus`, `updateLeadStatus`, `deleteLeadStatus` (no changes needed) |
| **API** | `/api/v1/lead-statuses` — already supports GET/POST/PATCH/DELETE (no changes needed) |
| **Schema** | `prisma/schema.prisma` — no changes (order field already exists) |
| **Types** | `src/types/index.ts` — no changes |
| **Downstream** | Leads page (`/leads`) and kanban board already sort by `.order` — will reflect changes automatically |
