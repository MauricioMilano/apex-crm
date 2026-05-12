export interface EmailTemplateDefinition {
  name: string
  category: "appointment" | "lead" | "client" | "subscription" | "team" | "auth"
  subject: string
  bodyHtml: string
}

/**
 * Built-in default email templates.
 * These are used as fallback when no custom template exists in the database
 * for a given organization and template name.
 */
export const defaultTemplates: EmailTemplateDefinition[] = [
  {
    name: "appointment-confirmed",
    category: "appointment",
    subject: "Confirmed: {{serviceName}} on {{date}} at {{time}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #2563eb; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Appointment Confirmed</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Your appointment has been confirmed. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Service</td><td style="padding: 8px; color: #333; font-weight: 600;">{{serviceName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px; color: #333; font-weight: 600;">{{date}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px; color: #333; font-weight: 600;">{{time}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">With</td><td style="padding: 8px; color: #333; font-weight: 600;">{{employeeName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Location</td><td style="padding: 8px; color: #333; font-weight: 600;">{{locationName}}</td></tr>
      </table>
      <p style="font-size: 14px; color: #999;">If you need to reschedule, please contact us.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "lead-notification",
    category: "lead",
    subject: "New Lead: {{firstName}} {{lastName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #16a34a; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">New Lead Received</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">A new lead has been submitted:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Name</td><td style="padding: 8px; color: #333; font-weight: 600;">{{firstName}} {{lastName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Email</td><td style="padding: 8px; color: #333;">{{email}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Phone</td><td style="padding: 8px; color: #333;">{{phone}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Company</td><td style="padding: 8px; color: #333;">{{company}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Interest</td><td style="padding: 8px; color: #333;">{{service}}</td></tr>
      </table>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "client-welcome",
    category: "client",
    subject: "Welcome to {{orgName}}, {{clientName}}!",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #7c3aed; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Welcome, {{clientName}}!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Welcome to <strong>{{orgName}}</strong>! We're excited to have you on board.</p>
      <p style="font-size: 16px; color: #333;">You can log in to your client portal to book appointments, view your subscriptions, and more.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{loginUrl}}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Access Portal</a>
      </div>
      <p style="font-size: 14px; color: #999;">Your registered email: <strong>{{email}}</strong></p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Appointment: Cancelled ──────────────────────────────────────────────
  {
    name: "appointment-cancelled",
    category: "appointment",
    subject: "Cancelled: {{serviceName}} on {{date}} at {{time}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #dc2626; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Appointment Cancelled</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Your appointment has been cancelled:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Service</td><td style="padding: 8px; color: #333; font-weight: 600;">{{serviceName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px; color: #333; font-weight: 600;">{{date}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px; color: #333; font-weight: 600;">{{time}}</td></tr>
      </table>
      <p style="font-size: 14px; color: #666;"><strong>Reason:</strong> {{reason}}</p>
      <p style="font-size: 14px; color: #999;">If you have any questions, please contact us.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Appointment: Rescheduled ────────────────────────────────────────────
  {
    name: "appointment-rescheduled",
    category: "appointment",
    subject: "Rescheduled: {{serviceName}} moved to {{newDate}} at {{newTime}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #f59e0b; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Appointment Rescheduled</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Your appointment has been rescheduled:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Service</td><td style="padding: 8px; color: #333; font-weight: 600;">{{serviceName}}</td></tr>
        <tr><td style="padding: 8px; color: #999; width: 120px;">Was</td><td style="padding: 8px; color: #333;">{{oldDate}} at {{oldTime}}</td></tr>
        <tr><td style="padding: 8px; color: #666; width: 120px;">Now</td><td style="padding: 8px; color: #333; font-weight: 600;">{{newDate}} at {{newTime}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">With</td><td style="padding: 8px; color: #333; font-weight: 600;">{{employeeName}}</td></tr>
      </table>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Appointment: Reminder ───────────────────────────────────────────────
  {
    name: "appointment-reminder",
    category: "appointment",
    subject: "Reminder: {{serviceName}} tomorrow at {{time}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #2563eb; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Appointment Reminder</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">This is a reminder about your upcoming appointment:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Service</td><td style="padding: 8px; color: #333; font-weight: 600;">{{serviceName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px; color: #333; font-weight: 600;">{{date}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px; color: #333; font-weight: 600;">{{time}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">With</td><td style="padding: 8px; color: #333; font-weight: 600;">{{employeeName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Location</td><td style="padding: 8px; color: #333; font-weight: 600;">{{locationName}}</td></tr>
      </table>
      <p style="font-size: 14px; color: #999;">Please arrive 10 minutes early. To reschedule, contact us in advance.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Appointment: Completed ──────────────────────────────────────────────
  {
    name: "appointment-completed",
    category: "appointment",
    subject: "Thanks for visiting {{orgName}}, {{clientName}}!",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #16a34a; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Thank You!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Thank you for visiting us on <strong>{{date}}</strong> for your <strong>{{serviceName}}</strong> with <strong>{{employeeName}}</strong>.</p>
      <p style="font-size: 16px; color: #333;">We hope you had a great experience!</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{feedbackUrl}}" style="display: inline-block; background: #16a34a; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Share Feedback</a>
      </div>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Appointment: No-Show ────────────────────────────────────────────────
  {
    name: "appointment-no-show",
    category: "appointment",
    subject: "Missed Appointment: {{serviceName}} on {{date}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #dc2626; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Missed Appointment</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">We missed you at your scheduled appointment:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Service</td><td style="padding: 8px; color: #333; font-weight: 600;">{{serviceName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px; color: #333; font-weight: 600;">{{date}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px; color: #333; font-weight: 600;">{{time}}</td></tr>
      </table>
      <p style="font-size: 14px; color: #999;">Please contact us to reschedule. We look forward to serving you!</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Lead: Assigned ──────────────────────────────────────────────────────
  {
    name: "lead-assigned",
    category: "lead",
    subject: "New Lead Assigned: {{leadName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #0891b2; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">New Lead Assigned</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{employeeName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">A new lead has been assigned to you:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Name</td><td style="padding: 8px; color: #333; font-weight: 600;">{{leadName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Email</td><td style="padding: 8px; color: #333;">{{email}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Phone</td><td style="padding: 8px; color: #333;">{{phone}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Company</td><td style="padding: 8px; color: #333;">{{company}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Source</td><td style="padding: 8px; color: #333;">{{source}}</td></tr>
      </table>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Lead: Converted ─────────────────────────────────────────────────────
  {
    name: "lead-converted",
    category: "lead",
    subject: "Welcome to {{orgName}}, {{clientName}}!",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #7c3aed; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Welcome, {{clientName}}!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Great news! You've been upgraded from lead to client at <strong>{{orgName}}</strong>.</p>
      <p style="font-size: 16px; color: #333;">You can now log in to your client portal to book appointments and manage your account.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{loginUrl}}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Access Portal</a>
      </div>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Lead: Status Changed ────────────────────────────────────────────────
  {
    name: "lead-status-changed",
    category: "lead",
    subject: "Lead Updated: {{leadName}} moved to {{newStatus}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #0891b2; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Lead Status Updated</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi,</p>
      <p style="font-size: 16px; color: #333;">The status for <strong>{{leadName}}</strong> has changed:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">From</td><td style="padding: 8px; color: #333;">{{oldStatus}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">To</td><td style="padding: 8px; color: #333; font-weight: 600;">{{newStatus}}</td></tr>
      </table>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Client: Welcome (Manual) ────────────────────────────────────────────
  {
    name: "client-welcome-admin",
    category: "client",
    subject: "Welcome to {{orgName}}, {{clientName}}!",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #7c3aed; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Welcome, {{clientName}}!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Your account has been created at <strong>{{orgName}}</strong> by our team.</p>
      <p style="font-size: 16px; color: #333;">You can log in to your client portal to book appointments, view your subscriptions, and more.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{loginUrl}}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Access Portal</a>
      </div>
      <p style="font-size: 14px; color: #999;">Your registered email: <strong>{{email}}</strong></p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Client: Assigned ────────────────────────────────────────────────────
  {
    name: "client-assigned",
    category: "client",
    subject: "New Client Assigned: {{clientName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #7c3aed; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">New Client Assigned</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{employeeName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">A new client has been assigned to you:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Name</td><td style="padding: 8px; color: #333; font-weight: 600;">{{clientName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Email</td><td style="padding: 8px; color: #333;">{{email}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Phone</td><td style="padding: 8px; color: #333;">{{phone}}</td></tr>
      </table>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Subscription: Activated ─────────────────────────────────────────────
  {
    name: "subscription-activated",
    category: "subscription",
    subject: "Subscription Activated: {{planName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #16a34a; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Subscription Activated!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Your subscription has been activated:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Plan</td><td style="padding: 8px; color: #333; font-weight: 600;">{{planName}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Price</td><td style="padding: 8px; color: #333; font-weight: 600;">&#36;{{price}} / {{billingPeriod}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Start Date</td><td style="padding: 8px; color: #333;">{{startDate}}</td></tr>
      </table>
      <p style="font-size: 14px; color: #999;">You can book appointments included in your plan through the client portal.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Subscription: Cancelled ─────────────────────────────────────────────
  {
    name: "subscription-cancelled",
    category: "subscription",
    subject: "Subscription Cancelled: {{planName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #dc2626; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Subscription Cancelled</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Your <strong>{{planName}}</strong> subscription has been cancelled, effective <strong>{{endDate}}</strong>.</p>
      <p style="font-size: 14px; color: #999;">If you have any questions, please contact us. We'd love to have you back anytime!</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Subscription: Expired ───────────────────────────────────────────────
  {
    name: "subscription-expired",
    category: "subscription",
    subject: "Subscription Expired: {{planName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #f59e0b; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Subscription Expired</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Your <strong>{{planName}}</strong> subscription has expired.</p>
      <p style="font-size: 16px; color: #333;">If you'd like to continue, please contact us to renew or choose a new plan.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Subscription: Expiring Soon ─────────────────────────────────────────
  {
    name: "subscription-expiring-soon",
    category: "subscription",
    subject: "Your {{planName}} subscription expires on {{expiryDate}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #f59e0b; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Subscription Expiring Soon</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Your <strong>{{planName}}</strong> subscription is expiring on <strong>{{expiryDate}}</strong>.</p>
      <p style="font-size: 16px; color: #333;">Contact us to renew and keep enjoying your benefits without interruption.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Subscription: Renewed ───────────────────────────────────────────────
  {
    name: "subscription-renewed",
    category: "subscription",
    subject: "Your {{planName}} subscription has been renewed",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #16a34a; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Subscription Renewed</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Your <strong>{{planName}}</strong> subscription has been renewed!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">New Period</td><td style="padding: 8px; color: #333;">{{newPeriodStart}} to {{newPeriodEnd}}</td></tr>
      </table>
      <p style="font-size: 14px; color: #999;">Your appointments counter has been reset for the new period.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Subscription: Limit Warning ─────────────────────────────────────────
  {
    name: "subscription-limit-warning",
    category: "subscription",
    subject: "You've used {{used}} of {{max}} appointments in {{planName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #f59e0b; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Appointment Limit Warning</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{clientName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">You've used <strong>{{used}}</strong> out of <strong>{{max}}</strong> appointments in your <strong>{{planName}}</strong> plan (only <strong>{{remaining}}</strong> remaining).</p>
      <p style="font-size: 16px; color: #333;">Contact us to upgrade your plan or renew before you run out.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Team: Invite ────────────────────────────────────────────────────────
  {
    name: "team-invite",
    category: "team",
    subject: "You've been invited to {{orgName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #0891b2; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">You're Invited!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{invitedName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">You've been invited to join <strong>{{orgName}}</strong> by <strong>{{invitedBy}}</strong>.</p>
      <p style="font-size: 16px; color: #333;">Use the following credentials to log in:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #666; width: 120px;">Email</td><td style="padding: 8px; color: #333; font-weight: 600;">{{email}}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Temp Password</td><td style="padding: 8px; color: #333; font-family: monospace; font-weight: 600;">{{tempPassword}}</td></tr>
      </table>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{loginUrl}}" style="display: inline-block; background: #0891b2; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Log In Now</a>
      </div>
      <p style="font-size: 14px; color: #999;">Please change your password after logging in.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Team: Welcome Admin ─────────────────────────────────────────────────
  {
    name: "welcome-admin",
    category: "team",
    subject: "Welcome to Apex CRM, {{adminName}}!",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #0891b2; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Welcome to Apex CRM!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{adminName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Welcome to <strong>{{orgName}}</strong>! Your account is all set up.</p>
      <p style="font-size: 16px; color: #333;">Get started by setting up your services, configuring your SMTP email settings, and inviting your team.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{setupUrl}}" style="display: inline-block; background: #0891b2; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Complete Setup</a>
      </div>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Auth: Password Reset ────────────────────────────────────────────────
  {
    name: "password-reset",
    category: "auth",
    subject: "Reset your {{orgName}} password",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #6366f1; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Password Reset</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{userName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">We received a request to reset your password for <strong>{{orgName}}</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{resetUrl}}" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #999;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Auth: Email Verification ────────────────────────────────────────────
  {
    name: "email-verification",
    category: "auth",
    subject: "Verify your email for {{orgName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #6366f1; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Verify Your Email</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{userName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Welcome to <strong>{{orgName}}</strong>! Please verify your email address to activate your account.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{verifyUrl}}" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Verify Email</a>
      </div>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
  // ── Auth: Magic Link ────────────────────────────────────────────────────
  {
    name: "magic-link",
    category: "auth",
    subject: "Your magic login link for {{orgName}}",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <div style="background: #6366f1; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Magic Login Link</h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>{{userName}}</strong>,</p>
      <p style="font-size: 16px; color: #333;">Click the link below to log in to <strong>{{orgName}}</strong> instantly. This link expires in 15 minutes.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{magicLinkUrl}}" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Log In</a>
      </div>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
      &copy; {{orgName}} &mdash; All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
]

/**
 * Returns a specific default template by name, or undefined if not found.
 */
export function getDefaultTemplate(name: string): EmailTemplateDefinition | undefined {
  return defaultTemplates.find((t) => t.name === name)
}

/**
 * All required variables for each template — useful for validation.
 */
export const templateRequiredVars: Record<string, string[]> = {
  "appointment-confirmed": ["clientName", "date", "time", "serviceName", "employeeName", "locationName", "orgName"],
  "lead-notification": ["firstName", "lastName", "email", "phone", "company", "service", "orgName"],
  "client-welcome": ["clientName", "email", "orgName", "loginUrl"],
  "appointment-cancelled": ["clientName", "serviceName", "date", "time", "reason", "orgName"],
  "appointment-rescheduled": ["clientName", "serviceName", "oldDate", "oldTime", "newDate", "newTime", "employeeName", "orgName"],
  "appointment-reminder": ["clientName", "serviceName", "date", "time", "employeeName", "locationName", "orgName"],
  "appointment-completed": ["clientName", "serviceName", "date", "employeeName", "orgName", "feedbackUrl"],
  "appointment-no-show": ["clientName", "serviceName", "date", "time", "orgName"],
  "lead-assigned": ["employeeName", "leadName", "email", "phone", "company", "source", "orgName"],
  "lead-converted": ["clientName", "email", "orgName", "loginUrl"],
  "lead-status-changed": ["leadName", "oldStatus", "newStatus", "orgName"],
  "client-welcome-admin": ["clientName", "email", "orgName", "loginUrl", "adminName"],
  "client-assigned": ["employeeName", "clientName", "email", "phone", "orgName"],
  "subscription-activated": ["clientName", "planName", "price", "billingPeriod", "startDate", "orgName"],
  "subscription-cancelled": ["clientName", "planName", "endDate", "orgName"],
  "subscription-expired": ["clientName", "planName", "orgName"],
  "subscription-expiring-soon": ["clientName", "planName", "expiryDate", "orgName"],
  "subscription-renewed": ["clientName", "planName", "newPeriodStart", "newPeriodEnd", "orgName"],
  "subscription-limit-warning": ["clientName", "planName", "used", "max", "remaining", "orgName"],
  "team-invite": ["invitedName", "email", "tempPassword", "orgName", "invitedBy", "loginUrl"],
  "welcome-admin": ["adminName", "email", "orgName", "loginUrl", "setupUrl"],
  "password-reset": ["userName", "resetUrl", "orgName"],
  "email-verification": ["userName", "verifyUrl", "orgName"],
  "magic-link": ["userName", "magicLinkUrl", "orgName"],
}
