import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const status = await prisma.leadStatus.update({ where: { id }, data: body })
    return apiSuccess(status)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.leadStatus.delete({ where: { id } })
    return apiSuccess({ id })
  } catch {
    return apiError("Internal server error", 500)
  }
}
