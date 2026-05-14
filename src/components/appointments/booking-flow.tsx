"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useCRM } from "@/contexts/crm-context";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Appointment } from "@/types";
import { getAggregatedAvailability, autoAllocateEmployee } from "@/actions/appointments";
import type { AggregatedSlot } from "@/actions/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format, addMinutes } from "date-fns";
import {
  CheckCircle,
  Clock,
  User,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  CreditCard,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanCoverage {
  isCovered: boolean;
  plans: Array<{
    subscriptionId: string;
    planName: string;
    planId: string;
    remaining: number;
    appointmentsUsed: number;
    maxPerPeriod: number;
  }>;
}

interface ServiceWithCoverage {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive: boolean;
  requiresPrepayment: boolean;
  interestRate?: number;
  planCoverage: PlanCoverage;
}

type Step = 1 | 2 | 3 | 4 | 5;

function formatSlotLabel(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

interface BookingFlowProps {
  initialClientId?: string;
  initialDate?: Date;
  initialTime?: string;
  onComplete: (appointment: Appointment) => void;
  onCancel: () => void;
}

export function BookingFlow({
  initialClientId,
  initialDate,
  initialTime,
  onComplete,
  onCancel,
}: BookingFlowProps) {
  const { services, users, clients, leads, addAppointment } =
    useCRM();
  const currentUser = useCurrentUser();

  const [step, setStep] = useState<Step>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    initialTime ?? null,
  );
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    initialClientId ?? null,
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [entityType, setEntityType] = useState<"client" | "lead">("client");
  const [servicesWithCoverage, setServicesWithCoverage] = useState<ServiceWithCoverage[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [planCoverageLoaded, setPlanCoverageLoaded] = useState(false);

  // Availability state
  const [availableSlots, setAvailableSlots] = useState<AggregatedSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dayCoverage, setDayCoverage] = useState(true);

  // Fetch available slots when date/service/employee changes
  useEffect(() => {
    if (!selectedDate || !selectedServiceId) {
      setAvailableSlots([]);
      setDayCoverage(true);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSelectedTime(null);

    async function fetchSlots() {
      try {
        const dateStr = format(selectedDate!, "yyyy-MM-dd");
        const result = await getAggregatedAvailability(
          selectedServiceId!,
          dateStr,
          selectedEmployeeId ?? undefined,
        );
        if (cancelled) return;
        if (result.success) {
          setAvailableSlots(result.data.slots);
          setDayCoverage(result.data.dayCoverage);
        } else {
          setAvailableSlots([]);
          setDayCoverage(false);
        }
      } catch {
        if (!cancelled) {
          setAvailableSlots([]);
          setDayCoverage(false);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }

    void fetchSlots();
    return () => { cancelled = true; };
  }, [selectedDate, selectedServiceId, selectedEmployeeId]);

  // Payment step state (for prepayment)
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string; code: string; requiresDocs: boolean; isActive: boolean }>>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [selectedInstallments, setSelectedInstallments] = useState(1);

  // Fetch available payment methods
  useEffect(() => {
    async function fetchMethods() {
      try {
        const res = await fetch("/api/v1/payment-methods");
        const json = await res.json();
        const data = (json?.data ?? json) as Array<{ id: string; name: string; code: string; requiresDocs: boolean; isActive: boolean }>;
        if (Array.isArray(data)) {
          setPaymentMethods(data.filter((m) => m.isActive));
        }
      } catch {
        // best-effort
      }
    }
    void fetchMethods();
  }, []);

  // Fetch plan coverage for the client
  const fetchPlanCoverage = useCallback(async () => {
    if (!selectedClientId) {
      setServicesWithCoverage([]);
      setPlanCoverageLoaded(true);
      return;
    }
    try {
      const res = await fetch(`/api/v1/services/with-plan-status?clientId=${selectedClientId}`);
      const json = await res.json();
      if (json.success) {
        setServicesWithCoverage(json.data);
      }
    } catch { /* use fallback below */ }
    setPlanCoverageLoaded(true);
  }, [selectedClientId]);

  useEffect(() => { void fetchPlanCoverage(); }, [fetchPlanCoverage]);

  // Use enriched services if available, fallback to plain services
  const displayServices: ServiceWithCoverage[] = planCoverageLoaded && servicesWithCoverage.length > 0
    ? servicesWithCoverage
    : services.filter((s) => s.isActive).map((s) => ({
        ...s,
        requiresPrepayment: (s as unknown as ServiceWithCoverage).requiresPrepayment ?? false,
        interestRate: (s as unknown as ServiceWithCoverage).interestRate,
        planCoverage: { isCovered: false, plans: [] },
      }));

  const activeServices = displayServices;
  const employees = users.filter(
    (u) => (u.role === "employee" || u.role === "admin") && u.isActive,
  );

  const filteredEntities = useMemo(() => {
    if (entityType === "client") {
      return clients.filter((c) => {
        if (!c.isActive) return false;
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        return (
          fullName.includes(query) ||
          (c.company || "").toLowerCase().includes(query) ||
          (c.email || "").toLowerCase().includes(query)
        );
      });
    } else {
      return leads.filter((l) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
        return (
          fullName.includes(query) ||
          (l.company || "").toLowerCase().includes(query) ||
          (l.email || "").toLowerCase().includes(query)
        );
      });
    }
  }, [clients, leads, searchQuery, entityType]);

  const selectedService = displayServices.find((s) => s.id === selectedServiceId);
  const selectedEmployee = users.find((u) => u.id === selectedEmployeeId);
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // Determine if payment step is needed
  const selectedServiceData = selectedService as ServiceWithCoverage | undefined;
  const needsPrepayment = selectedServiceData?.requiresPrepayment === true && !selectedServiceData?.planCoverage?.isCovered;

  function goNext() {
    if (needsPrepayment && step === 3) {
      setStep(4); // Go to Payment step
    } else if (needsPrepayment && step === 4) {
      setStep(5); // Go to Confirm step
    } else {
      setStep((s) => (s + 1) as Step);
    }
  }

  function goBack() {
    if (step === 1) {
      onCancel();
    } else {
      setStep((s) => (s - 1) as Step);
    }
  }

  function canAdvance(): boolean {
    if (step === 1) return !!selectedServiceId;
    if (step === 3) return !!selectedDate && !!selectedTime && dayCoverage;
    if (step === 4 && needsPrepayment) return !!selectedMethodId;
    if (step === 4 || (step === 5 && needsPrepayment)) {
      // Must select a subscription plan if service is covered by multiple plans
      const coverage = selectedService?.planCoverage;
      if (coverage?.isCovered && coverage.plans.length > 1 && !selectedSubscriptionId) {
        return true; // Allow proceeding, form will prompt
      }
    }
    return true;
  }

  async function handleConfirm() {
    if (
      !selectedServiceId ||
      !selectedDate ||
      !selectedTime ||
      (!selectedClientId && !selectedLeadId)
    )
      return;

    // Auto-allocate if no employee was selected
    let effectiveEmployeeId = selectedEmployeeId;
    if (!effectiveEmployeeId) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const allocation = await autoAllocateEmployee(selectedServiceId, dateStr, selectedTime);
      if (!allocation.success || !allocation.data) {
        return;
      }
      effectiveEmployeeId = allocation.data.employeeId;
    }

    const svc = displayServices.find((s) => s.id === selectedServiceId)!;

    const [h, m] = selectedTime.split(":").map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(h, m, 0, 0);
    const endTime = addMinutes(startTime, svc.duration);

    // Determine subscription to use
    const coverage = svc.planCoverage;
    let clientSubscriptionId: string | undefined;
    if (coverage?.isCovered) {
      if (coverage.plans.length === 1) {
        clientSubscriptionId = coverage.plans[0].subscriptionId;
      } else {
        clientSubscriptionId = selectedSubscriptionId ?? undefined;
      }
    }

    const appt = await addAppointment({
      organizationId: currentUser?.organizationId ?? "",
      clientId: selectedClientId ?? undefined,
      leadId: selectedLeadId ?? undefined,
      employeeId: effectiveEmployeeId,
      serviceId: selectedServiceId,
      clientSubscriptionId,
      status: "pending",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes,
    });

    // Create pending payment if prepayment is required
    if (needsPrepayment && selectedMethodId) {
      try {
        await fetch("/api/v1/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: svc.price,
            status: "pending",
            referenceType: "appointment",
            referenceId: appt.id,
            paymentMethodId: selectedMethodId,
            installments: selectedInstallments,
            description: `Prepayment for ${svc.name}`,
            paidAt: new Date().toISOString(),
          }),
        });
      } catch {
        // best-effort — non-blocking
      }
    }

    onComplete(appt);
  }

  const stepLabels: string[] = needsPrepayment
    ? ["Service", "Employee", "Date & Time", "Payment", "Confirm"]
    : ["Service", "Employee", "Date & Time", "Confirm"];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1 flex-1 last:flex-none"
          >
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm whitespace-nowrap",
                  idx + 1 === step
                    ? "text-primary"
                    : idx + 1 < step
                      ? "text-green-400"
                      : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  idx + 1 === step
                    ? "bg-primary text-primary-foreground"
                    : idx + 1 < step
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {idx + 1 < step ? <CheckCircle className="h-3 w-3" /> : idx + 1}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {idx < stepLabels.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-2",
                  idx + 1 < step ? "bg-green-500/50" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Select Service ── */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Select a Service</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeServices.map((svc) => {
              const coverage = (svc as ServiceWithCoverage).planCoverage;
              const isCovered = coverage?.isCovered;
              const planNames = coverage?.plans.map((p) => p.planName).join(", ");

              return (
                <button
                  key={svc.id}
                  onClick={() => {
                    setSelectedServiceId(svc.id);
                    // Auto-select single plan
                    if (coverage?.plans.length === 1) {
                      setSelectedSubscriptionId(coverage.plans[0].subscriptionId);
                    } else {
                      setSelectedSubscriptionId(null);
                    }
                  }}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all",
                    selectedServiceId === svc.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-border",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{svc.name}</span>
                    {selectedServiceId === svc.id && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {svc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {svc.duration} min
                    </span>
                    {isCovered ? (
                      <span className="text-primary font-medium text-xs flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Included {planNames ? `(${planNames})` : ""}
                      </span>
                    ) : (
                      <span className="text-green-400 font-medium">
                        ${Number(svc.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 2: Select Employee ── */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Select an Employee
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedEmployeeId(null)}
              className={cn(
                "text-left p-4 rounded-lg border transition-all",
                selectedEmployeeId === null
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-border",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Any Available</p>
                  <p className="text-xs text-muted-foreground">
                    Auto-assign to available staff
                  </p>
                </div>
                {selectedEmployeeId === null && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>

            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmployeeId(emp.id)}
                className={cn(
                  "text-left p-4 rounded-lg border transition-all",
                  selectedEmployeeId === emp.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-border",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-foreground font-medium text-sm shrink-0">
                    {emp.firstName?.[0] ?? ""}
                    {emp.lastName?.[0] ?? ""}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {emp.role}
                    </p>
                  </div>
                  {selectedEmployeeId === emp.id && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Select Date & Time ── */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Select Date & Time
          </h3>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex justify-center lg:justify-start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setSelectedTime(null);
                }}
                disabled={{ before: new Date() }}
                className="rounded-lg border border-border bg-background"
              />
            </div>

            {selectedDate && (
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-3">
                  Available slots for{" "}
                  <span className="text-foreground font-medium">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </span>
                </p>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                ) : !dayCoverage ? (
                  <div className="text-center py-12 text-muted-foreground/80 text-sm">
                    No employees available on this day. Pick another date.
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground/80 text-sm">
                    No available slots for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      const employeeCount = slot.employees.length;
                      return (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedTime(slot.time)}
                          className={cn(
                            "py-2 px-3 rounded-lg text-sm font-medium transition-all relative",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-card text-muted-foreground hover:bg-accent border border-border",
                          )}
                          title={
                            employeeCount > 1
                              ? `${employeeCount} employees available`
                              : employeeCount === 1
                                ? `${slot.employees[0].name} available`
                                : undefined
                          }
                        >
                          {formatSlotLabel(slot.time)}
                          {!selectedEmployeeId && employeeCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-foreground flex items-center justify-center">
                              {employeeCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!selectedDate && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground/80 text-sm">
                Pick a date to see available time slots
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Payment (only if prepayment required) ── */}
      {step === 4 && needsPrepayment && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Payment Method
          </h3>
          <p className="text-sm text-muted-foreground">
            This service requires prepayment. Select how the client will pay.
          </p>

          <div className="space-y-4">
            {/* Method selector */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground font-medium">Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethodId(method.id)}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-all",
                      selectedMethodId === method.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-border",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{method.name}</span>
                      {selectedMethodId === method.id && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/80 mt-0.5 capitalize">{method.code}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Installments (only for credit / requiresDocs) */}
            {(() => {
              const method = paymentMethods.find((m) => m.id === selectedMethodId);
              if (!method || (method.code !== "credit" && !method.requiresDocs)) return null;
              return (
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-medium">Installments</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => setSelectedInstallments(n)}
                        className={cn(
                          "py-2 rounded-lg text-sm font-medium transition-all",
                          selectedInstallments === n
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground hover:bg-accent border border-border",
                        )}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Step 4/5: Confirm ── */}
      {step === (needsPrepayment ? 5 : 4) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Confirm Appointment
          </h3>

          {/* Client/Lead selection (only if not pre-set) */}
          {!initialClientId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground font-medium">
                  Select {entityType === "client" ? "Client" : "Lead"}
                </label>
                {!selectedClientId && !selectedLeadId && (
                  <div className="flex bg-card rounded-md p-0.5 border border-border">
                    <button
                      onClick={() => {
                        setEntityType("client");
                        setSearchQuery("");
                      }}
                      className={cn(
                        "px-2 py-1 text-xs rounded-sm transition-colors",
                        entityType === "client"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Client
                    </button>
                    <button
                      onClick={() => {
                        setEntityType("lead");
                        setSearchQuery("");
                      }}
                      className={cn(
                        "px-2 py-1 text-xs rounded-sm transition-colors",
                        entityType === "lead"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Lead
                    </button>
                  </div>
                )}
              </div>

              {!selectedClientId && !selectedLeadId ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${entityType}s by name, email, or company...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-card border-border text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {filteredEntities.length > 0 ? (
                      filteredEntities.map((e) => (
                        <button
                          key={e.id}
                          onClick={() =>
                            entityType === "client"
                              ? setSelectedClientId(e.id)
                              : setSelectedLeadId(e.id)
                          }
                          className="text-left px-3 py-2 rounded-lg border text-sm transition-all border-border bg-card text-muted-foreground hover:border-border"
                        >
                          <span className="font-medium text-foreground block">
                            {e.firstName} {e.lastName}
                          </span>
                          {e.company && (
                            <span className="text-muted-foreground/80 text-xs block">
                              {e.company}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full py-4 text-center text-sm text-muted-foreground/80">
                        No {entityType}s found.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary bg-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {selectedClient
                          ? `${selectedClient.firstName} ${selectedClient.lastName}`
                          : `${selectedLead?.firstName} ${selectedLead?.lastName}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedClient
                          ? selectedClient.company || "Client"
                          : selectedLead?.company || "Lead"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedClientId(null);
                      setSelectedLeadId(null);
                      setSearchQuery("");
                    }}
                    className="text-muted-foreground hover:text-muted-foreground hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              {(selectedClient || selectedLead) && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    {selectedClient ? "Client:" : "Lead:"}
                  </span>
                  <span className="text-foreground font-medium">
                    {selectedClient
                      ? `${selectedClient.firstName} ${selectedClient.lastName}`
                      : `${selectedLead?.firstName} ${selectedLead?.lastName}`}
                  </span>
                </div>
              )}
              {selectedService && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Service:</span>
                    <span className="text-foreground">{selectedService.name}</span>
                    {(selectedService as ServiceWithCoverage).planCoverage?.isCovered ? (
                      <Badge
                        variant="outline"
                        className="text-primary border-primary/30 text-xs ml-auto"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Included
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-green-400 border-green-500/30 text-xs ml-auto"
                      >
                        ${Number(selectedService.price).toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="text-foreground">
                      {selectedService.duration} min
                    </span>
                  </div>

                  {/* Plan selector when multiple plans cover the same service */}
                  {(selectedService as ServiceWithCoverage).planCoverage?.isCovered &&
                    (selectedService as ServiceWithCoverage).planCoverage.plans.length > 1 && (
                    <div className="pt-2 border-t border-border">
                      <label className="text-sm text-muted-foreground font-medium block mb-2">
                        Use which plan?
                      </label>
                      <div className="space-y-1.5">
                        {(selectedService as ServiceWithCoverage).planCoverage.plans.map((p) => (
                          <button
                            key={p.subscriptionId}
                            onClick={() => setSelectedSubscriptionId(p.subscriptionId)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg border text-sm transition-all",
                              selectedSubscriptionId === p.subscriptionId
                                ? "border-primary bg-primary/10 text-primary/80"
                                : "border-border bg-card text-muted-foreground hover:border-border",
                            )}
                          >
                            <span className="font-medium">{p.planName}</span>
                            <span className="text-xs ml-2 text-muted-foreground/80">
                              ({p.remaining} remaining)
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedDate && selectedTime && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">When:</span>
                  <span className="text-foreground">
                    {format(selectedDate, "MMM d, yyyy")} at{" "}
                    {formatSlotLabel(selectedTime)}
                  </span>
                </div>
              )}
              {selectedEmployee && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">With:</span>
                  <span className="text-foreground">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </span>
                </div>
              )}
              {!selectedEmployee && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">With:</span>
                  <span className="text-foreground">Any available employee</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-medium">
              Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or special requests..."
              className="bg-card border-border text-foreground resize-none"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2 border-t border-border">
        <Button
          variant="ghost"
          onClick={goBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step < (needsPrepayment ? 5 : 4) ? (
          <Button
            onClick={goNext}
            disabled={!canAdvance()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={
              (!selectedClientId && !selectedLeadId) ||
              !selectedServiceId ||
              !selectedDate ||
              !selectedTime
            }
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm Booking
          </Button>
        )}
      </div>
    </div>
  );
}
