"use client";

import { useState, useEffect, useMemo } from "react";
import type { PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calculateInstallments, formatInstallmentLabel } from "@/lib/payment";
import { useOrgFormat } from "@/hooks/use-org-format";
import { CreditCard, DollarSign } from "lucide-react";

interface ConfirmPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  defaultAmount: number;
  onConfirm?: () => void;
}

export function ConfirmPaymentModal({
  open,
  onOpenChange,
  appointmentId,
  defaultAmount,
  onConfirm,
}: ConfirmPaymentModalProps) {
  const { formatCurrency } = useOrgFormat();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState(String(defaultAmount));
  const [methodId, setMethodId] = useState<string>("");
  const [installments, setInstallments] = useState(1);
  const [cardLastFour, setCardLastFour] = useState("");
  const [description, setDescription] = useState("");

  // Fetch payment methods
  useEffect(() => {
    if (!open) return;
    async function fetchMethods() {
      try {
        const res = await fetch("/api/v1/payment-methods");
        const json = await res.json();
        const data = (json?.data ?? json) as PaymentMethod[];
        const methods = Array.isArray(data) ? data : [];
        setPaymentMethods(methods);
        // Set default method to first active one
        if (methods.length > 0 && !methodId) {
          setMethodId(methods[0].id);
        }
      } catch {
        // best-effort
      }
    }
    void fetchMethods();
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount(String(defaultAmount));
      setInstallments(1);
      setCardLastFour("");
      setDescription("");
    }
  }, [open, defaultAmount]);

  const selectedMethod = paymentMethods.find((m) => m.id === methodId);
  const isCredit =
    selectedMethod?.code === "credit" || selectedMethod?.requiresDocs;
  const numericAmount = parseFloat(amount) || 0;

  const installmentOptions = useMemo(() => {
    if (!isCredit || numericAmount <= 0) return [];
    const effectiveRate = 2.0; // Will be fetched from org settings
    const maxInstallments = 12;
    return Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => {
      const [first] = calculateInstallments(numericAmount, n, effectiveRate);
      return {
        value: n,
        label: formatInstallmentLabel(n, first?.value ?? 0, effectiveRate),
      };
    });
  }, [isCredit, numericAmount]);

  async function handleConfirm() {
    if (!amount || numericAmount <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          status: "completed",
          referenceType: "appointment",
          referenceId: appointmentId,
          paymentMethodId: methodId || undefined,
          installments: isCredit ? installments : 1,
          cardLastFour: cardLastFour || undefined,
          description: description || `Payment for appointment`,
          paidAt: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success || json.id) {
        onOpenChange(false);
        onConfirm?.();
      }
    } catch {
      // best-effort
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            Confirm Payment
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Record payment for this completed appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount */}
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white pl-7"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">Payment Method</Label>
            <Select value={methodId} onValueChange={setMethodId}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {paymentMethods
                  .filter((m) => m.isActive)
                  .map((m) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className="text-gray-200"
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5" />
                        {m.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Installments (only for credit / requiresDocs methods) */}
          {isCredit && (
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs">
                Installments
              </Label>
              <Select
                value={String(installments)}
                onValueChange={(v) => setInstallments(Number(v))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  {installmentOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={String(opt.value)}
                      className="text-gray-200"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {numericAmount > 0 && installments > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Total: {formatCurrency(numericAmount)} &middot;{" "}
                  {installments}x of{" "}
                  {formatCurrency(numericAmount / installments)} each
                </p>
              )}
            </div>
          )}

          {/* Card Last Four (optional) */}
          {isCredit && (
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs">
                Last 4 digits <span className="text-gray-600">(optional)</span>
              </Label>
              <Input
                type="text"
                maxLength={4}
                value={cardLastFour}
                onChange={(e) =>
                  setCardLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="1234"
                className="bg-gray-800 border-gray-700 text-white w-24"
              />
            </div>
          )}

          {/* Description (optional) */}
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">
              Description <span className="text-gray-600">(optional)</span>
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Payment for service"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              submitting ||
              !methodId ||
              numericAmount <= 0
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? "Saving..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
