"use client";

import { useEffect, useState } from "react";
import { useCRM } from "@/contexts/crm-context";
import { ConfirmPaymentModal } from "@/components/payments/confirm-payment-modal";

/**
 * Global watcher that renders the ConfirmPaymentModal when
 * pendingPayment is set from any page (auto-open on completion
 * or manual trigger via triggerPaymentModal).
 */
export function PaymentModalWatcher() {
  const { pendingPayment, clearPendingPayment } = useCRM();
  const [open, setOpen] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [defaultAmount, setDefaultAmount] = useState(0);

  useEffect(() => {
    if (pendingPayment) {
      setAppointmentId(pendingPayment.appointmentId);
      setDefaultAmount(pendingPayment.defaultAmount);
      setOpen(true);
      clearPendingPayment();
    }
  }, [pendingPayment, clearPendingPayment]);

  function handleClose() {
    setOpen(false);
  }

  return (
    <ConfirmPaymentModal
      open={open}
      onOpenChange={handleClose}
      appointmentId={appointmentId}
      defaultAmount={defaultAmount}
    />
  );
}
