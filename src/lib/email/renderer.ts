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
  "lead-notification": {
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@example.com",
    phone: "(555) 123-4567",
    company: "Tech Corp",
    service: "Consulting",
    orgName: "Apex Business Solutions",
  },
  "client-welcome": {
    clientName: "Bob Williams",
    email: "bob@example.com",
    orgName: "Apex Business Solutions",
    loginUrl: "http://localhost:3001/portal/login",
  },
}
