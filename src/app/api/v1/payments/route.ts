import { NextRequest } from "next/server"
import { apiSuccess, apiError, withSessionOrApiAuth } from "@/lib/api-helpers"
import { getPayments, createPayment } from "@/actions/payments"

export async function GET(request: NextRequest) {
  if (!await withSessionOrApiAuth(request)) return apiError("Unauthorized", 401)
  try {
    const { searchParams } = new URL(request.url)
    const result = await getPayments({
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      referenceType: searchParams.get("referenceType") ?? undefined,
      referenceId: searchParams.get("referenceId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      paymentMethodId: searchParams.get("paymentMethodId") ?? undefined,
    })
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function POST(request: NextRequest) {
  if (!await withSessionOrApiAuth(request)) return apiError("Unauthorized", 401)
  try {
    const body = await request.json()
    const result = await createPayment(body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
