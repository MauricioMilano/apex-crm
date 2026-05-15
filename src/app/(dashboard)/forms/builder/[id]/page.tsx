'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/contexts/crm-context';
import { FormBuilder } from '@/components/forms/form-builder';
import { Form } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FormBuilderPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { forms } = useCRM();

  const form = forms.find((f) => f.id === id);
  const formName = form?.name ?? 'New Form';

  const handleSave = (_: Form) => {
    toast.success('Form saved successfully');
    router.push('/forms');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      <div className="px-6 py-3 border-b border-border shrink-0">
        <PageHeader title={formName} backHref="/forms" backLabel="Back to Forms" className="mb-0" />
      </div>

      {/* Builder (takes remaining height) */}
      <div className="flex-1 overflow-hidden">
        <FormBuilder formId={id} onSave={handleSave} />
      </div>
    </div>
  );
}
