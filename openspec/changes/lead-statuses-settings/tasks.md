## 1. Settings Navigation

- [ ] 1.1 Add "Lead Statuses" nav item to settings sidebar (settings/layout.tsx) with `ListChecks` icon from lucide-react

## 2. Settings Page — Table View

- [ ] 2.1 Create `settings/lead-statuses/page.tsx` with page header ("Lead Statuses" + subtitle)
- [ ] 2.2 Fetch lead statuses via `useCRM().leadStatuses` from CRM context
- [ ] 2.3 Render a `Table` component with columns: Name, Color, Default, Lead Count, Order, Actions
- [ ] 2.4 Display color as a circular swatch using the Tailwind color class
- [ ] 2.5 Show a star/badge indicator for the default status
- [ ] 2.6 Count leads per status by matching `lead.statusId === status.id` from `useCRM().leads`
- [ ] 2.7 Display order number per row
- [ ] 2.8 Sort rows by `.order` ascending

## 3. Settings Page — Add Status Dialog

- [x] 3.1 Add "Add Status" button in page header
- [x] 3.2 Create a `Dialog` with form fields: name (Input), color (palette picker), "Set as default" (Switch)
- [x] 3.3 Color palette: 10 predefined Tailwind colors as clickable circles (blue, yellow, green, purple, emerald, red, orange, gray, pink, indigo)
- [x] 3.4 On submit: call `useCRM().addLeadStatus()` with name, color, isDefault, order (max order + 1 or 1 if default)
- [x] 3.5 Validate name is not empty; show toast error if invalid
- [x] 3.6 On success: show `toast.success('Status created')`, close dialog

## 4. Settings Page — Edit Status Dialog

- [x] 4.1 Add edit (pencil) button per row in Actions column
- [x] 4.2 On click: open the same dialog from step 3, pre-filled with current status values
- [x] 4.3 On submit: call `useCRM().updateLeadStatus(id, updates)` with changed fields
- [x] 4.4 If isDefault toggled on: also unset all other statuses' isDefault via a single update loop
- [x] 4.5 On success: show `toast.success('Status updated')`, close dialog

## 5. Settings Page — Delete Status

- [x] 5.1 Add delete (trash) button per row in Actions column
- [x] 5.2 If status has zero leads: show `AlertDialog` confirmation, then call `useCRM().deleteLeadStatus(id)`
- [x] 5.3 If status has leads assigned: disable delete button, show tooltip "Cannot delete — X leads reference this status"
- [x] 5.4 If only one status exists: disable delete button, show tooltip "At least one status is required"
- [x] 5.5 On success: show `toast.success('Status deleted')`

## 6. Settings Page — Reorder (Up/Down Arrows)

- [x] 6.1 Add up (ChevronUp) and down (ChevronDown) arrow buttons per row in the Order column
- [x] 6.2 Disable up arrow on the first row; disable down arrow on the last row
- [x] 6.3 On up click: create a Server Action that swaps `order` of the clicked status with the one above (order - 1)
- [x] 6.4 On down click: create a Server Action that swaps `order` of the clicked status with the one below (order + 1)
- [x] 6.5 After swap: update `leadStatuses` in CRM context via `setLeadStatuses` to reflect new order immediately
- [x] 6.6 Server action must filter by `DEFAULT_ORG_ID` for multi-tenancy

## 7. Server Action — Reorder Lead Status

- [x] 7.1 Create `src/actions/lead-statuses.ts` with `reorderLeadStatus(statusId: string, direction: 'up' | 'down')`
- [x] 7.2 Action logic: find current status, find neighbor, swap their `order` values in a Prisma transaction
- [x] 7.3 Return `{ success: true as const }` on success, `{ success: false as const, error: string }` on failure
