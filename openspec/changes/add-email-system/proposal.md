## Why

The Apex CRM has no email capability whatsoever. Businesses using the platform cannot send appointment confirmations, lead notifications, or client welcome emails — critical communication workflows that are table stakes for any CRM. This change adds a complete email subsystem: SMTP configuration, editable templates, and triggered sending from core business processes.

## What Changes

- **New Prisma models**: `OrganizationSetting` (SMTP credentials), `EmailTemplate` (editable templates)
- **New settings page** under `/settings/email` — SMTP configuration form with test-connection button
- **New settings page** under `/settings/email/templates/[id]` — template editor with live preview
- **New library** `src/lib/email/` — mail transport (Nodemailer), template renderer ({{var}} replacement), AES-256 encryption for SMTP password
- **New Server Actions** — CRUD for SMTP settings and email templates
- **Modified Server Actions** — `createAppointment`, `createLead`, `createClient` trigger email sending when SMTP is enabled
- **New dependency**: `nodemailer` + `@types/nodemailer`
- **New environment variable**: `ENCRYPTION_KEY` for AES-256 SMTP password encryption
- **New nav item** "Email" in settings sidebar

## Capabilities

### New Capabilities

- `smtp-config`: SMTP server configuration (host, port, credentials, from address) stored in DB per-organization, with enable/disable toggle and test-connection button
- `email-templates`: Editable email templates with {{var}} placeholder system, per-organization storage, live preview in the editor, and built-in defaults as fallback
- `email-notifications`: Triggered email dispatch from Server Actions when SMTP is enabled — covering appointment confirmation, lead notification, and client welcome

### Modified Capabilities

*(None — all capabilities are new)*

## Impact

| Area | Impact |
|------|--------|
| **Database** | 2 new models: `OrganizationSetting`, `EmailTemplate` |
| **Backend** | New `src/lib/email/` module, new actions `email.ts`, modified `appointments.ts`, `forms.ts`, `client-registration.ts` |
| **Frontend** | New settings pages, new `src/components/email/` components, modified settings layout |
| **Dependencies** | `nodemailer` added |
| **Environment** | `ENCRYPTION_KEY` required for SMTP password encryption |
| **Configuration** | New `.env` variable, new settings in admin panel |
