import { NextRequest } from "next/server"
import { apiSuccess, apiError, withSessionOrApiAuth } from "@/lib/api-helpers"
import { getForms, createForm, updateForm, toggleFormStatus } from "@/actions/forms"

export async function GET(request: NextRequest) {
  if (!await withSessionOrApiAuth(request)) return apiError("Unauthorized", 401)
  try {
    const result = await getForms()
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
    const result = await createForm(body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function PATCH(request: NextRequest) {
  if (!await withSessionOrApiAuth(request)) return apiError("Unauthorized", 401)
  try {
    const body = await request.json()
    
    // Check if this is a toggle request (no id provided, just current state)
    if (!body.id && typeof body.isPublished === 'boolean') {
      // Toggle form status
      const result = await toggleFormStatus(body.id as string)
      if (!result.success) return apiError(result.error)
      return apiSuccess({ success: true, data: result.data })
    }
    
    // Otherwise treat as update request
    const result = await updateForm(body.id, body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}
