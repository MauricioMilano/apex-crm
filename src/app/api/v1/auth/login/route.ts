import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { apiSuccess, apiError, SESSION_COOKIE } from "@/lib/api-helpers"
import { loginUser } from "@/actions/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, orgSlug } = body as { email: string; password: string; orgSlug?: string }
    if (!email || !password) return apiError("email and password are required")
    const result = await loginUser(email, password, orgSlug)
    if (!result.success) return apiError(result.error, 401)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, result.data.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}
