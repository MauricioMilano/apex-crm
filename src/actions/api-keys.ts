"use server"

import { z } from "zod"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createApiKeySchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()),
})

const apiKeySelectFields = {
  id: true,
  organizationId: true,
  name: true,
  keyPrefix: true,
  permissions: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function getApiKeys() {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { organizationId: ORG_ID },
      select: apiKeySelectFields,
      orderBy: { createdAt: "desc" },
    })
    return { success: true as const, data: keys }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createApiKey(data: { name: string; permissions: string[] }) {
  try {
    const parsed = createApiKeySchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const rawKey = `crm_${randomBytes(32).toString("hex")}`
    const keyPrefix = rawKey.slice(0, 12)
    const keyHash = await bcrypt.hash(rawKey, 12)

    const apiKey = await prisma.apiKey.create({
      data: {
        organizationId: ORG_ID,
        name: parsed.data.name,
        permissions: parsed.data.permissions,
        keyHash,
        keyPrefix,
      },
      select: apiKeySelectFields,
    })

    return {
      success: true as const,
      data: { ...apiKey, rawKey },
    }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function revokeApiKey(id: string) {
  try {
    await prisma.apiKey.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function validateApiKey(rawKey: string) {
  try {
    const prefix = rawKey.slice(0, 12)
    const candidates = await prisma.apiKey.findMany({
      where: { organizationId: ORG_ID, keyPrefix: prefix },
    })

    for (const candidate of candidates) {
      const valid = await bcrypt.compare(rawKey, candidate.keyHash)
      if (valid) {
        await prisma.apiKey.update({
          where: { id: candidate.id },
          data: { lastUsedAt: new Date() },
        })
        const { keyHash: _kh, ...safeKey } = candidate
        return { success: true as const, data: safeKey }
      }
    }

    return { success: false as const, error: "Invalid API key" }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
