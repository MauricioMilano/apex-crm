import { validateApiKey } from "@/actions/api-keys"

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
