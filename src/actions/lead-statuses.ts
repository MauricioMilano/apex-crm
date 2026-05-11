"use server"

import { z } from "zod"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const reorderSchema = z.object({
  statusId: z.string().min(1),
  direction: z.enum(["up", "down"]),
})

export async function reorderLeadStatus(input: unknown): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const parsed = reorderSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    const { statusId, direction } = parsed.data
    const currentOrder = direction === "up" ? -1 : 1

    const current = await prisma.leadStatus.findFirst({
      where: { id: statusId, organizationId: ORG_ID },
    })

    if (!current) {
      return { success: false as const, error: "Lead status not found" }
    }

    const neighbor = await prisma.leadStatus.findFirst({
      where: {
        organizationId: ORG_ID,
        order: current.order + currentOrder,
      },
    })

    if (!neighbor) {
      return { success: false as const, error: "Cannot reorder in this direction" }
    }

    await prisma.$transaction([
      prisma.leadStatus.update({
        where: { id: statusId },
        data: { order: neighbor.order },
      }),
      prisma.leadStatus.update({
        where: { id: neighbor.id },
        data: { order: current.order },
      }),
    ])

    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
