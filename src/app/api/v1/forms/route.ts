import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { getForms, createForm } from "@/actions/forms"

export async function GET() {
  try {
    const result = await getForms()
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createForm(body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
