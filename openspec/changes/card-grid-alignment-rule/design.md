## Context

Root `design.md` Section 3.2a already defines the card grid alignment rule. 10 multi-column card grids across the codebase still use CSS Grid's default `stretch` alignment and need `items-start` added. The rule was established during exploration; this change applies it.

## Goals / Non-Goals

**Goals:**
- Add `items-start` to all 10 card grid containers
- Ensure visual consistency — no uneven stretching
- Zero visual regression for uniform-height grids (stats rows)

**Non-Goals:**
- No layout refactoring or restructuring
- No new components or abstractions
- No CSS variable or theme token changes
- No changes to single-column grids (`grid gap-3`, `space-y-*`)
- No changes to form-field grids (``grid grid-cols-2 gap-4`` containing Inputs, not Cards)

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Implementation scope | Add `items-start` only | Minimal change. Grid gaps and responsive breakpoints stay as-is. |
| Single-column grids | Excluded | No multi-column behavior, so stretch is not visible. No benefit. |
| Form-field grids | Excluded | Not card layouts. Stretch is harmless/desired for form fields. |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Stats rows (uniform height) visually unchanged | Confirmed by inspection — all stat cards use fixed content. `items-start` is effectively a no-op here. |
| Partial row cards shift visually | Already fill from left by default. No centering was in use. |
| Missed a card grid | Search was thorough across all 44 grids in `src/`. Manual review of each candidate confirmed Card usage. |
