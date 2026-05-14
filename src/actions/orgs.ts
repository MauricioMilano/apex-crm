"use server"

import { prisma } from "@/lib/db"

export async function lookupOrgBySlug(slug: string) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    })
    if (!org) return { success: false as const, error: "Organization not found" }
    return { success: true as const, data: org }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function lookupOrgById(id: string) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    })
    if (!org) return { success: false as const, error: "Organization not found" }
    return { success: true as const, data: org }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function searchOrgs(query: string, limit = 10) {
  try {
    const orgs = await prisma.organization.findMany({
      where: { slug: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: limit,
      orderBy: { name: "asc" },
    })
    return { success: true as const, data: orgs }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
