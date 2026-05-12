import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate, formatDateTime, formatTime } from "@/lib/format"

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats USD in en-US with $ symbol and comma separators", () => {
    expect(formatCurrency(1500, "USD", "en-US")).toBe("$1,500.00")
  })

  it("formats BRL in pt-BR with R$ symbol and dot separators", () => {
    const result = formatCurrency(1500, "BRL", "pt-BR")
    expect(result).toContain("R$")
    expect(result).toContain("1.500")
  })

  it("formats JPY with zero decimal places", () => {
    const result = formatCurrency(1500, "JPY", "ja-JP")
    expect(result).toContain("￥")
    expect(result).not.toContain(".")
  })

  it("formats EUR in de-DE", () => {
    const result = formatCurrency(99.9, "EUR", "de-DE")
    expect(result).toContain("99")
    expect(result).toContain("€")
  })

  it("defaults to USD and en-US when arguments are omitted", () => {
    expect(formatCurrency(100)).toBe("$100.00")
  })

  it("handles zero", () => {
    expect(formatCurrency(0, "USD", "en-US")).toBe("$0.00")
  })

  it("handles large numbers", () => {
    const result = formatCurrency(1_000_000, "USD", "en-US")
    expect(result).toBe("$1,000,000.00")
  })

  it("falls back gracefully on invalid locale", () => {
    const result = formatCurrency(100, "USD", "invalid-locale")
    // Should not throw — fallback path
    expect(result).toBeTruthy()
  })
})

// ─── formatDate ──────────────────────────────────────────────────────────────

describe("formatDate", () => {
  const isoDate = "2025-01-15T14:30:00Z"

  it("formats with MM/DD/YYYY in en-US", () => {
    const result = formatDate(isoDate, {
      dateFormat: "MM/DD/YYYY",
      timezone: "America/New_York",
      locale: "en-US",
    })
    expect(result).toBe("01/15/2025")
  })

  it("formats with DD/MM/YYYY", () => {
    const result = formatDate(isoDate, {
      dateFormat: "DD/MM/YYYY",
      timezone: "UTC",
      locale: "en-GB",
    })
    expect(result).toBe("15/01/2025")
  })

  it("formats with MMM D, YYYY", () => {
    const result = formatDate(isoDate, {
      dateFormat: "MMM D, YYYY",
      timezone: "America/New_York",
      locale: "en-US",
    })
    expect(result).toBe("Jan 15, 2025")
  })

  it("respects timezone conversion", () => {
    // 14:30 UTC → 08:30 Chicago (UTC-6)
    const chicago = formatDate(isoDate, {
      dateFormat: "MM/DD/YYYY",
      timezone: "America/Chicago",
      locale: "en-US",
    })
    expect(chicago).toBe("01/15/2025")
  })

  it("defaults to MM/DD/YYYY and UTC", () => {
    expect(formatDate(isoDate)).toBe("01/15/2025")
  })

  it("handles Date object input", () => {
    const d = new Date("2025-06-01T12:00:00Z")
    expect(formatDate(d, { dateFormat: "YYYY-MM-DD", timezone: "UTC", locale: "en-CA" })).toBe("2025-06-01")
  })
})

// ─── formatDateTime ──────────────────────────────────────────────────────────

describe("formatDateTime", () => {
  it("includes time in 12h format", () => {
    const result = formatDateTime("2025-01-15T14:30:00Z", {
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      timezone: "America/New_York",
      locale: "en-US",
    })
    expect(result).toContain("01/15/2025")
    expect(result).toContain("9:30") // 14:30 UTC → 9:30 AM EST
  })

  it("includes time in 24h format", () => {
    const result = formatDateTime("2025-01-15T14:30:00Z", {
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      timezone: "Europe/Berlin",
      locale: "en-GB",
    })
    expect(result).toContain("15/01/2025")
    expect(result).toContain("15:30") // 14:30 UTC → 15:30 CET
  })
})

// ─── formatTime ──────────────────────────────────────────────────────────────

describe("formatTime", () => {
  it("formats time in 12h", () => {
    const result = formatTime("2025-01-15T14:30:00Z", {
      timeFormat: "12h",
      timezone: "America/New_York",
    })
    expect(result).toContain("9:30") // 14:30 UTC → 9:30 AM EST
  })

  it("formats time in 24h", () => {
    const result = formatTime("2025-01-15T14:30:00Z", {
      timeFormat: "24h",
      timezone: "UTC",
    })
    expect(result).toBe("14:30")
  })
})
