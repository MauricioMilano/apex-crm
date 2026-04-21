import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { updateAppointmentStatus } from "@/actions/appointments"
import { AppointmentStatus } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, cancelReason } = body as {
      status: AppointmentStatus
      cancelReason?: string
    }
    if (!status) return apiError("status is required")
    const result = await updateAppointmentStatus(id, status, cancelReason)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}
