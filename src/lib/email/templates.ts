export interface EmailTemplateDefinition {
  name: string
  category: "appointment" | "lead" | "client"
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
}
