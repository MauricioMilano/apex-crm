import { describe, it, expect } from "vitest"
import { renderTemplate, sampleVariables } from "@/lib/email/renderer"
import { templateRequiredVars, defaultTemplates } from "@/lib/email/templates"

describe("email send integration logic", () => {
  it("default templates can be rendered for all sample data", () => {
    for (const t of defaultTemplates) {
      const vars = sampleVariables[t.name]
      expect(vars).toBeDefined()

      const subject = renderTemplate(t.subject, vars)
      const body = renderTemplate(t.bodyHtml, vars)

      // All placeholders should be replaced
      expect(subject).not.toMatch(/\{\{/)
      expect(body).not.toMatch(/\{\{/)
    }
  })

  it("templateRequiredVars matches sampleVariables keys for each template", () => {
    for (const [name, requiredVars] of Object.entries(templateRequiredVars)) {
      const sample = sampleVariables[name]
      expect(sample).toBeDefined()
      for (const v of requiredVars) {
        expect(sample).toHaveProperty(v)
        expect(typeof sample[v]).toBe("string")
        expect((sample[v] as string).length).toBeGreaterThan(0)
      }
    }
  })

  it("sendEmail function exists and returns expected shape", async () => {
    const { sendEmail } = await import("@/lib/email/send")
    expect(sendEmail).toBeInstanceOf(Function)

    // When SMTP is not enabled, should return success: false
    const result = await sendEmail({
      templateName: "appointment-confirmed",
      to: "test@example.com",
      variables: { name: "Test" },
    })
    expect(result).toHaveProperty("success")
    expect(result.success).toBe(false)
    expect(result).toHaveProperty("error")
  })
})
