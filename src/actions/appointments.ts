"use server"

import { z } from "zod"
import { AppointmentStatus, Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { generateAvailableSlotTimes, resolveWorkingHours } from "@/lib/working-hours"
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
  data: Partial<CreateAppointmentInput & { status?: AppointmentStatus }>
) {
  try {
    // Fetch current appointment to detect changes
    const current = await prisma.appointment.findUnique({
      where: { id },
      select: { startTime: true, status: true },
    })

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
      include: { client: true, lead: true, employee: true, service: true, location: true },
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

    // ── Determine if payment modal should open ────────────────────────
    let openPaymentModal = false
    let defaultPaymentAmount: number | undefined
    if (
      data.status === "completed" &&
      !appointment.clientSubscriptionId &&
      appointment.service
    ) {
      const existingPrepayment = await prisma.payment.findFirst({
        where: {
          referenceType: "appointment",
          referenceId: appointment.id,
          status: "pending",
        },
      })
      if (!existingPrepayment) {
        openPaymentModal = true
        defaultPaymentAmount = Number(appointment.service.price)
      }
    }

    return {
      success: true as const,
      data: {
        ...appointment,
        openPaymentModal,
        defaultPaymentAmount,
      },
    }
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

    // ── Determine if payment modal should open ──────────────────────────
    let openPaymentModal = false
    let defaultPaymentAmount: number | undefined
    if (status === "completed" && !appointment.clientSubscriptionId && appointment.service) {
      // Check if there's already a prepayment (payment with status pending)
      const existingPrepayment = await prisma.payment.findFirst({
        where: {
          referenceType: "appointment",
          referenceId: appointment.id,
          status: "pending",
        },
      })
      if (!existingPrepayment) {
        openPaymentModal = true
        defaultPaymentAmount = Number(appointment.service.price)
      }
    }

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

    return {
      success: true as const,
      data: {
        ...appointment,
        openPaymentModal,
        defaultPaymentAmount,
      },
    }
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
    const [employeeProfile, service, orgSettings] = await Promise.all([
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
      prisma.organizationSetting.findUnique({
        where: { organizationId: ORG_ID },
        select: { defaultWorkingHours: true },
      }),
    ])

    if (!service) {
      return { success: false as const, error: "Service not found" }
    }

    const resolvedHours = resolveWorkingHours(
      employeeProfile?.workingHours,
      orgSettings?.defaultWorkingHours,
    )

    const dayName = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }).toLowerCase() as keyof WorkingHours

    const daySchedule = resolvedHours[dayName]

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

    const slotDuration = service.duration + (employeeProfile?.bufferMinutes ?? 0)
    const slots = generateAvailableSlotTimes({
      daySchedule,
      date,
      slotDuration,
      existingAppointments,
      blockedSlots: employeeProfile?.blockedSlots ?? [],
    })

    return { success: true as const, data: slots }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}

/**
 * Available slot entry with employee attribution.
 */
export type AggregatedSlot = {
  time: string
  employees: Array<{ id: string; name: string }>
}

/**
 * Result of aggregated availability query.
 */
export type AggregatedAvailability = {
  dayCoverage: boolean
  slots: AggregatedSlot[]
}

/**
 * Get aggregated availability across all employees (or a specific one)
 * for a given service and date. Returns which employees are available at each slot.
 */
export async function getAggregatedAvailability(
  serviceId: string,
  date: string,
  employeeId?: string,
) {
  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) {
      return { success: false as const, error: "Service not found" } as const
    }

    // Get eligible employees
    const employeeWhere = employeeId
      ? { userId: employeeId }
      : { services: { some: { serviceId } }, user: { isActive: true } }

    const employeeProfiles = await prisma.employeeProfile.findMany({
      where: employeeWhere,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        blockedSlots: {
          where: {
            startTime: { gte: new Date(`${date}T00:00:00Z`) },
            endTime: { lte: new Date(`${date}T23:59:59Z`) },
          },
        },
      },
    })

    if (employeeProfiles.length === 0) {
      return {
        success: true as const,
        data: { dayCoverage: false, slots: [] } satisfies AggregatedAvailability,
      } as const
    }

    // Get org default hours
    const orgSettings = await prisma.organizationSetting.findUnique({
      where: { organizationId: ORG_ID },
      select: { defaultWorkingHours: true },
    })

    // Get existing appointments for all relevant employees on this date
    const employeeIds = employeeProfiles.map((ep) => ep.userId)
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: { notIn: [AppointmentStatus.cancelled, AppointmentStatus.no_show] },
        startTime: { gte: new Date(`${date}T00:00:00Z`) },
        endTime: { lte: new Date(`${date}T23:59:59Z`) },
      },
    })

    const dayName = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }).toLowerCase() as keyof WorkingHours

    const slotDuration = service.duration

    // Build slot → employees map
    const slotEmployees = new Map<string, Array<{ id: string; name: string }>>()
    let anyWorking = false

    for (const profile of employeeProfiles) {
      const resolvedHours = resolveWorkingHours(
        profile.workingHours,
        orgSettings?.defaultWorkingHours,
      )
      const daySchedule = resolvedHours[dayName]

      const employeeAppts = existingAppointments.filter(
        (a) => a.employeeId === profile.user.id,
      )

      const slots = generateAvailableSlotTimes({
        daySchedule,
        date,
        slotDuration,
        existingAppointments: employeeAppts,
        blockedSlots: profile.blockedSlots,
      })

      if (slots.length > 0) anyWorking = true

      const employeeInfo = {
        id: profile.user.id,
        name: `${profile.user.firstName} ${profile.user.lastName}`,
      }

      for (const time of slots) {
        const existing = slotEmployees.get(time) ?? []
        existing.push(employeeInfo)
        slotEmployees.set(time, existing)
      }
    }

    // Sort slots by time
    const sortedSlots = Array.from(slotEmployees.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, employees]) => ({ time, employees }))

    return {
      success: true as const,
      data: {
        dayCoverage: anyWorking && sortedSlots.length > 0,
        slots: sortedSlots,
      } satisfies AggregatedAvailability,
    } as const
  } catch (error) {
    return { success: false as const, error: String(error) } as const
  }
}

/**
 * Auto-allocate the best employee for a given service, date, and time.
 * Uses least-busy heuristic: picks the employee with the fewest appointments
 * on that day among those available at the requested time.
 */
export async function autoAllocateEmployee(
  serviceId: string,
  date: string,
  time: string,
) {
  try {
    const availability = await getAggregatedAvailability(serviceId, date)
    if (!availability.success) {
      return { success: false as const, error: availability.error } as const
    }

    const slot = availability.data.slots.find((s) => s.time === time)
    if (!slot || slot.employees.length === 0) {
      return {
        success: false as const,
        error: "No employees available at the requested time",
      } as const
    }

    if (slot.employees.length === 1) {
      return { success: true as const, data: { employeeId: slot.employees[0].id } } as const
    }

    // Least-busy: count appointments per employee on this date
    const employeeIds = slot.employees.map((e) => e.id)
    const appointmentCounts = await prisma.appointment.groupBy({
      by: ["employeeId"],
      where: {
        employeeId: { in: employeeIds },
        status: { notIn: [AppointmentStatus.cancelled, AppointmentStatus.no_show] },
        startTime: { gte: new Date(`${date}T00:00:00Z`) },
        endTime: { lte: new Date(`${date}T23:59:59Z`) },
      },
      _count: { id: true },
    })

    const countMap = new Map(appointmentCounts.map((c) => [c.employeeId, c._count.id]))
    let bestEmployee = slot.employees[0]
    let leastBusy = countMap.get(bestEmployee.id) ?? 0

    for (let i = 1; i < slot.employees.length; i++) {
      const empCount = countMap.get(slot.employees[i].id) ?? 0
      if (empCount < leastBusy) {
        leastBusy = empCount
        bestEmployee = slot.employees[i]
      }
    }

    return { success: true as const, data: { employeeId: bestEmployee.id } } as const
  } catch (error) {
    return { success: false as const, error: String(error) } as const
  }
}
