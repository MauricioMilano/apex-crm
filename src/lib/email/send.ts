import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/email/encrypt"
import { createTransport } from "@/lib/email/transporter"
import { renderTemplate } from "@/lib/email/renderer"
import { getDefaultTemplate } from "@/lib/email/templates"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

export interface SendEmailOptions {
  /** Template name (e.g. "appointment-confirmed") */
  templateName: string
  /** Recipient email address(es) */
  to: string | string[]
  /** Optional CC recipients */
  cc?: string[]
  /** Variables to inject into the template */
  variables: Record<string, string>
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Sends an email using the configured SMTP settings.
 *
 * Flow:
 * 1. Check if SMTP is enabled for the organization
 * 2. Load the template (custom from DB, or built-in fallback)
 * 3. Render subject and body with {{var}} replacement
 * 4. Send via Nodemailer transport
 * 5. Return result (errors are caught and returned, never thrown)
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    // 1. Load org settings and check if SMTP is enabled
    const settings = await prisma.organizationSetting.findUnique({
      where: { organizationId: ORG_ID },
    })

    if (!settings || !settings.smtpEnabled) {
      return { success: false, error: "SMTP is not enabled" }
    }

    if (!settings.smtpHost || !settings.smtpFrom) {
      return { success: false, error: "SMTP host or from address not configured" }
    }

    // 2. Load template (DB first, fallback to built-in)
    const dbTemplate = await prisma.emailTemplate.findUnique({
      where: {
        organizationId_name: {
          organizationId: ORG_ID,
          name: options.templateName,
        },
      },
    })

    const subject = dbTemplate?.subject ?? getDefaultTemplate(options.templateName)?.subject
    const bodyHtml = dbTemplate?.bodyHtml ?? getDefaultTemplate(options.templateName)?.bodyHtml

    if (!subject || !bodyHtml) {
      return {
        success: false,
        error: `Template "${options.templateName}" not found in DB or defaults`,
      }
    }

    // 3. Render template
    const renderedSubject = renderTemplate(subject, options.variables)
    const renderedBody = renderTemplate(bodyHtml, options.variables)

    // 4. Decrypt SMTP password and create transport
    const smtpPass = settings.smtpPass ? decrypt(settings.smtpPass) : undefined

    const transporter = createTransport({
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpPass: smtpPass ?? null,
      smtpSecure: settings.smtpSecure,
    })

    // 5. Prepare recipients with deduplication
    const toList = Array.isArray(options.to) ? options.to : [options.to]
    const ccList = options.cc ?? []
    const uniqueTo = [...new Set(toList)]
    const uniqueCc = [...new Set(ccList.filter((addr) => !toList.includes(addr)))]

    // 5. Send
    const info = await transporter.sendMail({
      from: settings.smtpFrom,
      to: uniqueTo.join(", "),
      cc: uniqueCc.length > 0 ? uniqueCc.join(", ") : undefined,
      subject: renderedSubject,
      html: renderedBody,
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Tests the SMTP connection with the saved settings.
 * Sends a test email to the specified address.
 */
export async function testSmtpConnection(to?: string): Promise<SendEmailResult> {
  try {
    const settings = await prisma.organizationSetting.findUnique({
      where: { organizationId: ORG_ID },
    })

    if (!settings || !settings.smtpHost) {
      return { success: false, error: "SMTP not configured" }
    }

    const smtpPass = settings.smtpPass ? decrypt(settings.smtpPass) : undefined

    const transporter = createTransport({
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpPass: smtpPass ?? null,
      smtpSecure: settings.smtpSecure,
    })

    // Verify connection config
    await transporter.verify()

    // Optionally send a test email
    if (to) {
      await transporter.sendMail({
        from: settings.smtpFrom ?? undefined,
        to,
        subject: "Test Email from Apex CRM",
        text: "This is a test email to verify your SMTP configuration.",
      })
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
