## ADDED Requirements

### Requirement: Card grid items align to start (top)

Every multi-column card grid SHALL use `items-start` on the grid container so that cards with less content do not stretch to match the height of taller cards in the same row.

#### Scenario: Cards with different heights in same row
- **WHEN** a row contains cards with varying content height (e.g., one card has tags and the other does not)
- **THEN** each card SHALL be only as tall as its own content
- **THEN** cards SHALL NOT stretch to equal height via CSS Grid default `stretch`

#### Scenario: Partial row remaining
- **WHEN** the number of cards is less than the grid column count (e.g., 3 cards in a 4-column grid)
- **THEN** the cards SHALL fill from the left naturally with no centering or empty placeholders

### Requirement: Card grid follows standard responsive pattern

Card grids SHALL follow the responsive breakpoint pattern defined in the root design.md.

#### Scenario: Breakpoint behavior
- **WHEN** viewport is `< 640px`
- **THEN** grid SHALL use 1 column
- **WHEN** viewport is `640px+`
- **THEN** grid SHALL use 2 columns
- **WHEN** viewport is `1024px+`
- **THEN** grid SHALL use 3 columns
- **WHEN** viewport is `1280px+`
- **THEN** grid SHALL use 4 columns (where applicable)

### Requirement: Horizontal breathing room from layout

Card grids SHALL NOT add extra horizontal padding — the `p-6` from the parent `main` container provides consistent side padding.

#### Scenario: Container padding
- **WHEN** a card grid is rendered inside a dashboard or portal page
- **THEN** horizontal breathing room is provided by `main.p-6`
- **THEN** the grid container itself SHALL NOT have additional `px-*` classes

### Requirement: Internal card padding

Each card within a card grid SHALL use `p-6` (default) or `p-4` (compact) on `CardContent`.

#### Scenario: Default card padding
- **WHEN** a Card is inside a card grid
- **THEN** `CardContent` SHALL use `className="p-6"` for standard density
- **THEN** `CardContent` MAY use `className="p-4"` for compact density
