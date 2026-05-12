import { NextRequest } from "next/server"
import { apiSuccess, apiError, withSessionOrApiAuth } from "@/lib/api-helpers"
import { getServicesWithPlanStatus } from "@/actions/services"

export async function GET(request: NextRequest) {
  if (!await withSessionOrApiAuth(request)) return apiError("Unauthorized", 401)
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")
    if (!clientId) return apiError("clientId is required")
    const result = await getServicesWithPlanStatus(clientId)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}
