import { prisma } from "@/lib/db"

export async function GET() {
  let database: "connected" | "error" = "connected"
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    database = "error"
  }

  return Response.json({
    status: "ok",
    timestamp: new Date(),
    database,
  })
}
