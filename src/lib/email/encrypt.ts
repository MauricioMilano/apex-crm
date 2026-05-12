import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-cbc"
const IV_LENGTH = 16

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
      "Generate one with: openssl rand -hex 32"
    )
  }
  return Buffer.from(keyHex, "hex")
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  // Prepend IV to ciphertext so decrypt can extract it
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

export function decrypt(encryptedText: string): string {
  const key = getKey()
  const parts = encryptedText.split(":")
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format")
  }
  const iv = Buffer.from(parts[0], "hex")
  const encrypted = Buffer.from(parts[1], "hex")
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}
