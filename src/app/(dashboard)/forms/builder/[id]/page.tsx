'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/contexts/crm-context';
import { FormBuilder } from '@/components/forms/form-builder';
import { Form } from '@/types';
import { toast } from 'sonner';
import { ChevronRight, FileText } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FormBuilderPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { forms } = useCRM();

  const form = forms.find((f) => f.id === id);
  const formName = form?.name ?? 'New Form';

  const handleSave = (_saved: Form) => {
    toast.success('Form saved successfully');
    router.push('/dashboard/forms');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-6 py-3 border-b border-gray-800 text-sm text-gray-500 shrink-0">
        <FileText className="h-4 w-4" />
        <Link
          href="/dashboard/forms"
          className="hover:text-gray-300 transition-colors"
        >
          Forms
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-300 truncate max-w-xs">{formName}</span>
      </div>

      {/* Builder (takes remaining height) */}
      <div className="flex-1 overflow-hidden">
        <FormBuilder formId={id} onSave={handleSave} />
      </div>
    </div>
  );
}
