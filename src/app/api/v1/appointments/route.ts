import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { getAppointments, createAppointment } from "@/actions/appointments"
import { AppointmentStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get("status")
    const result = await getAppointments({
      status: statusParam ? (statusParam as AppointmentStatus) : undefined,
      employeeId: searchParams.get("employeeId") ?? undefined,
      clientId: searchParams.get("clientId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    })
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createAppointment(body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
