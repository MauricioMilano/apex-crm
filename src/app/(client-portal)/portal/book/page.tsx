'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
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
      <PageHeader title="Book an Appointment" onBack={handleCancel} />

      <BookingFlow
        initialClientId={client?.id}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
