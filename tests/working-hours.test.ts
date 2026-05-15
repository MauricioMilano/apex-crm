import { describe, it, expect } from "vitest"

import {
  createSeedWorkingHours,
  generateAvailableSlotTimes,
  normalizeWorkingHours,
} from "@/lib/working-hours"

describe("working-hours", () => {
  it("seed working-hours use the canonical shape", () => {
    const workingHours = createSeedWorkingHours()

    expect(workingHours.monday.isWorking).toBe(true)
    expect(Object.keys(workingHours.monday).sort()).toEqual(["endTime", "isWorking", "startTime"])
    expect(workingHours.friday.endTime).toBe("16:00")
    expect(workingHours.saturday.isWorking).toBe(false)
  })

  it("legacy or malformed working-hours fall back to closed days", () => {
    const normalized = normalizeWorkingHours({
      monday: { enabled: true, start: "09:00", end: "17:00" },
      tuesday: { isWorking: true, startTime: "09:00" },
    })

    expect(normalized.monday.isWorking).toBe(false)
    expect(normalized.tuesday.isWorking).toBe(false)
    expect(normalized.wednesday.isWorking).toBe(false)
  })

  it("slot generation respects working-hours and conflicts", () => {
    const slots = generateAvailableSlotTimes({
      daySchedule: { isWorking: true, startTime: "09:00", endTime: "11:00" },
      date: "2026-05-04",
      slotDuration: 30,
      existingAppointments: [
        { startTime: new Date("2026-05-04T09:30:00Z"), endTime: new Date("2026-05-04T10:00:00Z") },
      ],
      blockedSlots: [{ startTime: new Date("2026-05-04T10:30:00Z"), endTime: new Date("2026-05-04T11:00:00Z") }],
    })

    expect(slots).toEqual(["09:00", "10:00"])
  })
})
