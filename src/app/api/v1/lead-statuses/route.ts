import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { prisma } from "@/lib/db"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

export async function GET() {
  try {
    const statuses = await prisma.leadStatus.findMany({
      where: { organizationId: ORG_ID },
      orderBy: { order: "asc" },
    })
    return apiSuccess(statuses)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const status = await prisma.leadStatus.create({
      data: {
        organizationId: ORG_ID,
        name: body.name,
        color: body.color ?? "#6366f1",
        order: body.order ?? 0,
        isDefault: body.isDefault ?? false,
      },
    })
    return apiSuccess(status, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
