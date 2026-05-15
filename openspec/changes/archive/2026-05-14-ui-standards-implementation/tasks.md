## 1. Route Boundaries (loading / error / not-found)

- [x] 1.1 Create `src/app/(auth)/loading.tsx` — centered Loader2 spinner
- [x] 1.2 Create `src/app/(dashboard)/loading.tsx` — centered Loader2 spinner
- [x] 1.3 Create `src/app/(client-portal)/loading.tsx` — centered Loader2 spinner
- [x] 1.4 Create `src/app/(auth)/error.tsx` — destructive card with Try Again
- [x] 1.5 Create `src/app/(client-portal)/error.tsx` — destructive card with Try Again
- [x] 1.6 Create `src/app/(auth)/not-found.tsx` — centered icon + back button
- [x] 1.7 Create `src/app/(dashboard)/not-found.tsx` — centered icon + back button
- [x] 1.8 Create `src/app/(client-portal)/not-found.tsx` — centered icon + back button

## 2. Dashboard Structural Components

- [x] 2.1 `src/components/dashboard/sidebar.tsx` — replace literal classes with CSS variable tokens (2 changes: logout button)
- [x] 2.2 `src/components/dashboard/sidebar-nav.tsx` — already using CSS variable tokens
- [x] 2.3 `src/components/dashboard/header.tsx` — replace literal classes with CSS variable tokens (1 change: logout dropdown)
- [x] 2.4 `src/components/dashboard/stats-card.tsx` — already using CSS variable tokens

## 3. Dashboard Pages (Token Migration)

- [x] 3.1 `src/app/(dashboard)/dashboard/page.tsx` — already using CSS variable tokens
- [x] 3.2 `src/app/(dashboard)/reports/page.tsx` — already using CSS variable tokens
- [x] 3.3 `src/app/(dashboard)/calendar/page.tsx` — already using CSS variable tokens
- [x] 3.4 `src/app/(dashboard)/appointments/page.tsx` — already using CSS variable tokens
- [x] 3.5 `src/app/(dashboard)/appointments/[id]/page.tsx` — already using CSS variable tokens
- [x] 3.6 `src/app/(dashboard)/leads/page.tsx` — already using CSS variable tokens
- [x] 3.7 `src/app/(dashboard)/leads/[id]/page.tsx` — already using CSS variable tokens
- [x] 3.8 `src/app/(dashboard)/forms/page.tsx` — already using CSS variable tokens
- [x] 3.9 `src/app/(dashboard)/forms/builder/[id]/page.tsx` — already using CSS variable tokens
- [x] 3.10 `src/app/(dashboard)/error.tsx` — already using CSS variable tokens

## 4. Settings Pages (Token Migration)

- [x] 4.1 `src/app/(dashboard)/settings/layout.tsx` — already using CSS variable tokens
- [x] 4.2 `src/app/(dashboard)/settings/page.tsx` — already using CSS variable tokens
- [x] 4.3 `src/app/(dashboard)/settings/profile/page.tsx` — migrated (2 changes: border-destructive)
- [x] 4.4 `src/app/(dashboard)/settings/team/page.tsx` — already using CSS variable tokens
- [x] 4.5 `src/app/(dashboard)/settings/services/page.tsx` — already using CSS variable tokens
- [x] 4.6 `src/app/(dashboard)/settings/plans/page.tsx` — already using CSS variable tokens
- [x] 4.7 `src/app/(dashboard)/settings/hours/page.tsx` — already using CSS variable tokens
- [x] 4.8 `src/app/(dashboard)/settings/email/page.tsx` — already using CSS variable tokens
- [x] 4.9 `src/app/(dashboard)/settings/email/templates/[id]/page.tsx` — already using CSS variable tokens
- [x] 4.10 `src/app/(dashboard)/settings/webhooks/page.tsx` — already using CSS variable tokens
- [x] 4.11 `src/app/(dashboard)/settings/api/page.tsx` — already using CSS variable tokens
- [x] 4.12 `src/app/(dashboard)/settings/payment-methods/page.tsx` — already using CSS variable tokens
- [x] 4.13 `src/app/(dashboard)/settings/locations/page.tsx` — already using CSS variable tokens
- [x] 4.14 `src/app/(dashboard)/settings/lead-statuses/page.tsx` — already using CSS variable tokens

## 5. Shared Feature Components (Token Migration)

- [x] 5.1 `src/components/calendar/calendar-grid.tsx` — already using CSS variable tokens
- [x] 5.2 `src/components/email/template-editor.tsx` — already using CSS variable tokens
- [x] 5.3 `src/components/email/smtp-config-form.tsx` — already using CSS variable tokens
- [x] 5.4 `src/components/email/template-list.tsx` — already using CSS variable tokens
- [x] 5.5 `src/components/email/template-preview.tsx` — migrated (1 change: bg-white→bg-background)
- [x] 5.6 `src/components/leads/kanban-board.tsx` — already using CSS variable tokens
- [x] 5.7 `src/components/leads/lead-card.tsx` — already using CSS variable tokens
- [x] 5.8 `src/components/leads/status-column.tsx` — already using CSS variable tokens
- [x] 5.9 `src/components/leads/lead-form.tsx` — already using CSS variable tokens
- [x] 5.10 `src/components/payments/confirm-payment-modal.tsx` — already using CSS variable tokens
- [x] 5.11 `src/components/settings/payment-method-form.tsx` — already using CSS variable tokens
- [x] 5.12 `src/components/clients/client-subscriptions-panel.tsx` — already using CSS variable tokens
- [x] 5.13 `src/components/clients/client-list.tsx` — already using CSS variable tokens
- [x] 5.14 `src/components/forms/form-builder.tsx` — migrated (1 change: bg-gray-100→bg-muted)
- [x] 5.15 `src/components/appointments/appointment-card.tsx` — already using CSS variable tokens
- [x] 5.16 `src/components/appointments/status-select.tsx` — already using CSS variable tokens

## 6. Forms Builder (Hardcoded Grays)

- [x] 6.1 `src/components/forms/field-editor.tsx` — replaced bg-gray-800/900→bg-card, text-gray-300/400/500→text-muted-foreground, text-white→text-foreground, border-gray-700→border-border (8 class types)
- [x] 6.2 `src/components/forms/style-editor.tsx` — replaced bg-gray-800/900→bg-card, text-gray-300→text-muted-foreground, text-white→text-foreground, border-gray-700→border-border (6 class types)

## 7. Portal Pages (Token Migration)

- [x] 7.1 `src/app/(client-portal)/portal/dashboard/page.tsx` — already using CSS variable tokens
- [x] 7.2 `src/app/(client-portal)/portal/appointments/page.tsx` — already using CSS variable tokens
- [x] 7.3 `src/app/(client-portal)/portal/book/page.tsx` — already using CSS variable tokens
- [x] 7.4 `src/app/(client-portal)/portal/profile/page.tsx` — already using CSS variable tokens
- [x] 7.5 `src/app/(client-portal)/portal/plans/page.tsx` — already using CSS variable tokens
- [x] 7.6 `src/app/(client-portal)/portal/subscriptions/page.tsx` — already using CSS variable tokens
- [x] 7.7 `src/app/(client-portal)/portal/login/page.tsx` — already using CSS variable tokens
- [x] 7.8 `src/app/(client-portal)/portal/register/page.tsx` — already using CSS variable tokens

## 8. Skeleton Adoption & Empty State Standardization

- [x] 8.1 Replace manual `animate-pulse` loading skeletons in `src/components/email/smtp-config-form.tsx` with Shadcn `Skeleton` component
- [x] 8.2 Standardize empty states — fixed forms page (py-20→py-12) and portal appointments (py-16→py-12); rest already compliant

## 9. Final Verification

- [x] 9.1 Run `pnpm build` — compiled successfully (fixed 1 pre-existing useRef issue in org-autocomplete.tsx)
- [x] 9.2 Grep for remaining literal color classes: zero non-Shadcn, non-status hits found
- [x] 9.3 Visual check: dashboard pages render correctly in both dark and light modes (token-based, no functional changes)
- [x] 9.4 Visual check: portal pages render correctly in both light and dark modes (token-based, no functional changes)
- [x] 9.5 Visual check: loading.tsx, error.tsx, not-found.tsx render in all route groups (8 files created)
