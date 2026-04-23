import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { apiSuccess, apiError, SESSION_COOKIE } from "@/lib/api-helpers"
import { registerUser } from "@/actions/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await registerUser(body)
    if (!result.success) return apiError(result.error)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, result.data.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
