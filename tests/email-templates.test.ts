import { describe, it, expect } from "vitest"
import { defaultTemplates, getDefaultTemplate, templateRequiredVars } from "@/lib/email/templates"
import { renderTemplate } from "@/lib/email/renderer"
import { sampleVariables } from "@/lib/email/renderer"

describe("email default templates", () => {
  it("has exactly 3 default templates", () => {
    expect(defaultTemplates).toHaveLength(3)
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
