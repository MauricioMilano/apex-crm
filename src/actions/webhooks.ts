"use server"

import { z } from "zod"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
})

type CreateWebhookInput = z.infer<typeof createWebhookSchema>

export async function getWebhooks() {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { organizationId: ORG_ID },
      orderBy: { createdAt: "desc" },
    })
    return { success: true as const, data: webhooks }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createWebhook(data: CreateWebhookInput) {
  try {
    const parsed = createWebhookSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }
    const webhook = await prisma.webhook.create({
      data: { ...parsed.data, organizationId: ORG_ID },
    })
    return { success: true as const, data: webhook }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateWebhook(id: string, data: Partial<CreateWebhookInput>) {
  try {
    const webhook = await prisma.webhook.update({ where: { id }, data })
    return { success: true as const, data: webhook }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deleteWebhook(id: string) {
  try {
    await prisma.webhook.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function triggerWebhook(event: string, payload: unknown) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId: ORG_ID,
        isActive: true,
        events: { has: event },
      },
    })

    for (const webhook of webhooks) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (webhook.secret) {
        headers["X-Webhook-Secret"] = webhook.secret
      }

      void fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
        }),
      })
        .then(() =>
          prisma.webhook
            .update({
              where: { id: webhook.id },
              data: { lastTriggered: new Date() },
            })
            .catch(() => undefined)
        )
        .catch(() => undefined)
    }

    return { success: true as const, data: { triggered: webhooks.length } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
