import { NextRequest } from "next/server"
import { apiSuccess, apiError, withSessionOrApiAuth } from "@/lib/api-helpers"
import { getClientSubscriptions, assignPlan } from "@/actions/client-subscriptions"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await withSessionOrApiAuth(_request)) return apiError("Unauthorized", 401)
  try {
    const { id } = await params
    const result = await getClientSubscriptions(id)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await withSessionOrApiAuth(_request)) return apiError("Unauthorized", 401)
  try {
    const { id } = await params
    const body = await _request.json()
    const result = await assignPlan({ clientId: id, planId: body.planId })
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
