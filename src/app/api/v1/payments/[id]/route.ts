import { NextRequest } from "next/server"
import { apiSuccess, apiError, withSessionOrApiAuth } from "@/lib/api-helpers"
import { updatePaymentStatus, getPayment } from "@/actions/payments"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await withSessionOrApiAuth(_request)) return apiError("Unauthorized", 401)
  try {
    const { id } = await params
    const result = await getPayment(id)
    if (!result.success) return apiError(result.error, 404)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await withSessionOrApiAuth(request)) return apiError("Unauthorized", 401)
  try {
    const { id } = await params
    const body: { status?: string } = await request.json()

    if (!body.status) {
      return apiError("status is required", 400)
    }

    const validStatuses = ["pending", "completed", "refunded", "failed", "adjusted"]
    if (!validStatuses.includes(body.status)) {
      return apiError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400)
    }

    const result = await updatePaymentStatus(id, body.status as "pending" | "completed" | "refunded" | "failed" | "adjusted")
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}
