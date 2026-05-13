import type { DaySchedule, WorkingHours } from "@/types"

export type TimeRange = {
  startTime: Date
  endTime: Date
}

const DEFAULT_OPEN_DAY: DaySchedule = {
  isWorking: true,
  startTime: "09:00",
  endTime: "17:00",
}

const DEFAULT_CLOSED_DAY: DaySchedule = {
  isWorking: false,
  startTime: "09:00",
  endTime: "17:00",
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isTimeString(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value)
}

function createClosedDay(): DaySchedule {
  return { ...DEFAULT_CLOSED_DAY }
}

export function createDefaultWorkingHours(): WorkingHours {
  return {
    monday: { ...DEFAULT_OPEN_DAY },
    tuesday: { ...DEFAULT_OPEN_DAY },
    wednesday: { ...DEFAULT_OPEN_DAY },
    thursday: { ...DEFAULT_OPEN_DAY },
    friday: { ...DEFAULT_OPEN_DAY },
    saturday: { ...DEFAULT_CLOSED_DAY },
    sunday: { ...DEFAULT_CLOSED_DAY },
  }
}

export function createSeedWorkingHours(): WorkingHours {
  return {
    monday: { ...DEFAULT_OPEN_DAY },
    tuesday: { ...DEFAULT_OPEN_DAY },
    wednesday: { ...DEFAULT_OPEN_DAY },
    thursday: { ...DEFAULT_OPEN_DAY },
    friday: { ...DEFAULT_OPEN_DAY, endTime: "16:00" },
    saturday: { isWorking: false, startTime: "10:00", endTime: "14:00" },
    sunday: { isWorking: false, startTime: "10:00", endTime: "14:00" },
  }
}

export function createClosedWorkingHours(): WorkingHours {
  return {
    monday: createClosedDay(),
    tuesday: createClosedDay(),
    wednesday: createClosedDay(),
    thursday: createClosedDay(),
    friday: createClosedDay(),
    saturday: createClosedDay(),
    sunday: createClosedDay(),
  }
}

export function normalizeDaySchedule(value: unknown): DaySchedule {
  if (!isPlainObject(value)) {
    return createClosedDay()
  }

  if (typeof value.isWorking !== "boolean" || !isTimeString(value.startTime) || !isTimeString(value.endTime)) {
    return createClosedDay()
  }

  return {
    isWorking: value.isWorking,
    startTime: value.startTime,
    endTime: value.endTime,
  }
}

export function normalizeWorkingHours(value: unknown, orgDefault?: unknown): WorkingHours {
  if (!isPlainObject(value)) {
    // Fall back to org default if provided, otherwise closed
    if (orgDefault !== undefined) {
      const orgHours = normalizeWorkingHours(orgDefault)
      const hasWorkingDays = Object.values(orgHours).some((d) => d.isWorking)
      if (hasWorkingDays) return orgHours
    }
    return createClosedWorkingHours()
  }

  return {
    monday: normalizeDaySchedule(value.monday),
    tuesday: normalizeDaySchedule(value.tuesday),
    wednesday: normalizeDaySchedule(value.wednesday),
    thursday: normalizeDaySchedule(value.thursday),
    friday: normalizeDaySchedule(value.friday),
    saturday: normalizeDaySchedule(value.saturday),
    sunday: normalizeDaySchedule(value.sunday),
  }
}

/**
 * Resolve effective working hours using the fallback chain:
 * employee custom hours → org default hours → all closed
 * Only falls back if employee has NO working days configured (all closed).
 */
export function resolveWorkingHours(
  employeeHours: unknown,
  orgDefaultHours: unknown,
): WorkingHours {
  const employee = normalizeWorkingHours(employeeHours)
  const hasEmployeeCustom = Object.values(employee).some((d) => d.isWorking)
  if (hasEmployeeCustom) return employee

  const org = normalizeWorkingHours(orgDefaultHours)
  const hasOrgDefault = Object.values(org).some((d) => d.isWorking)
  if (hasOrgDefault) return org

  return createClosedWorkingHours()
}

export function generateAvailableSlotTimes({
  daySchedule,
  date,
  slotDuration,
  existingAppointments = [],
  blockedSlots = [],
}: {
  daySchedule: DaySchedule
  date: string
  slotDuration: number
  existingAppointments?: TimeRange[]
  blockedSlots?: TimeRange[]
}) {
  if (!daySchedule.isWorking) {
    return []
  }

  const [startHour, startMin] = daySchedule.startTime.split(":").map(Number)
  const [endHour, endMin] = daySchedule.endTime.split(":").map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  const slots: string[] = []

  for (let minutes = startMinutes; minutes + slotDuration <= endMinutes; minutes += 30) {
    const slotStart = new Date(`${date}T00:00:00Z`)
    slotStart.setUTCMinutes(slotStart.getUTCMinutes() + minutes)
    const slotEnd = new Date(slotStart)
    slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + slotDuration)

    const hasAppointmentConflict = existingAppointments.some(
      (appointment) => slotStart < appointment.endTime && slotEnd > appointment.startTime
    )

    const isBlocked = blockedSlots.some((block) => slotStart < block.endTime && slotEnd > block.startTime)

    if (!hasAppointmentConflict && !isBlocked) {
      const hours = Math.floor(minutes / 60).toString().padStart(2, "0")
      const mins = (minutes % 60).toString().padStart(2, "0")
      slots.push(`${hours}:${mins}`)
    }
  }

  return slots
}
