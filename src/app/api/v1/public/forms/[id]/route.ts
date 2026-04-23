import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { prisma } from "@/lib/db"

/**
 * Public endpoint — returns only the data needed to render and submit a public form.
 * No authentication required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const form = await prisma.form.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        fields: true,
        styling: true,
        isPublished: true,
        organizationId: true,
      },
    })
    if (!form) return apiError("Form not found", 404)
    if (!form.isPublished) return apiError("Form is not accepting submissions", 403)

    // Find the default lead status for this org so submissions can create a lead
    const defaultStatus = await prisma.leadStatus.findFirst({
      where: { organizationId: form.organizationId, isDefault: true },
      select: { id: true },
    }) ?? await prisma.leadStatus.findFirst({
      where: { organizationId: form.organizationId },
      orderBy: { order: "asc" },
      select: { id: true },
    })

    return apiSuccess({ form, defaultStatusId: defaultStatus?.id ?? null })
  } catch {
    return apiError("Internal server error", 500)
  }
}
