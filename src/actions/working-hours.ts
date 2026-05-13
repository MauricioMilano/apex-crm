"use server"

import { z } from "zod"
import { prisma } from "@/lib/db"
import { normalizeWorkingHours, resolveWorkingHours, createDefaultWorkingHours } from "@/lib/working-hours"
import type { WorkingHours, DaySchedule } from "@/types"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const dayScheduleSchema = z.object({
  isWorking: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:mm format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:mm format"),
})

const workingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
})

/**
 * Persist an employee's working hours.
 * Creates an EmployeeProfile if one doesn't exist yet.
 */
export async function updateEmployeeWorkingHours(
  userId: string,
  workingHours: unknown,
) {
  try {
    const parsed = workingHoursSchema.safeParse(workingHours)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    // Validate start < end for each working day
    const days = Object.entries(parsed.data) as [string, DaySchedule][]
    for (const [day, schedule] of days) {
      if (schedule.isWorking && schedule.startTime >= schedule.endTime) {
        return {
          success: false as const,
          error: `${day}: startTime must be before endTime on working days`,
        }
      }
    }

    await prisma.employeeProfile.upsert({
      where: { userId },
      create: {
        userId,
        workingHours: parsed.data,
      },
      update: {
        workingHours: parsed.data,
      },
    })

    return { success: true as const, data: parsed.data }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

/**
 * Get an employee's working hours with fallback chain:
 * employee custom hours → org default hours → all closed
 */
export async function getEmployeeWorkingHours(userId: string) {
  try {
    const [employeeProfile, orgSettings] = await Promise.all([
      prisma.employeeProfile.findUnique({
        where: { userId },
        select: { workingHours: true },
      }),
      prisma.organizationSetting.findUnique({
        where: { organizationId: ORG_ID },
        select: { defaultWorkingHours: true },
      }),
    ])

    const resolved = resolveWorkingHours(
      employeeProfile?.workingHours,
      orgSettings?.defaultWorkingHours,
    )

    return { success: true as const, data: resolved }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

/**
 * Get organization default working hours.
 * Handles the case where defaultWorkingHours is "{}" (Prisma default) by
 * checking if the normalized result has any working days before returning.
 */
export async function getOrgDefaultWorkingHours() {
  try {
    const orgSettings = await prisma.organizationSetting.findUnique({
      where: { organizationId: ORG_ID },
      select: { defaultWorkingHours: true },
    })

    if (orgSettings?.defaultWorkingHours) {
      const normalized = normalizeWorkingHours(orgSettings.defaultWorkingHours)
      const hasWorkingDays = Object.values(normalized).some((d) => d.isWorking)
      if (hasWorkingDays) {
        return { success: true as const, data: normalized }
      }
      // Empty object {} is truthy but has no working days — fall through
    }

    return { success: true as const, data: createDefaultWorkingHours() }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

/**
 * Update organization default working hours.
 */
export async function updateOrgDefaultWorkingHours(workingHours: unknown) {
  try {
    const parsed = workingHoursSchema.safeParse(workingHours)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }

    await prisma.organizationSetting.upsert({
      where: { organizationId: ORG_ID },
      create: {
        organizationId: ORG_ID,
        defaultWorkingHours: parsed.data,
      },
      update: {
        defaultWorkingHours: parsed.data,
      },
    })

    return { success: true as const, data: parsed.data }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
