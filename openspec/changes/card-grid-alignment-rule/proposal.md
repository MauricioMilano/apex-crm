## Why

Card grids across the CRM use CSS Grid's default `stretch` alignment, causing cards with different content heights to stretch unevenly in the same row — creating visual inconsistency. The design.md was updated with an `items-start` rule but 10 existing card grids still need updating.

## What Changes

- Add `items-start` class to all multi-column card grid containers (10 files)
- Card contents determined solely by their own content — no forced equal heights
- Partial rows fill naturally from the left with no empty placeholders
- No visual change for grids where all cards are already the same height (stats rows)

## Capabilities

### New Capabilities
- `card-grid-alignment`: Design system rule for consistent card grid alignment across all CRM contexts (dashboard, portal, settings)

### Modified Capabilities

None — purely an implementation-level design system enforcement. Existing specs remain accurate.

## Impact

- 10 component/page files across dashboard, portal, and settings
- Root `design.md` already updated with the rule (Section 3.2a)
- No API, data model, or behavior changes — purely CSS class additions
- Test: visual only — cards with less content no longer stretch to match taller neighbors
