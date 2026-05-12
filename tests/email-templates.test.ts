import { describe, it, expect } from "vitest"
import { defaultTemplates, getDefaultTemplate, templateRequiredVars } from "@/lib/email/templates"
import { renderTemplate } from "@/lib/email/renderer"
import { sampleVariables } from "@/lib/email/renderer"

describe("email default templates", () => {
  it("has exactly 24 default templates", () => {
    expect(defaultTemplates).toHaveLength(24)
  })

  it("has appointment-confirmed template", () => {
    const t = getDefaultTemplate("appointment-confirmed")
    expect(t).toBeDefined()
    expect(t!.category).toBe("appointment")
    expect(t!.subject).toContain("{{")
    expect(t!.bodyHtml).toContain("{{")
  })

  it("has lead-notification template", () => {
    const t = getDefaultTemplate("lead-notification")
    expect(t).toBeDefined()
    expect(t!.category).toBe("lead")
  })

  it("has client-welcome template", () => {
    const t = getDefaultTemplate("client-welcome")
    expect(t).toBeDefined()
    expect(t!.category).toBe("client")
  })

  it("returns undefined for unknown template", () => {
    expect(getDefaultTemplate("nonexistent")).toBeUndefined()
  })

  // ── New appointment templates ──────────────────────────────────────

  it("has appointment-cancelled template", () => {
    const t = getDefaultTemplate("appointment-cancelled")
    expect(t).toBeDefined()
    expect(t!.category).toBe("appointment")
  })

  it("has appointment-rescheduled template", () => {
    const t = getDefaultTemplate("appointment-rescheduled")
    expect(t).toBeDefined()
    expect(t!.category).toBe("appointment")
  })

  it("has appointment-reminder template", () => {
    const t = getDefaultTemplate("appointment-reminder")
    expect(t).toBeDefined()
    expect(t!.category).toBe("appointment")
  })

  it("has appointment-completed template", () => {
    const t = getDefaultTemplate("appointment-completed")
    expect(t).toBeDefined()
    expect(t!.category).toBe("appointment")
  })

  it("has appointment-no-show template", () => {
    const t = getDefaultTemplate("appointment-no-show")
    expect(t).toBeDefined()
    expect(t!.category).toBe("appointment")
  })

  // ── New lead templates ─────────────────────────────────────────────

  it("has lead-assigned template", () => {
    const t = getDefaultTemplate("lead-assigned")
    expect(t).toBeDefined()
    expect(t!.category).toBe("lead")
  })

  it("has lead-converted template", () => {
    const t = getDefaultTemplate("lead-converted")
    expect(t).toBeDefined()
    expect(t!.category).toBe("lead")
  })

  it("has lead-status-changed template", () => {
    const t = getDefaultTemplate("lead-status-changed")
    expect(t).toBeDefined()
    expect(t!.category).toBe("lead")
  })

  // ── New client templates ───────────────────────────────────────────

  it("has client-welcome-admin template", () => {
    const t = getDefaultTemplate("client-welcome-admin")
    expect(t).toBeDefined()
    expect(t!.category).toBe("client")
  })

  it("has client-assigned template", () => {
    const t = getDefaultTemplate("client-assigned")
    expect(t).toBeDefined()
    expect(t!.category).toBe("client")
  })

  // ── New subscription templates ─────────────────────────────────────

  it("has subscription-activated template", () => {
    const t = getDefaultTemplate("subscription-activated")
    expect(t).toBeDefined()
    expect(t!.category).toBe("subscription")
  })

  it("has subscription-cancelled template", () => {
    const t = getDefaultTemplate("subscription-cancelled")
    expect(t).toBeDefined()
    expect(t!.category).toBe("subscription")
  })

  it("has subscription-expired template", () => {
    const t = getDefaultTemplate("subscription-expired")
    expect(t).toBeDefined()
    expect(t!.category).toBe("subscription")
  })

  it("has subscription-expiring-soon template", () => {
    const t = getDefaultTemplate("subscription-expiring-soon")
    expect(t).toBeDefined()
    expect(t!.category).toBe("subscription")
  })

  it("has subscription-renewed template", () => {
    const t = getDefaultTemplate("subscription-renewed")
    expect(t).toBeDefined()
    expect(t!.category).toBe("subscription")
  })

  it("has subscription-limit-warning template", () => {
    const t = getDefaultTemplate("subscription-limit-warning")
    expect(t).toBeDefined()
    expect(t!.category).toBe("subscription")
  })

  // ── New team templates ─────────────────────────────────────────────

  it("has team-invite template", () => {
    const t = getDefaultTemplate("team-invite")
    expect(t).toBeDefined()
    expect(t!.category).toBe("team")
  })

  it("has welcome-admin template", () => {
    const t = getDefaultTemplate("welcome-admin")
    expect(t).toBeDefined()
    expect(t!.category).toBe("team")
  })

  // ── New auth templates ─────────────────────────────────────────────

  it("has password-reset template", () => {
    const t = getDefaultTemplate("password-reset")
    expect(t).toBeDefined()
    expect(t!.category).toBe("auth")
  })

  it("has email-verification template", () => {
    const t = getDefaultTemplate("email-verification")
    expect(t).toBeDefined()
    expect(t!.category).toBe("auth")
  })

  it("has magic-link template", () => {
    const t = getDefaultTemplate("magic-link")
    expect(t).toBeDefined()
    expect(t!.category).toBe("auth")
  })

  it("all default templates have a non-empty subject", () => {
    for (const t of defaultTemplates) {
      expect(t.subject.length).toBeGreaterThan(0)
    }
  })

  it("all default templates have a non-empty bodyHtml", () => {
    for (const t of defaultTemplates) {
      expect(t.bodyHtml.length).toBeGreaterThan(0)
    }
  })

  it("all required variables are present in sample data", () => {
    for (const [name, vars] of Object.entries(templateRequiredVars)) {
      const sample = sampleVariables[name]
      expect(sample).toBeDefined()
      for (const v of vars) {
        expect(sample).toHaveProperty(v)
      }
    }
  })

  it("all templates render without errors using sample data", () => {
    for (const t of defaultTemplates) {
      const vars = sampleVariables[t.name]
      expect(vars).toBeDefined()
      const subject = renderTemplate(t.subject, vars)
      const body = renderTemplate(t.bodyHtml, vars)
      expect(subject.length).toBeGreaterThan(0)
      expect(body.length).toBeGreaterThan(0)
      // Verify placeholders were replaced
      expect(subject).not.toContain("{{")
    }
  })
})
