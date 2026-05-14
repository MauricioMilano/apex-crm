## Description

Migrate shared components used in dashboard context from hard-coded dark Tailwind classes to CSS variable tokens.

## Scope

- `src/components/calendar/calendar-grid.tsx` — ~39 instances
- `src/components/email/template-editor.tsx` — ~20 instances
- `src/components/email/smtp-config-form.tsx` — ~41 instances
- `src/components/email/template-list.tsx` — ~8 instances
- `src/components/email/template-preview.tsx` — ~3 instances
- `src/components/leads/kanban-board.tsx` — ~76 instances
- `src/components/leads/lead-card.tsx` — ~40 instances
- `src/components/leads/status-column.tsx` — ~11 instances
- `src/components/leads/lead-form.tsx` — ~57 instances
- `src/components/payments/confirm-payment-modal.tsx` — ~29 instances
- `src/components/settings/payment-method-form.tsx` — ~15 instances
- `src/components/clients/client-subscriptions-panel.tsx` — ~22 instances
- `src/components/clients/client-list.tsx` — ~1 instance
- `src/components/forms/form-builder.tsx` — ~17 instances
- `src/components/appointments/appointment-card.tsx` — ~17 instances
- `src/components/appointments/status-select.tsx` — ~7 instances

## Acceptance

- All shared components render identically in dashboard dark mode
- All shared components render correctly in dashboard light mode
- Components embedded in dashboard pages do not create dark islands
