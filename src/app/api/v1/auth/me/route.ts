import { cookies } from 'next/headers'
import { apiSuccess, apiError, SESSION_COOKIE } from '@/lib/api-helpers'
import { getUserById } from '@/actions/auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get(SESSION_COOKIE)?.value
    if (!userId) return apiError('Not authenticated', 401)
    const result = await getUserById(userId)
    if (!result.success) return apiError(result.error, 404)
    return apiSuccess(result.data)
  } catch {
    return apiError('Internal server error', 500)
  }
}
