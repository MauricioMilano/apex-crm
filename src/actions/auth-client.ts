import type { User } from '@/types'

const API_PREFIX = '/api/v1/auth'

export async function login(email: string, password: string) {
  const res = await fetch(`${API_PREFIX}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) return { success: false, error: await res.text() }
  const data = await res.json()
  return { success: true as const, data }
}

export async function register(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  organizationName: string
}) {
  const res = await fetch(`${API_PREFIX}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) return { success: false, error: await res.text() }
  const body = await res.json()
  return { success: true as const, data: body }
}

export async function getCurrentUser(): Promise<{ success: true; data: User } | { success: false; error: string }> {
  const res = await fetch(`${API_PREFIX}/me`)
  if (!res.ok) return { success: false, error: await res.text() }
  const body = await res.json()
  return { success: true, data: body }
}

export async function logout() {
  // server-side logout not required for this simple session; call endpoint for parity
  await fetch(`${API_PREFIX}/logout`, { method: 'POST' })
  return { success: true }
}
