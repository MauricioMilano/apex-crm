import { NextRequest } from "next/server"
import { apiSuccess, apiError, withSessionOrApiAuth } from "@/lib/api-helpers"
import { getLeads, createLead } from "@/actions/leads"

export async function GET(request: NextRequest) {
  if (!await withSessionOrApiAuth(request)) return apiError("Unauthorized", 401)
  try {
    const { searchParams } = new URL(request.url)
    const result = await getLeads({
      statusId: searchParams.get("statusId") ?? undefined,
      assignedTo: searchParams.get("assignedTo") ?? undefined,
      search: searchParams.get("search") ?? undefined,
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
    const result = await createLead(body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
