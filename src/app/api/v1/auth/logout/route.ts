import { NextRequest } from 'next/server'
import { apiSuccess } from '@/lib/api-helpers'

export async function POST(_request: NextRequest) {
  // No server-side session implemented; respond with success for parity.
  return apiSuccess({ loggedOut: true })
}
