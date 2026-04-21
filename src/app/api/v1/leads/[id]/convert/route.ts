import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { convertLeadToClient } from "@/actions/leads"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await convertLeadToClient(id)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
