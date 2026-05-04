import assert from "node:assert/strict"
import test from "node:test"

import {
  createSeedWorkingHours,
  generateAvailableSlotTimes,
  normalizeWorkingHours,
} from "@/lib/working-hours"

test("seed working-hours use the canonical shape", () => {
  const workingHours = createSeedWorkingHours()

  assert.equal(workingHours.monday.isWorking, true)
  assert.deepEqual(Object.keys(workingHours.monday).sort(), ["endTime", "isWorking", "startTime"])
  assert.equal(workingHours.friday.endTime, "16:00")
  assert.equal(workingHours.saturday.isWorking, false)
})

test("legacy or malformed working-hours fall back to closed days", () => {
  const normalized = normalizeWorkingHours({
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { isWorking: true, startTime: "09:00" },
  })

  assert.equal(normalized.monday.isWorking, false)
  assert.equal(normalized.tuesday.isWorking, false)
  assert.equal(normalized.wednesday.isWorking, false)
})

test("slot generation respects working-hours and conflicts", () => {
  const slots = generateAvailableSlotTimes({
    daySchedule: { isWorking: true, startTime: "09:00", endTime: "11:00" },
    date: "2026-05-04",
    slotDuration: 30,
    existingAppointments: [
      { startTime: new Date("2026-05-04T09:30:00Z"), endTime: new Date("2026-05-04T10:00:00Z") },
    ],
    blockedSlots: [{ startTime: new Date("2026-05-04T10:30:00Z"), endTime: new Date("2026-05-04T11:00:00Z") }],
  })

  assert.deepEqual(slots, ["09:00", "10:00"])
})
