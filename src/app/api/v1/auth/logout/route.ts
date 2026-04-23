import { cookies } from 'next/headers'
import { apiSuccess, SESSION_COOKIE } from '@/lib/api-helpers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return apiSuccess({ loggedOut: true })
}
