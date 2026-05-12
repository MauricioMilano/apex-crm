import { NextRequest } from "next/server"
import { apiSuccess, apiError, withSessionOrApiAuth } from "@/lib/api-helpers"
import { cancelSubscription } from "@/actions/client-subscriptions"

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await withSessionOrApiAuth(_request)) return apiError("Unauthorized", 401)
  try {
    const { id } = await params
    const body = await _request.json()

    if (body.action === "cancel") {
      const result = await cancelSubscription(id)
      if (!result.success) return apiError(result.error)
      return apiSuccess(result.data)
    }

    return apiError("Invalid action", 400)
  } catch {
    return apiError("Internal server error", 500)
  }
}
