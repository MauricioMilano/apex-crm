## Context

The `design.md` now defines a **§3.8 Detail/Edit Page Pattern** — left-aligned back button + title, right-aligned action buttons. However, no pages in the app implement it. Currently:

- 6 detail/edit pages hand-roll their own headers with inconsistent spacing, icons, and structure
- Each page uses different combinations of `flex-wrap`, `gap-3`, `gap-4`, `items-start`, `items-center`
- Back buttons use `ArrowLeft` in some places, `ChevronLeft` in others, and are missing entirely in portal pages
- Page titles are sometimes inside cards instead of the header row
- No reusable component exists; the pattern is duplicated with slight variations

## Goals / Non-Goals

**Goals:**
- Standardize all 7 detail/edit page headers to match §3.8
- Create a reusable `PageHeader` component to prevent future drift
- Use consistent icon, spacing (`mb-6`, `gap-2`), and typography (`text-xl font-semibold`)
- Keep existing functionality unchanged — visual/structural changes only

**Non-Goals:**
- Do NOT change list/index pages (they follow §3.1 — that's correct)
- Do NOT add new features or change page behavior
- Do NOT touch settings top-level pages where sidebar nav is the navigation mechanism
- Do NOT refactor the full-screen forms builder layout

## Decisions

1. **Reusable component > inlined pattern**
   - A `PageHeader` component prevents the same drift from reappearing
   - Props: `title`, `backHref?`, `onBack?`, `backLabel?` (default `"Back"`), `children` (right actions slot), `className?`
   - Stays in `src/components/ui/` since it's a structural UI primitive

2. **ArrowLeft over ChevronLeft**
   - `ArrowLeft` is the standard "back" metaphor used in §3.8; `ChevronLeft` suggests collapsible panels
   - Migrate the appointments page from `ChevronLeft` to `ArrowLeft`

3. **text-xl font-semibold over text-2xl font-bold**
   - Detail pages are secondary to list pages; smaller title signals hierarchy
   - `font-bold` is reserved for stat values per the typography system (§5)

4. **Back label visible on desktop, hidden on mobile**
   - On mobile (`< sm`), the "Back" text is hidden (`hidden sm:inline`) to save space
   - Icon remains visible at all sizes

## Risks / Trade-offs

- **[Low] Breadcrumb replaced in forms builder** — The breadcrumb provides context about being in the Forms section. The §3.8 header loses this. Mitigation: The back button text "Back to Forms" provides equivalent context.
- **[Low] Form Builder Save is inside the component** — The §3.8 header has a right-actions slot, but the save button lives inside `FormBuilder`. Mitigation: Leave the save button where it is. The header slot stays empty for now and can be used later if needed.
- **[Medium] Portal Profile has multiple Save buttons** — There are two forms (profile info + password) each with their own Save. A single Save in the header can't submit both. Mitigation: Keep Save buttons inside the forms; the header only provides Back + title.
- **[Low] settings/profile is a borderline case** — It's a settings sub-page with sidebar nav, no real need for a back button. Mitigation: Excluded from scope (non-goal).
