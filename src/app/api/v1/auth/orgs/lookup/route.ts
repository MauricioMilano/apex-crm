import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-helpers"
import { lookupOrgBySlug, searchOrgs } from "@/actions/orgs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")
    const q = searchParams.get("q")

    if (slug) {
      const result = await lookupOrgBySlug(slug)
      if (!result.success) return apiError(result.error, 404)
      return apiSuccess(result.data)
    }

    if (q) {
      const result = await searchOrgs(q)
      if (!result.success) return apiError(result.error)
      return apiSuccess(result.data)
    }

    return apiError("Provide either ?slug= or ?q= parameter")
  } catch {
    return apiError("Internal server error", 500)
  }
}
