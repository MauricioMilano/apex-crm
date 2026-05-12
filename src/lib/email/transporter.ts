import nodemailer from "nodemailer"
import type { OrganizationSetting } from "@/types"

let cachedTransport: nodemailer.Transporter | null = null
let cachedSettingsKey: string | null = null

function settingsKey(settings: Pick<OrganizationSetting, "smtpHost" | "smtpPort" | "smtpUser" | "smtpPass">): string {
  return `${settings.smtpHost}:${settings.smtpPort}:${settings.smtpUser}:${settings.smtpPass}`
}

export function createTransport(settings: Pick<OrganizationSetting, "smtpHost" | "smtpPort" | "smtpUser" | "smtpPass" | "smtpSecure">): nodemailer.Transporter {
  const key = settingsKey(settings)

  if (cachedTransport && cachedSettingsKey === key) {
    return cachedTransport
  }

  const transport = nodemailer.createTransport({
    host: settings.smtpHost ?? undefined,
    port: settings.smtpPort ?? 587,
    secure: settings.smtpSecure ?? false,
    auth: settings.smtpUser && settings.smtpPass
      ? { user: settings.smtpUser, pass: settings.smtpPass }
      : undefined,
    connectionTimeout: 10_000,
  })

  cachedTransport = transport
  cachedSettingsKey = key

  return transport
}

export function clearTransportCache(): void {
  cachedTransport = null
  cachedSettingsKey = null
}
