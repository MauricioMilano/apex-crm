## ADDED Requirements

### Requirement: PageHeader component renders §3.8 header pattern

A reusable `PageHeader` component SHALL be provided at `src/components/ui/page-header.tsx` that renders the standardized detail/edit page header per design.md §3.8.

The component SHALL accept these props:
- `title: string` — Page title rendered as `<h1>`
- `backHref?: string` — Optional path for back navigation via `router.push()`
- `onBack?: () => void` — Optional callback for custom back behavior (overrides `backHref`)
- `backLabel?: string` — Back button label, defaults to `"Back"`
- `children?: React.ReactNode` — Right-aligned action buttons
- `className?: string` — Additional classes for the outer wrapper

The component SHALL render the following structure:
- Outer wrapper: `<div className="flex items-center justify-between mb-6">`
- Left section: `<div className="flex items-center gap-2">` containing:
  - Back button: `variant="ghost" size="sm"` with `ArrowLeft h-4 w-4 mr-1` icon
  - Title: `<h1 className="text-xl font-semibold">`
- Right section: `<div className="flex items-center gap-2">` rendering `children`

#### Scenario: PageHeader renders with backHref
- **WHEN** `PageHeader` is rendered with `title="Lead Detail"` and `backHref="/leads"`
- **THEN** the component renders a back button with `ArrowLeft` icon and "Back" label that navigates to `/leads` on click, and an `<h1>` with "Lead Detail"

#### Scenario: PageHeader renders with onBack
- **WHEN** `PageHeader` is rendered with `onBack={handleCancel}`
- **THEN** the back button calls `handleCancel` instead of using `router.push()`

#### Scenario: PageHeader renders with action children
- **WHEN** `PageHeader` is rendered with `<Button>Save</Button>` as children
- **THEN** the button appears in the right-aligned actions area with `gap-2` spacing

#### Scenario: Back label hides on mobile
- **WHEN** `PageHeader` renders with default back label
- **THEN** the "Back" text has `hidden sm:inline` class so it appears only on `sm+` screens

#### Scenario: PageHeader without back props
- **WHEN** `PageHeader` is rendered without `backHref` or `onBack`
- **THEN** no back button is rendered (only the title)
