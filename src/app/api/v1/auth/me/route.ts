import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api-helpers'
import { getUserById } from '@/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return apiError('id is required', 400)
    const result = await getUserById(id)
    if (!result.success) return apiError(result.error, 404)
    return apiSuccess(result.data)
  } catch {
    return apiError('Internal server error', 500)
  }
}
