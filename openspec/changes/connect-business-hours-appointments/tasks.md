## 1. DB — Schema changes

- [x] 1.1 Add `defaultWorkingHours Json @default("{}")` field to `OrganizationSetting` model in `prisma/schema.prisma`
- [x] 1.2 Run `pnpm db:migrate` to create the migration
- [x] 1.3 Run `pnpm db:generate` to regenerate Prisma client

## 2. Backend — Working hours persistence

- [x] 2.1 Create `src/actions/working-hours.ts` with `updateEmployeeWorkingHours(userId: string, workingHours: WorkingHours)` server action that upserts `EmployeeProfile.workingHours`
- [x] 2.2 Add Zod schema validation to ensure each day has valid `isWorking` boolean and `startTime`/`endTime` 24h format strings
- [x] 2.3 Add `getEmployeeWorkingHours(userId: string)` server action that returns employee hours with org fallback logic (employee → org default → closed)

## 3. Backend — Aggregated availability

- [x] 3.1 Create `getAggregatedAvailability(serviceId: string, date: string, employeeId?: string)` server action in `src/actions/appointments.ts`
- [x] 3.2 Query all employees linked to the service via `EmployeeService` (or single employee if specified)
- [x] 3.3 For each employee, compute availability by intersecting: working hours (with full fallback chain) − blocked slots − existing non-cancelled appointments
- [x] 3.4 Return `{ slots: Record<string, { time: string, employees: Array<{id, name}> }>, dayCoverage: boolean }` where slots are 30min granularity
- [x] 3.5 Create `autoAllocateEmployee(serviceId: string, date: string, time: string)` that picks the least-busy employee from the available set and returns their ID
- [x] 4.1 Update `getAvailableSlots()` to use org default working hours as fallback when employee has no custom hours
- [x] 4.2 Ensure `normalizeWorkingHours` in `src/lib/working-hours.ts` accepts an optional org default parameter for the fallback chain

## 5. Frontend — Team Settings working hours

- [x] 5.1 Update `src/app/(dashboard)/settings/team/page.tsx` to load employee working hours from `getEmployeeWorkingHours()` instead of localStorage on editor open
- [x] 5.2 Replace localStorage save calls with `updateEmployeeWorkingHours()` server action
- [x] 5.3 Add loading/error states for the hours editor
- [x] 5.4 Remove the localStorage-related code (`HOURS_KEY`, `loadHours`, `saveHours` functions)

## 6. Frontend — BookingFlow real availability

- [x] 6.1 In `src/components/appointments/booking-flow.tsx`, step 3: replace hardcoded `TIME_SLOTS` with fetched availability from `getAggregatedAvailability`
- [x] 6.2 Disable dates in the calendar where `dayCoverage` is false, using function-based `disabled` prop on `react-day-picker`
- [x] 6.3 Add loading state when fetching slots for a selected date
- [x] 6.4 When a slot with multiple employees is selected and "Any Available" is on, store the slot info for auto-allocation at confirm time
- [x] 6.5 On confirm with "Any Available", call `autoAllocateEmployee` to get the assigned employee ID before creating the appointment
- [x] 6.6 Remove the unused `takenSlots` useMemo since availability is now server-driven

## 7. Frontend — CalendarGrid respects working hours

- [x] 7.1 In `src/components/calendar/calendar-grid.tsx`, fetch availability for the visible week days
- [x] 7.2 Compute the effective working hour range from employee working hours
- [x] 7.3 Dim/gray non-working hour slots in the week grid
- [x] 7.4 Show "Closed" overlay on day columns with zero coverage
- [x] 7.5 Remove or disable click-to-book on non-working/dimmed slots

## 8. Frontend — Detail page reschedule

- [x] 8.1 In `src/app/(dashboard)/appointments/[id]/page.tsx`, replace hardcoded `TIME_SLOTS` in the reschedule section with fetched availability
- [x] 8.2 Disable dates without coverage for the appointment's employee
- [x] 8.3 Add loading state for slot fetching in the reschedule panel

## 9. Testing

- [ ] 9.1 Write unit tests for `normalizeWorkingHours` fallback chain (employee hours, org default, closed)
- [ ] 9.2 Write unit tests for `generateAvailableSlotTimes` with blocked slots and appointment conflicts
- [ ] 9.3 Write unit tests for `getAggregatedAvailability` with multiple employees, different schedules, and service matching
- [ ] 9.4 Write unit tests for `autoAllocateEmployee` (least-busy selection, edge cases)

## 10. Validation & cleanup

- [x] 10.1 Run `pnpm exec tsc --noEmit` and fix any type errors
- [x] 10.2 Run `pnpm lint` and fix lint warnings (no new warnings in modified files)
- [x] 10.3 Run `pnpm build` to verify production build
- [ ] 10.4 Verify booking flow end-to-end: select service → employee → date → time → confirm
- [ ] 10.5 Verify reschedule on detail page works
- [ ] 10.6 Verify calendar grid shows correct hours and closed days
- [ ] 10.7 Verify team settings hours persist and load correctly
