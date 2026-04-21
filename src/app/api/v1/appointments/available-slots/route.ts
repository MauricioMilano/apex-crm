import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { getAvailableSlots } from "@/actions/appointments"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const serviceId = searchParams.get("serviceId")
    const date = searchParams.get("date")

    if (!employeeId || !serviceId || !date) {
      return apiError("employeeId, serviceId, and date are required")
    }

    const result = await getAvailableSlots(employeeId, serviceId, date)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}
