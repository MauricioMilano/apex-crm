import { NextRequest } from "next/server"
import { apiSuccess, apiError, withSessionOrApiAuth } from "@/lib/api-helpers"
import { getPlan, updatePlan, deletePlan } from "@/actions/subscription-plans"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await withSessionOrApiAuth(_request)) return apiError("Unauthorized", 401)
  try {
    const { id } = await params
    const result = await getPlan(id)
    if (!result.success) return apiError(result.error, 404)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await withSessionOrApiAuth(_request)) return apiError("Unauthorized", 401)
  try {
    const { id } = await params
    const body = await _request.json()
    const result = await updatePlan(id, body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await withSessionOrApiAuth(_request)) return apiError("Unauthorized", 401)
  try {
    const { id } = await params
    const result = await deletePlan(id)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}
