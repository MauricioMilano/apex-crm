# Apex CRM — UI Design System

Single source of truth for all UI patterns, component conventions, and visual standards.

---

## 1. Theme Architecture

### 1.1 Context-Based Theme System

The app has **two visual contexts**, each with independent light/dark toggling:

| Context | Selector | Default Mode | Primary Color |
|---|---|---|---|
| Dashboard | `[data-theme="dashboard"]` | Dark | Blue (`221.2 83.2% 53.3%`) |
| Portal | `[data-theme="portal"]` | Light | Blue (`221.2 83.2% 53.3%`) |

### 1.2 Theme Selector Hierarchy

```css
:root                                    → base light tokens
.dark                                    → base dark tokens
[data-theme="dashboard"]                 → dashboard dark defaults
[data-theme="dashboard"].dashboard-light → dashboard light override
[data-theme="portal"]                    → portal light defaults
[data-theme="portal"].portal-dark        → portal dark override
```

Each layout applies its context via `data-theme` on `<html>`. Toggle adds/removes the variant class.

### 1.3 CSS Variable Tokens (Single Source of Truth)

All components MUST use these **CSS variable tokens only**. Literal Tailwind color classes (`bg-gray-*`, `text-white`, `border-gray-*`) are FORBIDDEN in feature components.

| Token | Usage | Light Value | Dashboard Dark Value |
|---|---|---|---|
| `bg-background` | Page background | `0 0% 100%` | `0 0% 3.9%` |
| `text-foreground` | Primary text | `0 0% 3.9%` | `0 0% 98%` |
| `bg-card` | Card surfaces | `0 0% 100%` | `0 0% 7%` |
| `text-card-foreground` | Card text | `0 0% 3.9%` | `0 0% 98%` |
| `bg-muted` | Secondary surfaces (inputs, disabled) | `0 0% 96.1%` | `0 0% 14.9%` |
| `text-muted-foreground` | Secondary text (labels, descriptions) | `0 0% 45.1%` | `0 0% 63.9%` |
| `bg-primary` | Primary buttons, active states | `221.2 83.2% 53.3%` | `221.2 83.2% 53.3%` |
| `text-primary` | Primary text, links | `221.2 83.2% 53.3%` | `221.2 83.2% 53.3%` |
| `border-border` | All borders | `0 0% 89.8%` | `0 0% 14.9%` |
| `bg-accent` | Hover backgrounds | `0 0% 96.1%` | `0 0% 14.9%` |
| `text-accent-foreground` | Hover text | `0 0% 9%` | `0 0% 98%` |
| `bg-destructive` | Destructive/delete actions | `0 84.2% 60.2%` | `0 62.8% 30.6%` |
| `text-destructive` | Destructive text | `0 84.2% 60.2%` | `0 62.8% 30.6%` |

### 1.4 Token Mapping Reference

```
Literal Tailwind        →  CSS Variable Token
────────────────────────────────────────────
bg-white                →  bg-background
bg-gray-50 / bg-gray-100 → bg-muted
bg-gray-900 / bg-gray-800 → bg-card
text-gray-900 / text-white → text-foreground
text-gray-700           →  text-foreground (secondary)
text-gray-500 / text-gray-400 → text-muted-foreground
border-gray-200 / border-gray-300 → border-border
bg-blue-50              →  bg-primary/10
text-blue-600 / text-blue-400 → text-primary
border-blue-200         →  border-primary/20
bg-blue-600             →  bg-primary
hover:bg-blue-700       →  hover:bg-primary/90
```

---

## 2. Layout Architecture

### 2.1 Route Group Structure

```
(layout.tsx — root, providers, fonts, Toaster)
│
├── (auth)/layout.tsx
│     Server Component
│     Centered card: min-h-screen flex flex-col items-center justify-center p-4
│     Content: max-w-[400px]
│     No sidebar, no header, no footer
│     Logo + "Professional CRM System" tagline
│
├── (dashboard)/layout.tsx
│     Client Component (useAuth guard → redirect /login)
│     ThemeProvider context="dashboard"
│     Shell: flex h-screen bg-background overflow-hidden
│     ├── Sidebar (fixed mobile, static lg+)
│     ├── Header (h-16, px-4)
│     └── main.flex-1.overflow-y-auto.p-6
│
├── (client-portal)/layout.tsx
│     Client Component (useAuth guard, role=client check)
│     ThemeProvider context="portal"
│     Shell: min-h-screen bg-background flex flex-col
│     ├── header.sticky.z-30.border-b (h-16)
│     ├── main.flex-1
│     └── footer.border-b (copyright)
│
└── settings/layout.tsx (inside dashboard)
      Client Component
      Two-column: sidebar.w-56.sticky + main.flex-1.min-w-0
      Sub-nav via useFilteredNav(role, 'settings')
```

### 2.2 Sidebar Component

```
┌─────────────────────────────────────────────────┐
│  Logo + "ApexCRM"          [collapse toggle]    │  h-16
│  ─────────────────────────────────────────────── │
│  Section Title                                   │  text-xs font-semibold uppercase tracking-wider
│  ├── ● Item (icon + label)                       │  text-sm font-medium
│  ├── ● Item (icon + label + badge)              │
│  └── ● Item (icon + label)                      │
│  ─────────────────────────────────────────────── │
│  ┌──────────────┐                                │
│  │ User Avatar  │ Name / Email        [logout]  │  sticky bottom
│  └──────────────┘                                │
└─────────────────────────────────────────────────┘

Collapsed: w-16, centered icons, tooltips, text hidden
Expanded:  w-60
Transition: all duration-300 ease-in-out
Persistence: localStorage('crm_sidebar_collapsed')
```

### 2.3 Header Component

```
┌──────────────────────────────────────────────────────────────┐
│ [☰]  Page Title        [🔍 Search...] [🔔3] [🌙] [👤 ▾]  │
│ lg:hidden  hidden sm:block   hidden md:block  w-64          │
└──────────────────────────────────────────────────────────────┘
Height: h-16 (64px)
```

### 2.4 Mobile Responsiveness

| Breakpoint | Sidebar | Header Search | Grid Columns |
|---|---|---|---|
| `< 640px` (sm) | Off-screen drawer | Hidden | 1 |
| `640px+` (sm) | Off-screen drawer | Hidden | 2 |
| `768px+` (md) | Off-screen drawer | Visible | 3 |
| `1024px+` (lg) | Static/flow | Visible | 3+ |
| `1280px+` (xl) | Static/flow | Visible | 4 |

Mobile sidebar: `fixed inset-y-0 left-0 z-40` + `translate-x` (0 / -100%) + overlay `z-30 bg-black/60`

---

## 3. Component Patterns

### 3.1 Page Composition (Standard Template)

```
┌─────────────────────────────────────────────┐
│  Header Row                                  │
│  ┌───────────────────────────────────────┐  │
│  │  <h1>Page Title        [+ New Item]   │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Stats Bar (optional)                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ Stat │ │ Stat │ │ Stat │ │ Stat │      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
│                                              │
│  Filter Bar (optional)                       │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Search │ │ Filter │ │ View   │          │
│  └────────┘ └────────┘ └────────┘          │
│                                              │
│  Data Display                                │
│  ┌─────────────────────────────────────────┐│
│  │  Table (within Card)                   ││
│  │  or Grid of Cards                      ││
│  │  or Kanban Columns (overflow-x-auto)   ││
│  └─────────────────────────────────────────┘│
│                                              │
│  Empty State (when no data)                  │
│  ┌─────────────────────────────────────────┐│
│  │      ◎                                  ││
│  │    No items found                       ││
│  │    text-muted-foreground py-12          ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘

Modals (overlay):
┌─────────────────────────────────────────────┐
│  Dialog (create/edit)                        │
│  AlertDialog (delete/destructive)            │
└─────────────────────────────────────────────┘
```

### 3.2 Card Pattern

```tsx
<Card className="bg-card border-border">
  <CardHeader className="p-6 pb-0">
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    ...
  </CardContent>
</Card>
```

- Hover cards: `hover:border-primary/40 transition-colors`
- Interactive cards: `cursor-pointer`

### 3.2a Card Grid Alignment

Card grids must use `items-start` so cards with variable content don't stretch to equal height — each card is only as tall as its content. Partial rows fill naturally from the left.

```
Responsive grid (4 breakpoints):

  <640px (sm):  1 col       640px+ (sm):  2 cols
  ┌──────────────┐            ┌──────┐ ┌──────┐
  │ Card         │            │ Card │ │ Card │
  └──────────────┘            └──────┘ └──────┘
  ┌──────────────┐            ┌──────┐ ┌──────┐
  │ Card         │            │ Card │ │ Card │
  └──────────────┘            └──────┘ └──────┘

  1024px+ (lg):  3 cols      1280px+ (xl):  4 cols
  ┌───┐ ┌───┐ ┌───┐          ┌──┐ ┌──┐ ┌──┐ ┌──┐
  │Card│ │Card│ │Card│          │  │ │  │ │  │ │  │
  └───┘ └───┘ └───┘          └──┘ └──┘ └──┘ └──┘
  ┌───┐ ┌───┐                 ┌──┐ ┌──┐ ┌──┐
  │Card│ │Card│                 │  │ │  │ │  │
  └───┘ └───┘                 └──┘ └──┘ └──┘
```

Effect of `items-start` on variable-height cards:

```
  COM items-start (CORRETO):          SEM items-start (STRETCH):
  ┌────────────┐ ┌────────────┐       ┌────────────┐ ┌────────────┐
  │ Nome       │ │ Nome       │       │ Nome       │ │ Nome       │
  │ Email      │ │ Email      │       │ Email      │ │ Email      │
  │ Telefone   │ └────────────┘       │ Telefone   │ │            │
  │ [tag][tag] │                      │ [tag][tag]  │ │            │
  │ [tag]      │                      │ [tag]       │ │            │
  └────────────┘                      │            │ │            │
                                      └────────────┘ └────────────┘
```

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
  {items.map((item) => (
    <Card key={item.id} className="bg-card border-border">
      <CardContent className="p-6">{/* content */}</CardContent>
    </Card>
  ))}
</div>
```

Rules:
- Breathing room: `p-6` on the parent `main` container handles horizontal padding. Do NOT add extra `px-*` to the grid container.
- Card internal padding: `p-6` (default) or `p-4` (compact) on `CardContent`.
- Partial rows: cards fill from left naturally. No centering or empty placeholders.
- Content variance: different heights within a row is expected and correct with `items-start`.

### 3.3 Dialog/Modal Pattern

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="bg-card border-border sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-foreground">Title</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-2">
      {/* fields */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={cancel}>Cancel</Button>
      <Button onClick={submit}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3.4 AlertDialog Pattern (Destructive)

```tsx
<AlertDialog>
  <AlertDialogContent className="bg-card border-border">
    <AlertDialogTitle className="text-foreground">Delete X</AlertDialogTitle>
    <AlertDialogDescription className="text-muted-foreground">
      Are you sure?
    </AlertDialogDescription>
    <AlertDialogCancel className="border-border text-muted-foreground">
      Cancel
    </AlertDialogCancel>
    <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
      Delete
    </AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

### 3.5 Form Pattern

```tsx
// Complex forms (react-hook-form + zod)
const form = useForm<Schema>({ resolver: zodResolver(schema) })

<Form {...form}>
  <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
    <FormField control={form.control} name="field" render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl>
          <Input placeholder="..." className="bg-muted border-border text-foreground" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline">Cancel</Button>
      <Button type="submit">Save</Button>
    </div>
  </form>
</Form>

// Simple forms (useState)
// Settings pages, simple CRUD with 1-3 fields
```

### 3.6 Avatar Pattern

```tsx
const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?'

<Avatar className="h-8 w-8">
  <AvatarImage src={avatarUrl} />
  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
    {initials}
  </AvatarFallback>
</Avatar>
```

Sizes: `h-10 w-10` (card), `h-8 w-8` (sidebar), `h-7 w-7` (table), `h-6 w-6` (lead table), `h-5 w-5` (tiny)

### 3.7 Search Input Pattern

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input placeholder="Search..." className="pl-9" />
</div>
```

### 3.8 Detail/Edit Page Pattern

For detail views, edit forms, and creation pages — a header with back-navigation on the left and action buttons on the right.

```
┌─────────────────────────────────────────────┐
│  Header Row                                  │
│  ┌───────────────────────────────────────┐  │
│  │  ← Back        Page Title  [Save][✕] │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Content (form / details)                    │
│  ┌─────────────────────────────────────────┐│
│  │  Card                                 ││
│  │  ┌───────────────────────────────────┐ ││
│  │  │ Fields / detail rows             │ ││
│  │  └───────────────────────────────────┘ ││
│  └─────────────────────────────────────────┘│
│                                              │
│  Bottom Action Bar (optional)                │
│  ┌─────────────────────────────────────────┐│
│  │  [Delete]              [Cancel] [Save]  ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

**Header Row:**

```
← Back:  variant="ghost" size="sm", ArrowLeft h-4 w-4 mr-1
Title:   text-xl font-semibold (detail) or text-2xl (top-level)
Spacer:  flex-1
Actions: flex items-center gap-2
```

```tsx
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="sm" onClick={() => router.back()}>
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back
    </Button>
    <h1 className="text-xl font-semibold">Page Title</h1>
  </div>
  <div className="flex items-center gap-2">
    {/* action buttons */}
  </div>
</div>
```

**Bottom Action Bar** (when save is outside the card):

```tsx
<div className="flex items-center justify-between pt-6 border-t mt-6">
  <Button variant="destructive" size="sm">Delete</Button>
  <div className="flex items-center gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </div>
</div>
```

**Mobile behavior:**

| Element | `< sm` | `sm+` |
|---|---|---|
| Back label | Hidden (icon-only) | Visible |
| Page title | `text-lg` | `text-xl` |
| Right actions | Icon-only / collapsed | Full labels |
| Bottom bar | Stacks vertically | Inline |

---

## 4. Spacing System

### 4.1 Spacing Reference

| Context | Pattern |
|---|---|
| Component outer wrapper | `space-y-4` or `space-y-6` |
| Card content | `p-4` (compact) or `p-6` (default) |
| Grid gaps (tight) | `gap-2` |
| Grid gaps (standard) | `gap-3` |
| Grid gaps (loose) | `gap-4` |
| Form sections | `space-y-4` |
| Form fields (2 col) | `grid grid-cols-2 gap-4` |
| Form fields (3 col) | `grid grid-cols-3 gap-4` |
| Form action buttons | `flex justify-end gap-2 pt-2` |
| Sidebar nav items | `px-3 py-2` |
| Sidebar item groups | `space-y-0.5` |
| Sidebar sections | `space-y-6` |
| Header | `px-4 gap-4` |
| Dialog body | `space-y-4 py-2` |
| Empty state padding | `py-12` |
| Toolbar items | `gap-3` flex-wrap |
| Action bar top | `pt-2` |

### 4.2 Grid Column Patterns

| Columns | Breakpoint | Pattern |
|---|---|---|
| Responsive card grid | sm→xl | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start` |
| Stats row | all | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` |
| Form (2 fields) | all | `grid grid-cols-2 gap-4` |
| Form (3 fields) | all | `grid grid-cols-3 gap-4` |
| Time slots | sm→md | `grid-cols-3 sm:grid-cols-4 gap-2` |
| Service selection | sm | `grid-cols-1 sm:grid-cols-2 gap-3` |

---

## 5. Typography

| Element | Classes |
|---|---|
| Page title (h1) | `text-2xl font-semibold` |
| Section heading | `text-lg font-semibold` |
| Card title | `CardTitle` → `font-semibold leading-none tracking-tight` |
| Card description | `CardDescription` → `text-sm text-muted-foreground` |
| Nav section label | `text-xs font-semibold uppercase tracking-wider text-muted-foreground` |
| Nav item | `text-sm font-medium` |
| Stat value | `text-2xl font-bold` |
| Stat label | `text-sm font-medium text-muted-foreground` |
| Body text | `text-sm text-foreground` |
| Secondary text | `text-sm text-muted-foreground` |
| Small/meta | `text-xs text-muted-foreground` |
| Mono/code | `font-mono text-sm` |
| Tiny badge | `text-[10px] px-1.5 py-0 h-4` |
| Stage number | `text-xs font-bold` |
| Trend indicator | `text-xs font-medium` |

---

## 6. Color Usage

### 6.1 Status/Source Badge Convention

**Universal pattern** — every status/source badge in the app:

```tsx
className="bg-{color}-500/20 text-{color}-400 border-{color}-500/30"
```

Available colors: `blue`, `purple`, `emerald`, `green`, `amber`, `rose`, `cyan`, `indigo`, `yellow`, `red`, `gray`, `orange`, `pink`, `teal`, `primary`

### 6.2 Semantic Color Rules

| Element | Classes |
|---|---|
| Primary action button | `bg-primary hover:bg-primary/90 text-primary-foreground` |
| Destructive action button | `bg-destructive hover:bg-destructive/90 text-destructive-foreground` |
| Ghost/cancel button | `variant="ghost"` or `variant="outline" border-border text-muted-foreground` |
| Active nav item | `bg-primary/20 text-primary` |
| Inactive nav item | `text-muted-foreground hover:text-foreground hover:bg-accent` |
| Focus ring | `focus-visible:ring-1 focus-visible:ring-ring` |
| Disabled state | `opacity-50 cursor-not-allowed` |
| Avatar background | `bg-primary text-primary-foreground` |
| Avatar color palette | `bg-blue-500`, `bg-purple-500`, `bg-emerald-500`, `bg-amber-500`, `bg-rose-500`, `bg-cyan-500`, `bg-indigo-500` |
| Success (trend up) | `text-emerald-400` |
| Failure (trend down) | `text-red-400` |
| Payment value | `text-emerald-400 font-medium` |

---

## 7. Effects & Transitions

### 7.1 Overlay/Modal Animations

**Overlay (universal):**
```
fixed inset-0 z-50 bg-black/80
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
```

**Content (Dialog, AlertDialog, Popover, HoverCard, Tooltip, ContextMenu, DropdownMenu):**
```
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
```

**Sheet (directional):**
```
data-[state=closed]:duration-300 data-[state=open]:duration-500
data-[state=closed]:slide-out-to-{side} data-[state=open]:slide-in-from-{side}
```

### 7.2 Component Transitions

| Element | Classes |
|---|---|
| Sidebar collapse | `transition-[width] duration-300 ease-in-out` |
| Mobile sidebar open/close | `transition-transform duration-300` |
| Button hover | `transition-colors` |
| Card hover border | `transition-colors` |
| Hover-reveal actions | `opacity-0 group-hover:opacity-100 transition-opacity` |
| Accordion | `transition-all duration-200` |
| Accordion chevron | `transition-transform duration-200` |
| Switch | `transition-colors` |
| Switch thumb | `data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0` |
| Skeleton | `animate-pulse rounded-md bg-primary/10` |
| Nav menu chevron | `group-data-[state=open]:rotate-180 transition-transform duration-200` |
| Scrollbar thumb | `transition-colors` |
| Focus-visible | `transition-colors` |
| Progress bar | `transition-all` |

### 7.3 Keyframes & Custom Animations

Defined in `tailwind.config.ts`:
- `accordion-down` / `accordion-up` — height 0 ↔ `--radix-accordion-content-height`, 0.2s ease-out

From `tailwindcss-animate` plugin (available everywhere):
- `animate-in` / `animate-out`
- `fade-in-{n}` / `fade-out-{n}`
- `zoom-in-{n}` / `zoom-out-{n}`
- `slide-in-from-{side}-{n}` / `slide-out-to-{side}-{n}`
- `duration-{n}`
- `delay-{n}`

---

## 8. State Handling

### 8.1 Loading States

```tsx
// Use Loader2 with animate-spin:
<Loader2 className="h-8 w-8 animate-spin text-primary" />

// Inline loading:
const [loading, setLoading] = useState(true)
{loading && <p className="text-muted-foreground">Loading...</p>}

// Button loading:
<Button disabled={submitting}>
  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {submitting ? "Saving..." : "Save"}
</Button>
```

### 8.2 Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
  <p className="text-muted-foreground">No items found.</p>
  <p className="text-sm text-muted-foreground/70">Add one to get started.</p>
</div>
```

### 8.3 Error States

Primary pattern: **sonner toast** (`toast.error()`)
Secondary: inline error in forms via `FormMessage` / `FieldError`
Boundary: dashboard `error.tsx` with `reset()` + stack trace

### 8.4 Not Found (Detail Pages)

```tsx
// Inline, no not-found.tsx:
<div className="flex flex-col items-center justify-center py-12">
  <Frown className="h-16 w-16 text-muted-foreground/50 mb-4" />
  <h2 className="text-xl font-semibold mb-2">Not Found</h2>
  <p className="text-muted-foreground mb-4">The resource was not found.</p>
  <Button variant="outline" onClick={() => router.back()}>
    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
  </Button>
</div>
```

---

## 9. Component Rules

### 9.1 Imports & Directives

- All Shadcn/UI components import `cn()` from `@/lib/utils`
- Icon library: `lucide-react` only
- Toast library: `sonner` only (`toast.success`, `toast.error`)
- Form library: `react-hook-form` + `@hookform/resolvers/zod`
- Chart library: `recharts` only
- Calendar: `react-day-picker` only (via `ui/calendar.tsx`)
- Date-picking: `input-otp` only (via `ui/input-otp.tsx`)

### 9.2 Server Components vs Client Components

- Feature pages: ALWAYS `"use client"` (current convention)
- Layout components: `"use client"` only when hooks/browser APIs required
- UI primitives that DON'T need state/events: Server-safe (no directive)
- UI primitives that USE Radix/hooks: `"use client"`

### 9.3 Icon Sizing

| Context | Size |
|---|---|
| In buttons | `h-4 w-4` (with `mr-2` spacing) |
| In nav items | `h-4 w-4 shrink-0` |
| Search prefix | `h-4 w-4` |
| Stat card icon | `h-5 w-5` |
| Empty state | `h-12 w-12` |
| Tiny decoration | `h-3 w-3` |

### 9.4 Button Variants

| Variant | Use Case |
|---|---|
| `default` | Primary action (Create, Save, Submit) |
| `destructive` | Delete, Remove, Cancel subscription |
| `outline` | Secondary action (Cancel, Discard) |
| `ghost` | Toolbar, inline, subtle actions |
| `secondary` | Toggle active state, subtle emphasis |
| `link` | Text-only action, inline navigation |
| `icon` size | Icon-only buttons (h-9 w-9) |

### 9.5 Badge Variants

| Variant | Use Case |
|---|---|
| `default` | Primary indicator |
| `secondary` | Count, label, tag |
| `destructive` | Error, warning |
| `outline` + status colors | Status badges (see 6.1) |
| `text-[10px]` extra small | Tags in cards |

### 9.6 Hover-Reveal Pattern

For card action buttons (edit/delete on hover):

```tsx
<div className="group relative">
  {/* main content */}
  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button variant="ghost" size="icon">...</Button>
  </div>
</div>
```

### 9.7 Avatar Color Deterministic Palette

```ts
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500',
]
const colorIndex = name.charCodeAt(0) % AVATAR_COLORS.length
const colorClass = AVATAR_COLORS[colorIndex]
```

---

## 10. Anomalies to Fix

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | Hardcoded gray colors instead of CSS variable tokens | `src/components/forms/field-editor.tsx`, `style-editor.tsx` | High |
| 2 | `Skeleton` UI component exists but unused — prefer it over `animate-pulse` divs | Everywhere (0 usages in features) | Medium |
| 3 | No `loading.tsx` boundaries | All route groups | Medium |
| 4 | `error.tsx` only in dashboard, missing for auth and portal | `(auth)/`, `(client-portal)/` | Medium |
| 5 | No `not-found.tsx` files | All route groups | Low |
| 6 | 100% Client Components — missed Server Component opportunities | All pages | Low |

---

## 11. Navigation Data Model

Single source of truth: `src/lib/navigation.ts`

```typescript
interface NavItem {
  title: string
  href: string
  icon?: string           // key into ICON_MAP
  badge?: string
  requiredRole?: UserRole[]
  context?: NavContext[]   // 'dashboard' | 'portal' | 'settings'
  children?: NavItem[]
}

interface NavSection {
  title?: string
  items: NavItem[]
}
```

Filtering: `useFilteredNav(role, context)` from `src/hooks/use-filtered-nav.ts`

---

## 12. Data Fetching Patterns

| Pattern | Where Used | How |
|---|---|---|
| CRM Context | Primary state (leads, clients, appointments, services) | `useCRM()` — loaded on mount, mutations via context methods |
| REST API `/api/v1/*` | Payments, payment-methods, files, org lookup | `useEffect` + `fetch()` |
| Server Actions `@/actions/*` | Settings, auth profile, availability | Direct import + `{ success, data, error }` return |
| Auth Context | User session, login/logout/register | `useAuth()` |

---

## 13. File Organization

```
src/
  actions/          # Server Actions (all mutations)
  app/              # Next.js App Router pages + layouts
  components/
    ui/             # Shadcn/UI primitives (46 components)
    */              # Feature-specific (clients/, leads/, etc.)
    theme/          # ThemeProvider, ThemeToggle
    payments/       # Payment modal & watcher
  contexts/         # Auth, CRM, OrgSettings
  hooks/            # use-filtered-nav, use-mobile, etc.
  lib/
    db.ts           # Prisma singleton
    utils.ts        # cn(), etc.
    navigation.ts   # NAV_CONFIG, ICON_MAP, types
  types/            # Shared TypeScript enums & interfaces
```

---

## 14. CSS Definitions (globals.css)

- **Only** Tailwind directives, CSS variable definitions, and `@layer base` rules
- No component-specific styles in globals.css
- Theme contexts via `[data-theme="dashboard"]`, `[data-theme="portal"]`
- Variant classes: `.dashboard-light`, `.portal-dark`
- `* { @apply border-border; }` — universal border color
- `body { @apply bg-background text-foreground; }` — base body style
