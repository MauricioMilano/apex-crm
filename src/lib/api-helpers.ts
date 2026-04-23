import { cookies } from "next/headers"
import { validateApiKey } from "@/actions/api-keys"

export const SESSION_COOKIE = "crm_session"

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400): Response {
  return Response.json({ success: false, error: message }, { status })
}

export async function withApiAuth(
  request: Request
): Promise<{ organizationId: string } | null> {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const rawKey = authHeader.slice(7)
  const result = await validateApiKey(rawKey)
  if (!result.success) return null
  return { organizationId: result.data.organizationId }
}

/**
 * Accepts either a valid Bearer API key or a valid HTTP-only session cookie.
 * Returns { userId } for cookie sessions, { organizationId } for API-key sessions.
 */
export async function withSessionOrApiAuth(
  request: Request
): Promise<{ userId?: string; organizationId?: string } | null> {
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const rawKey = authHeader.slice(7)
    const result = await validateApiKey(rawKey)
    if (result.success) return { organizationId: result.data.organizationId }
    return null // invalid key — deny
  }
  const cookieStore = await cookies()
  const userId = cookieStore.get(SESSION_COOKIE)?.value
  if (userId) return { userId }
  return null
}
