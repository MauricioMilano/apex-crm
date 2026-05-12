/**
 * Replaces {{var}} placeholders with HTML-escaped values.
 * Unknown variables are replaced with empty string.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName: string) => {
    const value = variables[varName]
    if (value === undefined) return ""
    return escapeHtml(value)
  })
}

/**
 * Escapes HTML special characters to prevent injection via template variables.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/** Sample data for previewing each template category */
export const sampleVariables: Record<string, Record<string, string>> = {
  "appointment-confirmed": {
    clientName: "John Doe",
    date: "June 15, 2026",
    time: "2:00 PM",
    serviceName: "Haircut Premium",
    employeeName: "Jane Smith",
    locationName: "Main Office",
    orgName: "Apex Business Solutions",
  },
  "appointment-cancelled": {
    clientName: "John Doe",
    serviceName: "Haircut Premium",
    date: "June 15, 2026",
    time: "2:00 PM",
    reason: "Staff unavailable",
    orgName: "Apex Business Solutions",
  },
  "appointment-rescheduled": {
    clientName: "John Doe",
    serviceName: "Haircut Premium",
    oldDate: "June 15, 2026",
    oldTime: "2:00 PM",
    newDate: "June 17, 2026",
    newTime: "10:00 AM",
    employeeName: "Jane Smith",
    orgName: "Apex Business Solutions",
  },
  "appointment-reminder": {
    clientName: "John Doe",
    serviceName: "Haircut Premium",
    date: "June 15, 2026",
    time: "2:00 PM",
    employeeName: "Jane Smith",
    locationName: "Main Office",
    orgName: "Apex Business Solutions",
  },
  "appointment-completed": {
    clientName: "John Doe",
    serviceName: "Haircut Premium",
    date: "June 15, 2026",
    employeeName: "Jane Smith",
    orgName: "Apex Business Solutions",
    feedbackUrl: "http://localhost:3001/portal/feedback/abc123",
  },
  "appointment-no-show": {
    clientName: "John Doe",
    serviceName: "Haircut Premium",
    date: "June 15, 2026",
    time: "2:00 PM",
    orgName: "Apex Business Solutions",
  },
  "lead-notification": {
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@example.com",
    phone: "(555) 123-4567",
    company: "Tech Corp",
    service: "Consulting",
    orgName: "Apex Business Solutions",
  },
  "lead-assigned": {
    employeeName: "Jane Smith",
    leadName: "Alice Johnson",
    email: "alice@example.com",
    phone: "(555) 123-4567",
    company: "Tech Corp",
    source: "Website Form",
    orgName: "Apex Business Solutions",
  },
  "lead-converted": {
    clientName: "Alice Johnson",
    email: "alice@example.com",
    orgName: "Apex Business Solutions",
    loginUrl: "http://localhost:3001/portal/login",
  },
  "lead-status-changed": {
    leadName: "Alice Johnson",
    oldStatus: "New",
    newStatus: "Qualified",
    orgName: "Apex Business Solutions",
  },
  "client-welcome": {
    clientName: "Bob Williams",
    email: "bob@example.com",
    orgName: "Apex Business Solutions",
    loginUrl: "http://localhost:3001/portal/login",
  },
  "client-welcome-admin": {
    clientName: "Bob Williams",
    email: "bob@example.com",
    orgName: "Apex Business Solutions",
    loginUrl: "http://localhost:3001/portal/login",
    adminName: "Sarah Admin",
  },
  "client-assigned": {
    employeeName: "Jane Smith",
    clientName: "Bob Williams",
    email: "bob@example.com",
    phone: "(555) 987-6543",
    orgName: "Apex Business Solutions",
  },
  "subscription-activated": {
    clientName: "Bob Williams",
    planName: "Premium Monthly",
    price: "99.00",
    billingPeriod: "month",
    startDate: "June 1, 2026",
    orgName: "Apex Business Solutions",
  },
  "subscription-cancelled": {
    clientName: "Bob Williams",
    planName: "Premium Monthly",
    endDate: "July 1, 2026",
    orgName: "Apex Business Solutions",
  },
  "subscription-expired": {
    clientName: "Bob Williams",
    planName: "Premium Monthly",
    orgName: "Apex Business Solutions",
  },
  "subscription-expiring-soon": {
    clientName: "Bob Williams",
    planName: "Premium Monthly",
    expiryDate: "July 1, 2026",
    orgName: "Apex Business Solutions",
  },
  "subscription-renewed": {
    clientName: "Bob Williams",
    planName: "Premium Monthly",
    newPeriodStart: "July 1, 2026",
    newPeriodEnd: "July 31, 2026",
    orgName: "Apex Business Solutions",
  },
  "subscription-limit-warning": {
    clientName: "Bob Williams",
    planName: "Premium Monthly",
    used: "8",
    max: "10",
    remaining: "2",
    orgName: "Apex Business Solutions",
  },
  "team-invite": {
    invitedName: "Charlie New",
    email: "charlie@example.com",
    tempPassword: "Temp@123456",
    orgName: "Apex Business Solutions",
    invitedBy: "Sarah Admin",
    loginUrl: "http://localhost:3001/login",
  },
  "welcome-admin": {
    adminName: "Sarah Admin",
    email: "sarah@example.com",
    orgName: "My Company",
    loginUrl: "http://localhost:3001/login",
    setupUrl: "http://localhost:3001/settings",
  },
  "password-reset": {
    userName: "John Doe",
    resetUrl: "http://localhost:3001/reset-password?token=abc123",
    orgName: "Apex Business Solutions",
  },
  "email-verification": {
    userName: "John Doe",
    verifyUrl: "http://localhost:3001/verify-email?token=abc123",
    orgName: "Apex Business Solutions",
  },
  "magic-link": {
    userName: "John Doe",
    magicLinkUrl: "http://localhost:3001/magic-login?token=abc123",
    orgName: "Apex Business Solutions",
  },
}
