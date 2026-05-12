## 1. Database — EmailSchedule Model

- [x] 1.1 Add `EmailSchedule` model to `prisma/schema.prisma` with fields: id, organizationId, templateName, to (String), variables (Json), scheduledFor (DateTime), sentAt (DateTime?), referenceType (String?), referenceId (String?), createdAt (DateTime)
- [x] 1.2 Run `pnpm db:generate` and `pnpm db:migrate` to apply the new model
- [x] 1.3 Add TypeScript interface for `EmailSchedule` to `src/types/index.ts`

## 2. Email Library — 20 New Built-in Templates

- [x] 2.1 Add `appointment-cancelled` built-in template to `src/lib/email/templates.ts` with category "appointment" and variables: `{{clientName}}`, `{{serviceName}}`, `{{date}}`, `{{time}}`, `{{reason}}`, `{{orgName}}`
- [x] 2.2 Add `appointment-rescheduled` built-in template with variables: `{{clientName}}`, `{{serviceName}}`, `{{oldDate}}`, `{{oldTime}}`, `{{newDate}}`, `{{newTime}}`, `{{employeeName}}`, `{{orgName}}`
- [x] 2.3 Add `appointment-reminder` built-in template with variables: `{{clientName}}`, `{{serviceName}}`, `{{date}}`, `{{time}}`, `{{employeeName}}`, `{{locationName}}`, `{{orgName}}`
- [x] 2.4 Add `appointment-completed` built-in template with variables: `{{clientName}}`, `{{serviceName}}`, `{{date}}`, `{{employeeName}}`, `{{orgName}}`, `{{feedbackUrl}}`
- [x] 2.5 Add `appointment-no-show` built-in template with variables: `{{clientName}}`, `{{serviceName}}`, `{{date}}`, `{{time}}`, `{{orgName}}`
- [x] 2.6 Add `lead-assigned` built-in template with category "lead" and variables: `{{employeeName}}`, `{{leadName}}`, `{{email}}`, `{{phone}}`, `{{company}}`, `{{source}}`, `{{orgName}}`
- [x] 2.7 Add `lead-converted` built-in template with variables: `{{clientName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}`
- [x] 2.8 Add `lead-status-changed` built-in template with variables: `{{leadName}}`, `{{oldStatus}}`, `{{newStatus}}`, `{{orgName}}`
- [x] 2.9 Add `client-welcome-admin` built-in template with category "client" and variables: `{{clientName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}`, `{{adminName}}`
- [x] 2.10 Add `client-assigned` built-in template with variables: `{{employeeName}}`, `{{clientName}}`, `{{email}}`, `{{phone}}`, `{{orgName}}`
- [x] 2.11 Add `subscription-activated` built-in template with category "subscription" and variables: `{{clientName}}`, `{{planName}}`, `{{price}}`, `{{billingPeriod}}`, `{{startDate}}`, `{{orgName}}`
- [x] 2.12 Add `subscription-cancelled` built-in template with variables: `{{clientName}}`, `{{planName}}`, `{{endDate}}`, `{{orgName}}`
- [x] 2.13 Add `subscription-expired` built-in template with variables: `{{clientName}}`, `{{planName}}`, `{{orgName}}`
- [x] 2.14 Add `subscription-expiring-soon` built-in template with variables: `{{clientName}}`, `{{planName}}`, `{{expiryDate}}`, `{{orgName}}`
- [x] 2.15 Add `subscription-renewed` built-in template with variables: `{{clientName}}`, `{{planName}}`, `{{newPeriodStart}}`, `{{newPeriodEnd}}`, `{{orgName}}`
- [x] 2.16 Add `subscription-limit-warning` built-in template with variables: `{{clientName}}`, `{{planName}}`, `{{used}}`, `{{max}}`, `{{remaining}}`, `{{orgName}}`
- [x] 2.17 Add `team-invite` built-in template with category "team" and variables: `{{invitedName}}`, `{{email}}`, `{{tempPassword}}`, `{{orgName}}`, `{{invitedBy}}`, `{{loginUrl}}`
- [x] 2.18 Add `welcome-admin` built-in template with category "team" and variables: `{{adminName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}`, `{{setupUrl}}`
- [x] 2.19 Add `password-reset` built-in template with category "auth" and variables: `{{userName}}`, `{{resetUrl}}`, `{{orgName}}`
- [x] 2.20 Add `email-verification` built-in template with category "auth" and variables: `{{userName}}`, `{{verifyUrl}}`, `{{orgName}}`
- [x] 2.21 Add `magic-link` built-in template with category "auth" and variables: `{{userName}}`, `{{magicLinkUrl}}`, `{{orgName}}`
- [x] 2.22 Update `templateRequiredVars` record in `templates.ts` with all 23 template variable sets
- [x] 2.23 Add all 20 new template names to `sampleVariables` in `renderer.ts` for preview functionality

## 3. Email Library — Multi-Recipient Support

- [x] 3.1 Extend `SendEmailOptions` interface in `src/lib/email/send.ts`: change `to` to `string | string[]`, add optional `cc?: string[]`
- [x] 3.2 Update `sendEmail()` function to handle `to` as array (join as comma-separated) and add CC header when `cc` is provided
- [x] 3.3 Add recipient deduplication logic (remove duplicates from to + cc combined)

## 4. Email Library — Scheduler

- [x] 4.1 Create `src/lib/email/scheduler.ts` with `scheduleEmail(options)` function that creates an `EmailSchedule` record in the database
- [x] 4.2 Create `src/lib/email/scheduler.ts` with `processScheduledEmails()` function that: queries pending schedules, calls `sendEmail()` for each, marks as sent, returns summary
- [x] 4.3 Create `src/lib/email/scheduler.ts` with `cancelScheduledEmails(referenceType, referenceId)` function that deletes pending schedules by reference
- [x] 4.4 Create `src/lib/email/scheduler.ts` with `cleanupExpiredSchedules()` function that removes old sent/expired records
- [x] 4.5 Create cron endpoint at `src/app/api/cron/email/route.ts` (GET handler) that calls `processScheduledEmails()` and `cleanupExpiredSchedules()`, returns JSON summary

## 5. Backend — Appointment Triggers

- [x] 5.1 Modify `updateAppointmentStatus()` in `src/actions/appointments.ts`: on "cancelled", send `appointment-cancelled` to client/lead (with cancel reason) + cancel any pending reminder schedules
- [x] 5.2 Modify `updateAppointment()` in `src/actions/appointments.ts`: detect if `startTime` changed, send `appointment-rescheduled` to client with old/new times
- [x] 5.3 Modify `updateAppointmentStatus()`: on "completed", send `appointment-completed` to client
- [x] 5.4 Modify `updateAppointmentStatus()`: on "no_show", send `appointment-no-show` to client
- [x] 5.5 Modify `createAppointment()`: after success, schedule `appointment-reminder` for 24h before startTime via `scheduleEmail()`
- [x] 5.6 Modify `createAppointment()`: if appointment uses a subscription with limit, check if usage >= 80% and send `subscription-limit-warning` to client (once per period)

## 6. Backend — Lead Triggers

- [x] 6.1 Modify `createLead()` in `src/actions/leads.ts`: if `assignedTo` is set and not from form, send `lead-assigned` to the assignee; if not from form, send `lead-notification` to org
- [x] 6.2 Modify `updateLead()` in `src/actions/leads.ts`: detect if `assignedTo` changed, send `lead-assigned` to new assignee; detect if `statusId` changed, send `lead-status-changed` to current assignee
- [x] 6.3 Modify `convertLeadToClient()` in `src/actions/leads.ts`: after conversion, send `lead-converted` to lead's email

## 7. Backend — Client Triggers

- [x] 7.1 Modify `createClient()` in `src/actions/clients.ts`: if NOT from lead conversion (no `leadId`), send `client-welcome-admin` to client; if `assignedTo` is set, send `client-assigned` to assignee
- [x] 7.2 Modify `updateClient()` in `src/actions/clients.ts`: detect if `assignedTo` changed and different from previous, send `client-assigned` to new assignee

## 8. Backend — Subscription Triggers

- [x] 8.1 Modify `assignPlan()` in `src/actions/client-subscriptions.ts`: after success, send `subscription-activated` to client
- [x] 8.2 Modify `cancelSubscription()` in `src/actions/client-subscriptions.ts`: after success, send `subscription-cancelled` to client
- [x] 8.3 Modify `renewPeriodIfNeeded()` in `src/actions/client-subscriptions.ts`: when period is renewed, schedule `subscription-renewed` email via `scheduleEmail()`
- [x] 8.4 Add scheduler logic to detect expiring subscriptions: in `processScheduledEmails()` or via a new `checkExpiringSubscriptions()` function that queries subscriptions ending in 7 days and schedules `subscription-expiring-soon`, and marks expired ones sending `subscription-expired`

## 9. Backend — Team & Auth Triggers

- [x] 9.1 Modify `inviteTeamMember()` in `src/actions/settings.ts`: after user creation, return `tempPassword` explicitly and send `team-invite` to invited email; if SMTP is disabled, return warning
- [x] 9.2 Modify `registerUser()` in `src/actions/auth.ts`: after org+user creation, send `welcome-admin` to admin email (fire-and-forget, OK to fail if SMTP not configured)
- [x] 9.3 Create `requestPasswordReset()` action in `src/actions/auth.ts`: generate reset token (expires 1h), store hash on User model, send `password-reset` with reset URL; return success even for unknown emails (anti-enumeration)
- [x] 9.4 Create `resetPassword()` action in `src/actions/auth.ts`: validate reset token, update password hash, clear token
- [x] 9.5 Add `resetToken` and `resetTokenExpires` fields to User model in Prisma schema for password reset flow
- [x] 9.6 Add email verification toggle to `OrganizationSetting` model (optional `emailVerificationEnabled` boolean field)
- [ ] 9.7 Modify `registerClient()` and `registerUser()`: if verification is enabled, generate verification token, send `email-verification` email, create verification record (low priority — skipped to keep tasks focused)
- [ ] 9.8 Create `verifyEmail()` action to confirm email verification token (low priority — skipped to keep tasks focused)
- [ ] 9.9 Implement magic link flow: create `requestMagicLink()` action that sends `magic-link` email with one-time token; create `verifyMagicLink()` action to validate and log in (low priority — skipped to keep tasks focused)

## 10. Frontend — Template Categories

- [x] 10.1 Modify `src/components/email/template-list.tsx`: add "subscription" (Package icon), "team" (Users icon), "auth" (Shield icon) category groups alongside existing appointment, lead, client
- [x] 10.2 Ensure all 23 templates appear correctly grouped in the email settings page

## 11. Tests & Validation

- [x] 11.1 Write unit tests for all 20 new built-in templates: verify all required variables are present in template strings
- [ ] 11.2 Write unit tests for multi-recipient `sendEmail()`: array to, CC, deduplication (skipped — relies on Nodemailer)
- [ ] 11.3 Write unit tests for scheduler: `scheduleEmail()` creates record, `processScheduledEmails()` sends pending, `cancelScheduledEmails()` deletes by reference (skipped — relies on Prisma)
- [x] 11.4 Run full validation: `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test:unit
