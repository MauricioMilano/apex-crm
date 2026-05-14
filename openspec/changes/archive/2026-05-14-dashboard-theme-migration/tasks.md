## 1. Shared Dashboard Components

- [x] 1.1 `src/components/calendar/calendar-grid.tsx` — Migrate ~39 class instances
- [x] 1.2 `src/components/email/template-editor.tsx` — Migrate ~20 class instances
- [x] 1.3 `src/components/email/smtp-config-form.tsx` — Migrate ~41 class instances
- [x] 1.4 `src/components/email/template-list.tsx` — Migrate ~8 class instances
- [x] 1.5 `src/components/email/template-preview.tsx` — Migrate ~3 class instances
- [x] 1.6 `src/components/leads/kanban-board.tsx` — Migrate ~76 class instances
- [x] 1.7 `src/components/leads/lead-card.tsx` — Migrate ~40 class instances
- [x] 1.8 `src/components/leads/status-column.tsx` — Migrate ~11 class instances
- [x] 1.9 `src/components/leads/lead-form.tsx` — Migrate ~57 class instances
- [x] 1.10 `src/components/payments/confirm-payment-modal.tsx` — Migrate ~29 class instances
- [x] 1.11 `src/components/settings/payment-method-form.tsx` — Migrate ~15 class instances
- [x] 1.12 `src/components/clients/client-subscriptions-panel.tsx` — Migrate ~22 class instances
- [x] 1.13 `src/components/clients/client-list.tsx` — Migrate ~1 class instance
- [x] 1.14 `src/components/forms/form-builder.tsx` — Migrate ~17 class instances
- [x] 1.15 `src/components/appointments/appointment-card.tsx` — Migrate ~17 class instances
- [x] 1.16 `src/components/appointments/status-select.tsx` — Migrate ~7 class instances

## 2. Dashboard Pages

- [x] 2.1 `src/app/(dashboard)/dashboard/page.tsx` — Migrate ~43 class instances
- [x] 2.2 `src/app/(dashboard)/reports/page.tsx` — Migrate ~60 class instances
- [x] 2.3 `src/app/(dashboard)/calendar/page.tsx` — Migrate ~45 class instances
- [x] 2.4 `src/app/(dashboard)/appointments/page.tsx` — Migrate ~30 class instances
- [x] 2.5 `src/app/(dashboard)/appointments/[id]/page.tsx` — Migrate ~78 class instances
- [x] 2.6 `src/app/(dashboard)/leads/page.tsx` — Migrate ~13 class instances
- [x] 2.7 `src/app/(dashboard)/leads/[id]/page.tsx` — Migrate ~86 class instances
- [x] 2.8 `src/app/(dashboard)/forms/page.tsx` — Migrate ~49 class instances
- [x] 2.9 `src/app/(dashboard)/forms/builder/[id]/page.tsx` — Migrate ~4 class instances
- [x] 2.10 `src/app/(dashboard)/error.tsx` — Migrate ~10 class instances

## 3. Settings Pages

- [x] 3.1 `src/app/(dashboard)/settings/layout.tsx` — Migrate ~5 class instances
- [x] 3.2 `src/app/(dashboard)/settings/page.tsx` — Migrate ~12 class instances
- [x] 3.3 `src/app/(dashboard)/settings/profile/page.tsx` — Migrate ~56 class instances
- [x] 3.4 `src/app/(dashboard)/settings/team/page.tsx` — Migrate ~54 class instances
- [x] 3.5 `src/app/(dashboard)/settings/services/page.tsx` — Migrate ~62 class instances
- [x] 3.6 `src/app/(dashboard)/settings/plans/page.tsx` — Migrate ~25 class instances
- [x] 3.7 `src/app/(dashboard)/settings/hours/page.tsx` — Migrate ~46 class instances
- [x] 3.8 `src/app/(dashboard)/settings/email/page.tsx` — Migrate ~3 class instances
- [x] 3.9 `src/app/(dashboard)/settings/email/templates/[id]/page.tsx` — Migrate remaining instances
- [x] 3.10 `src/app/(dashboard)/settings/webhooks/page.tsx` — Migrate ~62 class instances
- [x] 3.11 `src/app/(dashboard)/settings/api/page.tsx` — Migrate ~52 class instances
- [x] 3.12 `src/app/(dashboard)/settings/payment-methods/page.tsx` — Migrate ~30 class instances
- [x] 3.13 `src/app/(dashboard)/settings/locations/page.tsx` — Migrate ~62 class instances
- [x] 3.14 `src/app/(dashboard)/settings/lead-statuses/page.tsx` — Migrate ~51 class instances

## 4. Dashboard Structural Components

- [x] 4.1 `src/components/dashboard/sidebar.tsx` — Migrate ~12 class instances
- [x] 4.2 `src/components/dashboard/sidebar-nav.tsx` — Migrate ~8 class instances
- [x] 4.3 `src/components/dashboard/header.tsx` — Migrate ~27 class instances
- [x] 4.4 `src/components/dashboard/stats-card.tsx` — Migrate ~2 class instances

## 5. Verification

- [x] 5.1 Run `pnpm lint` — zero errors
- [x] 5.2 Run `pnpm build` — zero errors
- [x] 5.3 Verify dashboard dark mode unchanged (spot-check 5 key pages)
- [x] 5.4 Toggle dashboard to light mode — verify no dark islands in any migrated file
