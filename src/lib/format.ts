// ─── Currency Formatting ──────────────────────────────────────────────────────

/**
 * Format a monetary value according to currency and locale.
 * Uses Intl.NumberFormat internally.
 *
 * @param amount  - Numeric value to format
 * @param currency - ISO 4217 currency code (default: "USD")
 * @param locale   - BCP 47 locale tag (default: "en-US")
 *
 * @example
 *   formatCurrency(1500, "USD", "en-US")  → "$1,500.00"
 *   formatCurrency(1500, "BRL", "pt-BR")  → "R$ 1.500,00"
 *   formatCurrency(1500, "JPY", "ja-JP")  → "￥1,500"
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US",
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount)
  } catch {
    // Fallback: if locale or currency is invalid
    return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

export interface FormatDateOptions {
  /** IANA timezone, e.g. "America/Chicago" (default: "UTC") */
  timezone?: string
  /** One of the allowed dateFormat values (default: "MM/DD/YYYY") */
  dateFormat?: string
  /** "12h" or "24h" (default: "12h") */
  timeFormat?: "12h" | "24h"
  /** Whether to include time in the output (default: false) */
  includeTime?: boolean
  /** BCP 47 locale (default: "en-US") */
  locale?: string
}

type DateInput = string | number | Date

/**
 * Map our predefined dateFormat strings to Intl.DateTimeFormat options.
 */
function dateFormatToOptions(fmt: string): Intl.DateTimeFormatOptions {
  switch (fmt) {
    case "MM/DD/YYYY":
      return { year: "numeric", month: "2-digit", day: "2-digit" }
    case "DD/MM/YYYY":
      return { year: "numeric", month: "2-digit", day: "2-digit" }
    case "YYYY-MM-DD":
      return { year: "numeric", month: "2-digit", day: "2-digit" }
    case "MMM D, YYYY":
      return { year: "numeric", month: "short", day: "numeric" }
    default:
      return { year: "numeric", month: "2-digit", day: "2-digit" }
  }
}

function timeFormatToOptions(tf: "12h" | "24h"): Intl.DateTimeFormatOptions {
  return tf === "24h"
    ? { hour: "2-digit", minute: "2-digit", hour12: false }
    : { hour: "numeric", minute: "2-digit", hour12: true }
}

/**
 * Format a date according to organization regional settings.
 * Uses Intl.DateTimeFormat internally for timezone-aware output.
 *
 * @param date    - Date string (ISO), timestamp, or Date object
 * @param options - Formatting options (defaults to org-level standards)
 *
 * @example
 *   formatDate("2025-01-15T14:30:00Z",
 *     { timezone: "America/Chicago", dateFormat: "MM/DD/YYYY" })
 *   → "01/15/2025"
 *
 *   formatDate("2025-01-15T14:30:00Z",
 *     { timezone: "Europe/Berlin", dateFormat: "DD/MM/YYYY",
 *       timeFormat: "24h", includeTime: true })
 *   → "15/01/2025 15:30"
 */
export function formatDate(
  date: DateInput,
  options: FormatDateOptions = {},
): string {
  const {
    timezone = "UTC",
    dateFormat: df = "MM/DD/YYYY",
    timeFormat: tf = "12h",
    includeTime = false,
    locale = "en-US",
  } = options

  try {
    const parsed = typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date

    const dateOptions = dateFormatToOptions(df)

    if (includeTime) {
      const timeOpts = timeFormatToOptions(tf)
      const combined: Intl.DateTimeFormatOptions = {
        ...dateOptions,
        ...timeOpts,
        timeZone: timezone,
      }

      // For 12h format, add dayPeriod for AM/PM if Intl supports it
      if (tf === "12h") {
        ;(combined as Record<string, unknown>).dayPeriod = "short" as unknown as undefined
      }

      return new Intl.DateTimeFormat(locale, combined).format(parsed)
    }

    return new Intl.DateTimeFormat(locale, {
      ...dateOptions,
      timeZone: timezone,
    }).format(parsed)
  } catch {
    // Fallback: basic formatting
    try {
      const d = typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date
      return d.toISOString().slice(0, 10)
    } catch {
      return String(date)
    }
  }
}

/**
 * Format a date including time according to organization settings.
 * Convenience wrapper around formatDate with includeTime: true.
 */
export function formatDateTime(
  date: DateInput,
  options: Omit<FormatDateOptions, "includeTime"> = {},
): string {
  return formatDate(date, { ...options, includeTime: true })
}

/**
 * Format only the time portion of a date according to organization settings.
 *
 * @param date    - Date string, timestamp, or Date object
 * @param options - Timezone and timeFormat options
 *
 * @example
 *   formatTime("2025-01-15T14:30:00Z", { timezone: "America/Chicago", timeFormat: "12h" })
 *   → "8:30 AM"
 */
export function formatTime(
  date: DateInput,
  options: Omit<FormatDateOptions, "dateFormat" | "includeTime" | "locale"> = {},
): string {
  const {
    timezone = "UTC",
    timeFormat: tf = "12h",
  } = options

  try {
    const parsed = typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date

    const timeOpts = timeFormatToOptions(tf)

    return new Intl.DateTimeFormat("en-US", {
      ...timeOpts,
      timeZone: timezone,
    }).format(parsed)
  } catch {
    return ""
  }
}
