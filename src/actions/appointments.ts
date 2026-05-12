"use server"

import { z } from "zod"
import { AppointmentStatus, Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { generateAvailableSlotTimes, normalizeWorkingHours } from "@/lib/working-hours"
import { sendEmail } from "@/lib/email/send"
import { scheduleEmail, cancelScheduledEmails } from "@/lib/email/scheduler"
import { format } from "date-fns"
import type { WorkingHours } from "@/types"

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "org_default"

const createAppointmentSchema = z.object({
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  employeeId: z.string().min(1),
  serviceId: z.string().min(1),
  clientSubscriptionId: z.string().optional(),
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

    const { clientSubscriptionId, ...appointmentData } = parsed.data

    // If using a subscription, verify it's active and has remaining appointments
    if (clientSubscriptionId) {
      const sub = await prisma.clientSubscription.findUnique({
        where: { id: clientSubscriptionId },
        include: { plan: true },
      })
      if (!sub || sub.status !== "active") {
        return { success: false as const, error: "Subscription is not active" }
      }

      const planService = await prisma.subscriptionPlanService.findFirst({
        where: { planId: sub.planId, serviceId: appointmentData.serviceId },
      })

      const globalLimit = sub.plan.maxApptsPerPeriod
      const perServiceLimit = planService?.maxPerPeriod
      const remaining = Math.min(
        globalLimit != null ? globalLimit - sub.appointmentsUsed : Infinity,
        perServiceLimit != null ? perServiceLimit - sub.appointmentsUsed : Infinity,
      )

      if (remaining <= 0) {
        return {
          success: false as const,
          error: "Subscription has reached its appointment limit for this period",
        }
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...appointmentData,
        clientSubscriptionId: clientSubscriptionId ?? null,
        organizationId: ORG_ID,
        startTime: new Date(appointmentData.startTime),
        endTime: new Date(appointmentData.endTime),
      },
      include: { client: true, lead: true, employee: true, service: true, location: true },
    })

    // Increment subscription usage counter
    if (clientSubscriptionId) {
      await prisma.clientSubscription.update({
        where: { id: clientSubscriptionId },
        data: { appointmentsUsed: { increment: 1 } },
      })
    }

    // Send confirmation email if client has an email
    if (appointment.client?.email) {
      const startTime = new Date(appointment.startTime)
      void sendEmail({
        templateName: "appointment-confirmed",
        to: appointment.client.email,
        variables: {
          clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
          date: format(startTime, "MMMM d, yyyy"),
          time: format(startTime, "h:mm a"),
          serviceName: appointment.service?.name ?? "Appointment",
          employeeName: appointment.employee
            ? `${appointment.employee.firstName} ${appointment.employee.lastName}`
            : "Our team",
          locationName: appointment.location?.name ?? "our office",
          orgName: "Apex Business Solutions",
        },
      })

      // Schedule reminder for 24h before appointment
      const reminderTime = new Date(startTime.getTime() - 24 * 60 * 60 * 1000)
      if (reminderTime > new Date()) {
        void scheduleEmail({
          templateName: "appointment-reminder",
          to: appointment.client.email,
          variables: {
            clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
            serviceName: appointment.service?.name ?? "Appointment",
            date: format(startTime, "MMMM d, yyyy"),
            time: format(startTime, "h:mm a"),
            employeeName: appointment.employee
              ? `${appointment.employee.firstName} ${appointment.employee.lastName}`
              : "Our team",
            locationName: appointment.location?.name ?? "our office",
            orgName: "Apex Business Solutions",
          },
          scheduledFor: reminderTime,
          referenceType: "appointment",
          referenceId: appointment.id,
        })
      }
    }

    // Check subscription limit warning
    if (clientSubscriptionId) {
      const sub = await prisma.clientSubscription.findUnique({
        where: { id: clientSubscriptionId },
        include: { plan: true, client: true },
      })
      if (sub && sub.client.email && sub.plan.maxApptsPerPeriod) {
        const limit = sub.plan.maxApptsPerPeriod
        const used = sub.appointmentsUsed + 1 // already incremented above
        const usagePercent = (used / limit) * 100

        if (usagePercent >= 80) {
          // Check if warning already sent this period (avoid duplicates)
          const existingWarning = await prisma.emailSchedule.findFirst({
            where: {
              templateName: "subscription-limit-warning",
              referenceType: "subscription",
              referenceId: sub.id,
              sentAt: null,
            },
          })
          if (!existingWarning) {
            void sendEmail({
              templateName: "subscription-limit-warning",
              to: sub.client.email,
              variables: {
                clientName: `${sub.client.firstName} ${sub.client.lastName}`,
                planName: sub.plan.name,
                used: String(used),
                max: String(limit),
                remaining: String(limit - used),
                orgName: "Apex Business Solutions",
              },
            })
          }
        }
      }
    }

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
    // Fetch current appointment to detect changes
    const current = await prisma.appointment.findUnique({
      where: { id },
      select: { startTime: true },
    })

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
      include: { client: true, lead: true, employee: true, service: true },
    })

    // Detect reschedule (startTime changed)
    if (data.startTime && current && current.startTime.toISOString() !== new Date(data.startTime).toISOString()) {
      const recipientEmail = appointment.client?.email ?? appointment.lead?.email
      if (recipientEmail) {
        const oldStart = current.startTime
        const newStart = new Date(data.startTime)
        void sendEmail({
          templateName: "appointment-rescheduled",
          to: recipientEmail,
          variables: {
            clientName: appointment.client
              ? `${appointment.client.firstName} ${appointment.client.lastName}`
              : "Valued client",
            serviceName: appointment.service?.name ?? "Appointment",
            oldDate: format(oldStart, "MMMM d, yyyy"),
            oldTime: format(oldStart, "h:mm a"),
            newDate: format(newStart, "MMMM d, yyyy"),
            newTime: format(newStart, "h:mm a"),
            employeeName: appointment.employee
              ? `${appointment.employee.firstName} ${appointment.employee.lastName}`
              : "Our team",
            orgName: "Apex Business Solutions",
          },
        })
      }
    }

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
      include: { client: true, lead: true, employee: true, service: true, location: true },
    })

    // ── Send status-based emails ────────────────────────────────────────
    if (status === "cancelled") {
      const recipientEmail = appointment.client?.email ?? appointment.lead?.email
      if (recipientEmail) {
        const startTime = new Date(appointment.startTime)
        void sendEmail({
          templateName: "appointment-cancelled",
          to: [recipientEmail, appointment.employee.email].filter(Boolean) as string[],
          variables: {
            clientName: appointment.client
              ? `${appointment.client.firstName} ${appointment.client.lastName}`
              : appointment.lead
                ? `${appointment.lead.firstName} ${appointment.lead.lastName}`
                : "Valued client",
            serviceName: appointment.service?.name ?? "Appointment",
            date: format(startTime, "MMMM d, yyyy"),
            time: format(startTime, "h:mm a"),
            reason: cancelReason ?? "Not specified",
            orgName: "Apex Business Solutions",
          },
        })
      }
      // Cancel any pending reminder schedules
      void cancelScheduledEmails("appointment", id)
    }

    if (status === "completed" && appointment.client?.email) {
      const startTime = new Date(appointment.startTime)
      void sendEmail({
        templateName: "appointment-completed",
        to: appointment.client.email,
        variables: {
          clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
          serviceName: appointment.service?.name ?? "Appointment",
          date: format(startTime, "MMMM d, yyyy"),
          employeeName: appointment.employee
            ? `${appointment.employee.firstName} ${appointment.employee.lastName}`
            : "Our team",
          orgName: "Apex Business Solutions",
          feedbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/portal/feedback/${id}`,
        },
      })
    }

    if (status === "no_show" && appointment.client?.email) {
      const startTime = new Date(appointment.startTime)
      void sendEmail({
        templateName: "appointment-no-show",
        to: appointment.client.email,
        variables: {
          clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
          serviceName: appointment.service?.name ?? "Appointment",
          date: format(startTime, "MMMM d, yyyy"),
          time: format(startTime, "h:mm a"),
          orgName: "Apex Business Solutions",
        },
      })
    }

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
