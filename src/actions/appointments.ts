"use server"

import { z } from "zod"
import { AppointmentStatus, Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { generateAvailableSlotTimes, normalizeWorkingHours } from "@/lib/working-hours"
import type { WorkingHours } from "@/types"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createAppointmentSchema = z.object({
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  employeeId: z.string().min(1),
  serviceId: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  locationId: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => data.clientId || data.leadId, {
  message: "Either clientId or leadId must be provided",
  path: ["clientId"],
})

type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

export async function getAppointments(filters?: {
  status?: AppointmentStatus
  employeeId?: string
  clientId?: string
  leadId?: string
  dateFrom?: string
  dateTo?: string
}) {
  try {
    const where: Prisma.AppointmentWhereInput = {
      organizationId: ORG_ID,
    }

    if (filters?.status) where.status = filters.status
    if (filters?.employeeId) where.employeeId = filters.employeeId
    if (filters?.clientId) where.clientId = filters.clientId
    if (filters?.leadId) where.leadId = filters.leadId
    if (filters?.dateFrom || filters?.dateTo) {
      where.startTime = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        lead: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        service: true,
        location: true,
      },
      orderBy: { startTime: "asc" },
    })
    return { success: true as const, data: appointments }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getAppointment(id: string) {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id, organizationId: ORG_ID },
      include: {
        client: true,
        lead: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        service: true,
        location: true,
      },
    })
    if (!appointment) return { success: false as const, error: "Appointment not found" }
    return { success: true as const, data: appointment }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function createAppointment(data: CreateAppointmentInput) {
  try {
    const parsed = createAppointmentSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.message }
    }
    const appointment = await prisma.appointment.create({
      data: {
        ...parsed.data,
        organizationId: ORG_ID,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
      },
      include: { client: true, lead: true, employee: true, service: true },
    })
    return { success: true as const, data: appointment }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateAppointment(
  id: string,
  data: Partial<CreateAppointmentInput>
) {
  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
      include: { client: true, lead: true, employee: true, service: true },
    })
    return { success: true as const, data: appointment }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancelReason?: string
) {
  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(cancelReason !== undefined ? { cancelReason } : {}),
      },
    })
    return { success: true as const, data: appointment }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function deleteAppointment(id: string) {
  try {
    await prisma.appointment.delete({ where: { id } })
    return { success: true as const, data: { id } }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

export async function getAvailableSlots(
  employeeId: string,
  serviceId: string,
  date: string
) {
  try {
    const [employeeProfile, service] = await Promise.all([
      prisma.employeeProfile.findUnique({
        where: { userId: employeeId },
        include: {
          blockedSlots: {
            where: {
              startTime: { gte: new Date(`${date}T00:00:00Z`) },
              endTime: { lte: new Date(`${date}T23:59:59Z`) },
            },
          },
        },
      }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ])

    if (!employeeProfile || !service) {
      return { success: false as const, error: "Employee or service not found" }
    }

    const dayName = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }).toLowerCase() as keyof WorkingHours

    const workingHours = normalizeWorkingHours(employeeProfile.workingHours)
    const daySchedule = workingHours[dayName]

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        employeeId,
        status: {
          notIn: [AppointmentStatus.cancelled, AppointmentStatus.no_show],
        },
        startTime: { gte: new Date(`${date}T00:00:00Z`) },
        endTime: { lte: new Date(`${date}T23:59:59Z`) },
      },
    })

    const slotDuration = service.duration + (employeeProfile.bufferMinutes ?? 0)
    const slots = generateAvailableSlotTimes({
      daySchedule,
      date,
      slotDuration,
      existingAppointments,
      blockedSlots: employeeProfile.blockedSlots,
    })

    return { success: true as const, data: slots }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
