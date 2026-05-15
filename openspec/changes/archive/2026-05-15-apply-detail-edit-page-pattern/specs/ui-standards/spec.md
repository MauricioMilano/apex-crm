## MODIFIED Requirements

### Requirement: Pages use CSS variable tokens exclusively
All page and component styling SHALL use CSS variable tokens from the design system (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-muted`, `bg-primary`, `text-primary`, etc.) instead of literal Tailwind color classes like `bg-gray-*`, `text-white`, `text-gray-*`, `border-gray-*`.

#### Scenario: Dashboard page renders with theme tokens
- **WHEN** any dashboard page renders in dark mode
- **THEN** it uses CSS variables — no hardcoded dark Tailwind classes

#### Scenario: Dashboard page renders in light mode
- **WHEN** dashboard light mode is toggled
- **THEN** all colors update via CSS variable cascade — no dark islands

#### Scenario: Portal page renders with theme tokens
- **WHEN** any portal page renders in light mode
- **THEN** it uses CSS variables — no hardcoded light Tailwind classes

#### Scenario: Portal page renders in dark mode
- **WHEN** portal dark mode is toggled
- **THEN** all colors update via CSS variable cascade

## ADDED Requirements

### Requirement: Detail/edit page headers follow §3.8 pattern

All detail and edit pages SHALL use the standardized header pattern defined in design.md §3.8: a left-aligned back button with `ArrowLeft` icon + page title as `<h1>`, and right-aligned action buttons, with consistent spacing (`mb-6`, `gap-2`).

#### Scenario: Detail page renders with §3.8 header
- **WHEN** a detail or edit page renders
- **THEN** the header region contains a back button with `ArrowLeft` icon, a `<h1>` with `text-xl font-semibold` title, and action buttons aligned to the right with `gap-2` spacing

#### Scenario: Back button navigates to parent list
- **WHEN** the user clicks the back button on a detail page
- **THEN** the app navigates to the parent list page (e.g., leads list, clients list)

### Requirement: Loading states use consistent pattern
All route groups SHALL have `loading.tsx` boundaries using the centered `Loader2` spinner pattern. Component-level loading states SHALL use the `Loader2` with `animate-spin` pattern.

#### Scenario: loading.tsx boundary renders
- **WHEN** a route segment is loading
- **THEN** the loading boundary displays a centered `Loader2` with `animate-spin` in `text-primary`

### Requirement: Error states use consistent pattern
All route groups SHALL have `error.tsx` boundaries. Feature components SHALL use `sonner` toast for error notifications.

#### Scenario: error.tsx boundary renders
- **WHEN** an error occurs in a route group
- **THEN** the error boundary displays a styled card with destructive border, error message, and "Try again" reset button

#### Scenario: Feature component error
- **WHEN** a feature component encounters an error
- **THEN** it calls `toast.error()` from sonner

### Requirement: Not-found states use consistent pattern
All route groups SHALL have `not-found.tsx` pages with centered icon, message, and "Go Back" button.

#### Scenario: not-found.tsx renders
- **WHEN** a route is not found
- **THEN** the not-found page displays a centered icon, "Not Found" heading, description, and back button

### Requirement: Skeleton component is used for loading skeletons
All loading skeleton states SHALL use the Shadcn `Skeleton` component from `ui/skeleton.tsx`. Manual `animate-pulse` divs are FORBIDDEN.

#### Scenario: Skeleton replaces manual animate-pulse
- **WHEN** a component needs a loading skeleton
- **THEN** it uses `<Skeleton className="..." />` instead of manual `animate-pulse` divs

### Requirement: Forms builder uses theme variables
`src/components/forms/field-editor.tsx` and `style-editor.tsx` SHALL use CSS variable tokens instead of hardcoded `bg-gray-*`, `text-gray-*`, `border-gray-*` classes.

#### Scenario: Forms builder renders in dashboard dark mode
- **WHEN** the form builder is opened in dashboard context
- **THEN** it renders with the same dark aesthetic using `bg-card`, `bg-muted`, `text-foreground`, `border-border`

### Requirement: Empty states follow design.md template
All empty state displays SHALL use the centered template with icon, `text-muted-foreground`, and `py-12` padding as specified in design.md.

#### Scenario: Empty state renders
- **WHEN** a list or data display has no items
- **THEN** the empty state uses centered layout with `text-muted-foreground` and `py-12`

### Requirement: Status badges follow universal color convention
All status and source badges SHALL use the pattern `bg-{color}-500/20 text-{color}-400 border-{color}-500/30`.

#### Scenario: Status badge renders
- **WHEN** a status badge is displayed
- **THEN** it uses the 20-400-30 opacity convention with the appropriate color
