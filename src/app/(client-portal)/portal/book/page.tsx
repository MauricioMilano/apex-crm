'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCRM } from '@/contexts/crm-context';
import { BookingFlow } from '@/components/appointments/booking-flow';
import type { Appointment } from '@/types';

export default function ClientPortalBookPage() {
  const { currentUser } = useAuth();
  const { clients } = useCRM();
  const router = useRouter();

  const client = useMemo(
    () =>
      clients.find(
        (c) => c.email?.toLowerCase() === currentUser?.email?.toLowerCase(),
      ),
    [clients, currentUser],
  );

  const handleComplete = (_: Appointment) => {
    toast.success('Appointment booked successfully!');
    router.push('/portal/appointments');
  };

  const handleCancel = () => {
    router.push('/portal/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Book an Appointment</h1>
        <p className="text-muted-foreground mt-1">
          Choose a service and time that works for you.
        </p>
      </div>

      <BookingFlow
        initialClientId={client?.id}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
