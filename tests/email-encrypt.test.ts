import { describe, it, expect } from "vitest"
import { encrypt, decrypt } from "@/lib/email/encrypt"

describe("email encrypt/decrypt", () => {
  it("should encrypt and decrypt a plain text password", () => {
    const original = "my-smtp-password-123!"
    const encrypted = encrypt(original)

    expect(encrypted).not.toBe(original)
    expect(encrypted).toContain(":") // iv:ciphertext format

    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it("should produce different ciphertexts for same plaintext each time", () => {
    const plaintext = "same-password"
    const a = encrypt(plaintext)
    const b = encrypt(plaintext)

    expect(a).not.toBe(b) // IV is random
    expect(decrypt(a)).toBe(plaintext)
    expect(decrypt(b)).toBe(plaintext)
  })

  it("should handle empty string", () => {
    const original = ""
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it("should handle special characters", () => {
    const original = "p@ssw0rd!<>#&'\""
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it("should throw on invalid encrypted text", () => {
    expect(() => decrypt("invalid-format")).toThrow("Invalid encrypted text format")
  })
})
