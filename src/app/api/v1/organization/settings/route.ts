import { NextRequest } from "next/server"
import { apiSuccess, apiError, withSessionOrApiAuth } from "@/lib/api-helpers"
import { prisma } from "@/lib/db"
import { getOrganizationSettings, updateOrganizationSettings } from "@/actions/settings"

async function resolveOrgId(request: NextRequest): Promise<string | null> {
  const auth = await withSessionOrApiAuth(request)
  if (!auth) return null
  if (auth.organizationId) return auth.organizationId
  if (auth.userId) {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { organizationId: true },
    })
    return user?.organizationId ?? null
  }
  return null
}

export async function GET(request: NextRequest) {
  const orgId = await resolveOrgId(request)
  if (!orgId) return apiError("Unauthorized", 401)
  try {
    const result = await getOrganizationSettings(orgId)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function PATCH(request: NextRequest) {
  const orgId = await resolveOrgId(request)
  if (!orgId) return apiError("Unauthorized", 401)
  try {
    const body = await request.json()
    const result = await updateOrganizationSettings(orgId, body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}
