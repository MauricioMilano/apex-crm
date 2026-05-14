import { readFile } from 'fs/promises'
import path from 'path'
import { apiError } from '@/lib/api-helpers'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads', 'avatars')

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    // Basic security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return apiError('Invalid filename', 400)
    }

    const filepath = path.join(UPLOAD_DIR, filename)
    const ext = path.extname(filename).toLowerCase()
    const contentType = MIME_TYPES[ext]

    if (!contentType) {
      return apiError('Unsupported file type', 400)
    }

    const buffer = await readFile(filepath)

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return apiError('File not found', 404)
  }
}
