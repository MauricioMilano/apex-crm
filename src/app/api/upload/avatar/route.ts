import { cookies } from 'next/headers'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { apiSuccess, apiError, SESSION_COOKIE } from '@/lib/api-helpers'
import { prisma } from '@/lib/db'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads', 'avatars')

export async function POST(request: Request) {
  try {
    // Authenticate via session cookie
    const cookieStore = await cookies()
    const userId = cookieStore.get(SESSION_COOKIE)?.value
    if (!userId) return apiError('Not authenticated', 401)

    const formData = await request.formData()
    const file = formData.get('avatar') as File | null
    if (!file) return apiError('No file provided', 400)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError('Unsupported file type. Use PNG, JPEG, or WebP.', 400)
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return apiError('File too large. Maximum 2MB.', 413)
    }

    // Determine file extension
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const timestamp = Date.now()
    const filename = `u_${userId}_${timestamp}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Write file to disk
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    // Update User.avatar with the URL
    const avatarUrl = `/api/files/avatars/${filename}`
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    })

    return apiSuccess({ avatarUrl })
  } catch (error) {
    return apiError(String(error), 500)
  }
}
