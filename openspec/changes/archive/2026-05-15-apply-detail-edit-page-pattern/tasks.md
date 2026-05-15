## 1. PageHeader Component

- [x] 1.1 Create `src/components/ui/page-header.tsx` with props: `title`, `backHref?`, `onBack?`, `backLabel?`, `children`, `className?`
- [x] 1.2 Implement the component matching spec: `flex items-center justify-between mb-6` outer, left group with `ArrowLeft` ghost button + `<h1>`, right group rendering `children` with `gap-2`
- [x] 1.3 Add `hidden sm:inline` on back label for mobile responsiveness
- [x] 1.4 Export the component from a barrel file or keep as direct import

## 2. Dashboard — Lead Detail

- [x] 2.1 Replace inlined `leads/[id]/page.tsx` header (lines 177-218) with `<PageHeader title={fullName} backHref="/leads">` wrapping the Convert/Edit/Delete buttons
- [x] 2.2 Move `{lead.firstName} {lead.lastName}` from card into the header title
- [x] 2.3 Remove the old title from inside the card below

## 3. Dashboard — Client Detail

- [x] 3.1 Replace inlined `clients/[id]/page.tsx` header (lines 182-234) with `<PageHeader title={fullName} backHref="/clients" backLabel="Back">` wrapping Book Appointment/Edit/Delete buttons
- [x] 3.2 Keep the Avatar component in the left section, positioned before the title outside of PageHeader (use a custom left layout)

## 4. Dashboard — Appointment Detail

- [x] 4.1 Replace inlined `appointments/[id]/page.tsx` header (lines 273-301) with `<PageHeader title="Appointment Details" backHref="/appointments">` wrapping status badge + Delete button
- [x] 4.2 Replace `ChevronLeft` icon usage with `ArrowLeft` (handled by PageHeader)

## 5. Dashboard — Form Builder

- [x] 5.1 Replace breadcrumb in `forms/builder/[id]/page.tsx` (lines 30-42) with `<PageHeader title={formName} backHref="/forms" backLabel="Back to Forms">` inside the full-height shell
- [x] 5.2 Keep the `h-[calc(100vh-4rem)] -m-6` layout unchanged

## 6. Dashboard — Email Template Editor

- [x] 6.1 Replace header in `settings/email/templates/[id]/page.tsx` (lines 73-84) with `<PageHeader title={name} backHref="/settings/email">`
- [x] 6.2 Ensure `name` variable is available at the header location (it's fetched at line 14)

## 7. Client Portal — Profile

- [x] 7.1 Replace heading block in `(client-portal)/profile/page.tsx` (lines 121-126) with `<PageHeader title="Profile" onBack={() => router.back()}>`
- [x] 7.2 Keep Save buttons inside the form cards (design decision — multiple forms can't share one header Save)

## 8. Client Portal — Book Appointment

- [x] 8.1 Replace heading block in `(client-portal)/book/page.tsx` (lines 33-40) with `<PageHeader title="Book an Appointment" onBack={handleCancel}>`
- [x] 8.2 Remove the description line or move it below the header

## 9. Verify

- [x] 9.1 Run `pnpm build` and `pnpm lint` — no regressions
- [x] 9.2 Check that all 7 pages render with consistent header height, spacing, and icon
- [x] 9.3 Verify mobile responsive behavior: back label hidden on < sm, visible on sm+
