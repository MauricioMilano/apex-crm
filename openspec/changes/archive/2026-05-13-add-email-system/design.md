## Context

The Apex CRM currently has zero email infrastructure. Email addresses exist only as contact data on leads, clients, and users. There is no mail transport, no templates, no notification system.

The existing architecture uses:
- **PostgreSQL** via Prisma 6 — single-org mode (`DEFAULT_ORG_ID`)
- **Server Actions** (`src/actions/`) for all mutations
- **Shadcn/UI** for components, `lucide-react` for icons
- **Zod** for input validation at action boundaries
- **Sonner** for toast notifications

This design adds a complete email subsystem as a new cross-cutting capability.

## Goals / Non-Goals

**Goals:**
- Allow admin to configure SMTP settings via the settings panel (host, port, user, encrypted password, from address)
- Allow admin to enable/disable email sending globally
- Allow admin to edit email templates with {{var}} placeholders and see live preview
- Send appointment confirmation emails when appointments are created
- Send lead notification emails when leads are submitted via forms
- Send client welcome emails when clients register via portal
- Store SMTP password encrypted at rest (AES-256-CBC)
- All sending is synchronous within Server Actions

**Non-Goals:**
- Scheduled/reminder emails (future concern)
- Email delivery tracking (open rates, bounce handling)
- Multi-org isolation (single-org today with DEFAULT_ORG_ID)
- File attachments in emails
- Email queue/retry mechanism
- Webhook-style email events

## Decisions

### 1. SMTP password storage: AES-256-CBC in DB

| Alternative | Verdict |
|---|---|
| `.env` only | Rejected — admin cannot configure via UI, requires deploy |
| Plain text in DB | Rejected — security concern, sensitive credential |
| **AES-256-CBC with key from `.env`** | **Chosen** — admin can CRUD via UI, password is encrypted at rest, key is outside DB |

Encryption key comes from `ENCRYPTION_KEY` env var (32 bytes, hex-encoded). The `crypto` module (built-in) handles encrypt/decrypt in `src/lib/email/encrypt.ts`.

### 2. Email library: Nodemailer

| Alternative | Verdict |
|---|---|
| Resend API | Rejected — vendor lock-in, HTTP-only, no SMTP fallback |
| SendGrid SDK | Rejected — vendor lock-in |
| **Nodemailer** | **Chosen** — works with any SMTP server, mature, well-maintained, no vendor dependency |

### 3. Template engine: {{var}} string replacement

| Alternative | Verdict |
|---|---|
| Handlebars | Rejected — powerful but risky if user-editable templates allow arbitrary logic |
| JSX templates | Rejected — couples templates to React runtime |
| **String replace with `{{var}}`** | **Chosen** — simple, safe, no injection risk. HTML-escape all variable values before insertion. |

### 4. Model: Separate `OrganizationSetting` table vs. JSON column on Organization

| Alternative | Verdict |
|---|---|
| JSON column on `Organization` | Rejected — no type safety at DB level, harder to query, pollutes model |
| **Separate `OrganizationSetting` table** | **Chosen** — clean separation, type-safe, can extend without modifying Organization model |

### 5. Model: Separate `EmailTemplate` table

| Alternative | Verdict |
|---|---|
| Hardcoded templates in source | Rejected — admin cannot customize without redeploy |
| **`EmailTemplate` table** | **Chosen** — admin editable, per-organization, with fallback to built-in defaults |

### 6. Trigger pattern: Direct call at end of Server Action

| Alternative | Verdict |
|---|---|
| Event emitter / hook system | Rejected — over-engineering for current needs, adds indirection |
| **Direct `await sendEmail()` call** | **Chosen** — explicit, easy to trace, matches existing action patterns |

### 7. Preview: Server-side rendered HTML in sandboxed iframe

Preview renders the template locally using the same `renderTemplate()` function with sample data. The output is displayed in an iframe with `srcdoc` attribute (no network request, no XSS risk).

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  Server Actions                    │
│                                                    │
│  createAppointment() ──┐                          │
│                        │                          │
│  submitFormEntry() ────┤──► sendEmail(event,      │
│                        │      data)                │
│  registerClient() ─────┘        │                  │
│                                  │                  │
│                      ┌───────────┴──────────┐      │
│                      │   sendEmail(event)     │      │
│                      │   src/lib/email/send.ts│      │
│                      │                        │      │
│                      │   1. Check smtpEnabled │      │
│                      │   2. Load template     │      │
│                      │   3. Render {{var}}    │      │
│                      │   4. Send via transport│      │
│                      │   5. Return            │      │
│                      └───────────┬────────────┘      │
└──────────────────────────────────┼───────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────┐
│               src/lib/email/                       │
│                                                    │
│  encrypt.ts      ← AES-256 encrypt/decrypt         │
│  transporter.ts  ← Nodemailer createTransport()     │
│  renderer.ts     ← {{var}} → value replacement      │
│  templates.ts    ← Built-in default templates       │
│  send.ts         ← Orchestrator (steps 1-5 above)  │
└──────────────────────────────────────────────────┘
```

## Data Models

### OrganizationSetting
```
id              String   @id @default(cuid())
organizationId  String   @unique
smtpEnabled     Boolean  @default(false)
smtpHost        String?
smtpPort        Int?     @default(587)
smtpUser        String?
smtpPass        String?   ← AES-256 encrypted
smtpFrom        String?
smtpSecure      Boolean  @default(false)
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
```

### EmailTemplate
```
id              String   @id @default(cuid())
organizationId  String
name            String   ← slug: "appointment-confirmed", "lead-notification", "client-welcome"
subject         String   ← with {{var}} placeholders
bodyHtml        String   ← HTML with {{var}} placeholders
category        String   ← "appointment" | "lead" | "client"
isDefault       Boolean  @default(false)
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt

@@unique([organizationId, name])
```

## Template Variables

| Template | Variables |
|---|---|
| `appointment-confirmed` | `{{clientName}}`, `{{date}}`, `{{time}}`, `{{serviceName}}`, `{{employeeName}}`, `{{locationName}}`, `{{orgName}}` |
| `lead-notification` | `{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{phone}}`, `{{company}}`, `{{service}}`, `{{orgName}}` |
| `client-welcome` | `{{clientName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}` |

## Default Templates (built-in fallbacks)

Built-in templates in `src/lib/email/templates.ts` serve as:
1. **Initial seed** — inserted into DB on first access for each org
2. **Fallback** — used if no custom template exists in DB for that name

## Security

1. **SMTP password**: AES-256-CBC encrypted using `ENCRYPTION_KEY` from env
2. **Password never exposed**: GET endpoint returns `"••••••"` placeholder; only used internally after decryption
3. **HTML escaping**: All `{{var}}` values are HTML-escaped before insertion into `bodyHtml`
4. **Preview safety**: Preview rendered via `srcdoc` iframe, no network request, same-origin isolation
5. **Validation**: Zod schemas validate all SMTP config and template inputs at action boundary

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **Blocked SMTP**: Invalid credentials lock admin out of sending | Test-connection button before save; clear error messages |
| **Encryption key lost**: Cannot decrypt stored passwords | Log warning on startup if `ENCRYPTION_KEY` is missing; admin can re-enter password |
| **Template injection**: Malicious {{var}} values | HTML-escape all variable output |
| **Slow SMTP**: Synchronous send blocks action response | Timeout of 10s on Nodemailer; action still returns success even if email fails (non-blocking to user) |
| **Sensitive data in logs**: SMTP credentials in error logs | Strip password from error objects before logging |

## Files to Create / Modify

### New Files
- `prisma/schema.prisma` — add OrganizationSetting, EmailTemplate models
- `src/lib/email/encrypt.ts`
- `src/lib/email/transporter.ts`
- `src/lib/email/renderer.ts`
- `src/lib/email/templates.ts`
- `src/lib/email/send.ts`
- `src/actions/email.ts` — CRUD settings + templates, test connection
- `src/components/email/smtp-config-form.tsx`
- `src/components/email/template-list.tsx`
- `src/components/email/template-editor.tsx`
- `src/components/email/template-preview.tsx`
- `src/app/(dashboard)/settings/email/page.tsx`
- `src/app/(dashboard)/settings/email/templates/[id]/page.tsx`

### Modified Files
- `src/app/(dashboard)/settings/layout.tsx` — add "Email" nav item
- `src/actions/appointments.ts` — add sendEmail trigger
- `src/actions/forms.ts` — add sendEmail trigger
- `src/actions/client-registration.ts` — add sendEmail trigger
- `src/types/index.ts` — add TypeScript interfaces
- `.env` — add ENCRYPTION_KEY

## Open Questions

*None resolved during exploration — all design decisions made.*
