import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { registerUser } from "@/actions/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await registerUser(body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
