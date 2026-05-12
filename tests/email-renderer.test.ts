import { describe, it, expect } from "vitest"
import { renderTemplate, sampleVariables } from "@/lib/email/renderer"

describe("email renderer", () => {
  it("replaces {{var}} with provided value", () => {
    const result = renderTemplate("Hello {{name}}!", { name: "John" })
    expect(result).toBe("Hello John!")
  })

  it("replaces multiple occurrences of the same variable", () => {
    const result = renderTemplate("{{name}}, welcome {{name}}!", { name: "Jane" })
    expect(result).toBe("Jane, welcome Jane!")
  })

  it("replaces multiple different variables", () => {
    const result = renderTemplate("{{greeting}} {{name}}!", {
      greeting: "Hi",
      name: "Bob",
    })
    expect(result).toBe("Hi Bob!")
  })

  it("replaces unknown variable with empty string", () => {
    const result = renderTemplate("Hello {{unknown}}!", {})
    expect(result).toBe("Hello !")
  })

  it("HTML-escapes variable values", () => {
    const result = renderTemplate("<p>{{name}}</p>", {
      name: "<script>alert('xss')</script>",
    })
    expect(result).toBe("<p>&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;</p>")
  })

  it("HTML-escapes ampersands", () => {
    const result = renderTemplate("{{text}}", { text: "A & B" })
    expect(result).toBe("A &amp; B")
  })

  it("leaves template unchanged when no variables match", () => {
    const result = renderTemplate("Static text without vars", { name: "John" })
    expect(result).toBe("Static text without vars")
  })

  it("renders sample variables for appointment-confirmed", () => {
    const template = "{{clientName}} on {{date}} at {{time}}"
    const vars = sampleVariables["appointment-confirmed"]
    const result = renderTemplate(template, vars)
    expect(result).toContain("John Doe")
    expect(result).toContain("June 15, 2026")
    expect(result).toContain("2:00 PM")
  })
})
