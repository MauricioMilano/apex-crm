import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { loginUser } from "@/actions/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body as { email: string; password: string }
    if (!email || !password) return apiError("email and password are required")
    const result = await loginUser(email, password)
    if (!result.success) return apiError(result.error, 401)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}
