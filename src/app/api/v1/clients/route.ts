import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { getClients, createClient } from "@/actions/clients"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get("tags")
    const isActiveParam = searchParams.get("isActive")
    const result = await getClients({
      search: searchParams.get("search") ?? undefined,
      tags: tagsParam ? tagsParam.split(",") : undefined,
      isActive: isActiveParam !== null ? isActiveParam === "true" : undefined,
    })
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data)
  } catch {
    return apiError("Internal server error", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createClient(body)
    if (!result.success) return apiError(result.error)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError("Internal server error", 500)
  }
}
