## 1. Database Schema & Migrations

- [x] 1.1 Add `OrganizationSetting` model to `prisma/schema.prisma` with fields: id, organizationId (unique), smtpEnabled, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpSecure, createdAt, updatedAt
- [x] 1.2 Add `EmailTemplate` model to `prisma/schema.prisma` with fields: id, organizationId, name, subject, bodyHtml, category, isDefault, createdAt, updatedAt — with @@unique([organizationId, name])
- [x] 1.3 Run `pnpm db:generate` and `pnpm db:migrate` to apply schema changes
- [x] 1.4 Add TypeScript interfaces for `OrganizationSetting` and `EmailTemplate` to `src/types/index.ts`
- [x] 1.5 Add `ENCRYPTION_KEY` to `.env` with a placeholder comment

## 2. Email Library — Core Utilities

- [x] 2.1 Create `src/lib/email/encrypt.ts` with `encrypt(text: string): string` and `decrypt(encrypted: string): string` using AES-256-CBC with key from `ENCRYPTION_KEY` env var
- [x] 2.2 Create `src/lib/email/transporter.ts` with a `createTransport(settings)` function that returns a Nodemailer transporter, configured lazily (not on module load)
- [x] 2.3 Create `src/lib/email/renderer.ts` with `renderTemplate(template, variables)` that replaces `{{var}}` placeholders with HTML-escaped values
- [x] 2.4 Create `src/lib/email/templates.ts` with built-in default templates for `appointment-confirmed`, `lead-notification`, and `client-welcome` — each with subject and bodyHtml using {{var}} placeholders
- [x] 2.5 Create `src/lib/email/send.ts` with `sendEmail(eventType, data)` function that: checks smtpEnabled, loads template (DB first, fallback to built-in), renders, sends via Nodemailer, and returns success/error. Timeout of 10s.
- [x] 2.6 Install `nodemailer` and `@types/nodemailer`

## 3. Backend — Server Actions

- [x] 3.1 Create `src/actions/email.ts` with:
  - `getOrganizationSettings()` — fetch SMTP config (mask password)
  - `updateOrganizationSettings(data)` — save SMTP config (encrypt password)
  - `testSmtpConnection()` — test SMTP connectivity with saved settings
  - `getEmailTemplates()` — list all templates
  - `getEmailTemplate(id)` — get single template
  - `updateEmailTemplate(id, data)` — update subject/bodyHtml
  - `previewTemplate(id)` — render template with sample data server-side
- [x] 3.2 Add Zod schemas for SMTP config validation and template update validation

## 4. Frontend — SMTP Config Component

- [x] 4.1 Create `src/components/email/smtp-config-form.tsx` with form fields: enable/disable switch, host, port, user, password (masked), from address, secure toggle, and save button
- [x] 4.2 Add "Test Connection" button that calls `testSmtpConnection()` and shows success/error toast
- [x] 4.3 Password field shows "••••••" when loaded, allows re-entry to change

## 5. Frontend — Template Components

- [x] 5.1 Create `src/components/email/template-list.tsx` displaying templates grouped by category (appointment, lead, client) with name, subject preview, last updated
- [x] 5.2 Create `src/components/email/template-preview.tsx` rendering HTML in an iframe with `srcdoc`, accepting rendered HTML string
- [x] 5.3 Create `src/components/email/template-editor.tsx` with: subject input, HTML body textarea (monospace, full-height), and live preview panel side-by-side using debounced auto-render

## 6. Frontend — Settings Pages

- [x] 6.1 Create `src/app/(dashboard)/settings/email/page.tsx` combining SMTP config form at top and template list below, with "Edit" links to individual template editor
- [x] 6.2 Create `src/app/(dashboard)/settings/email/templates/[id]/page.tsx` with template editor + preview, back navigation to email settings
- [x] 6.3 Modify `src/app/(dashboard)/settings/layout.tsx` — add "Email" nav item with `Mail` icon between "Locations" and "Webhooks"

## 7. Triggers — Integrate Email into Server Actions

- [x] 7.1 Modify `src/actions/appointments.ts` — in `createAppointment()`, after successful creation, call `sendEmail("appointment-confirmed", ...)` with client and appointment data
- [x] 7.2 Modify `src/actions/forms.ts` — in `submitFormEntry()`, after successful lead creation, call `sendEmail("lead-notification", ...)` with lead data
- [x] 7.3 Modify `src/actions/client-registration.ts` — after successful client registration, call `sendEmail("client-welcome", ...)` with client data and login URL

## 8. Tests & Validation

- [x] 8.1 Write unit tests for `src/lib/email/encrypt.ts` (encrypt then decrypt returns original)
- [x] 8.2 Write unit tests for `src/lib/email/renderer.ts` (var replacement, HTML escaping, unknown vars)
- [x] 8.3 Write unit tests for `src/lib/email/templates.ts` (all templates have required variables)
- [x] 8.4 Write unit tests for `src/lib/email/send.ts` (skips when disabled, loads template, handles errors gracefully)
- [x] 8.5 Run full validation: `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test:unit`
