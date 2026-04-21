'use client';

import { use, useState } from 'react';
import { useCRM } from '@/contexts/crm-context';
import { FormField, FormStyling } from '@/types';
import { CheckCircle2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default function PublicFormPage({ params }: PageProps) {
  const { formId } = use(params);
  const { forms, addLead, leadStatuses } = useCRM();

  const form = forms.find((f) => f.id === formId);

  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Form not found</p>
          <p className="text-sm mt-1">This form may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  if (!form.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Form unavailable</p>
          <p className="text-sm mt-1">This form is not currently accepting submissions.</p>
        </div>
      </div>
    );
  }

  const styling: FormStyling = form.styling ?? {};
  const primaryColor = styling.primaryColor ?? '#3b82f6';
  const bgColor = styling.backgroundColor ?? '#f9fafb';
  const buttonText = styling.buttonText ?? 'Submit';
  const title = styling.title || form.name;
  const description = styling.description || form.description;
  const borderRadius = styling.borderRadius ?? 'rounded';
  const fontSize = styling.fontSize ?? 'medium';

  const fontSizeClass =
    fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base';
  const inputRadius =
    borderRadius === 'sharp' ? 'rounded-none' : borderRadius === 'pill' ? 'rounded-lg' : 'rounded-md';
  const btnRadius =
    borderRadius === 'sharp' ? 'rounded-none' : borderRadius === 'pill' ? 'rounded-full' : 'rounded-md';

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  const setValue = (id: string, val: string | boolean) => {
    setValues((prev) => ({ ...prev, [id]: val }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    sortedFields.forEach((field) => {
      if (field.required) {
        const val = values[field.id];
        if (val === undefined || val === '' || val === false) {
          newErrors[field.id] = 'This field is required';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Try to find name fields
    const nameField = sortedFields.find((f) =>
      ['full name', 'name', 'your name'].some((l) =>
        f.label.toLowerCase().includes(l),
      ),
    );
    const firstNameField = sortedFields.find((f) =>
      f.label.toLowerCase().includes('first name'),
    );
    const lastNameField = sortedFields.find((f) =>
      f.label.toLowerCase().includes('last name'),
    );
    const emailField = sortedFields.find((f) => f.type === 'email');
    const phoneField = sortedFields.find((f) => f.type === 'phone');
    const companyField = sortedFields.find((f) =>
      f.label.toLowerCase().includes('company'),
    );

    let firstName = 'Unknown';
    let lastName = '';

    if (firstNameField) {
      firstName = String(values[firstNameField.id] ?? '') || 'Unknown';
    } else if (nameField) {
      const fullName = String(values[nameField.id] ?? '').trim();
      const parts = fullName.split(' ');
      firstName = parts[0] || 'Unknown';
      lastName = parts.slice(1).join(' ');
    }
    if (lastNameField) {
      lastName = String(values[lastNameField.id] ?? '') || lastName;
    }

    // Serialize all values to notes
    const notesLines = sortedFields.map((f) => {
      const val = values[f.id];
      return `${f.label}: ${val === true ? 'Yes' : val === false ? 'No' : (val ?? '')}`;
    });

    const defaultStatus = leadStatuses.find((s) => s.isDefault) ?? leadStatuses[0];

    addLead({
      organizationId: form.organizationId,
      statusId: defaultStatus?.id ?? 'status_1',
      firstName,
      lastName,
      email: emailField ? String(values[emailField.id] ?? '') : undefined,
      phone: phoneField ? String(values[phoneField.id] ?? '') : undefined,
      company: companyField ? String(values[companyField.id] ?? '') : undefined,
      source: `Form: ${form.name}`,
      notes: notesLines.join('\n'),
      tags: ['form-submission'],
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-center max-w-md px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600">
            Your submission has been received. We&apos;ll be in touch soon.
          </p>
        </div>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    const baseInput = `mt-1 w-full border px-3 py-2 ${fontSizeClass} focus:outline-none focus:ring-2 text-gray-900 bg-white ${inputRadius} ${
      errors[field.id] ? 'border-red-400' : 'border-gray-300'
    }`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={(values[field.id] as string) ?? ''}
            onChange={(e) => setValue(field.id, e.target.value)}
            className={baseInput}
          />
        );
      case 'phone':
        return (
          <input
            type="tel"
            placeholder={field.placeholder}
            value={(values[field.id] as string) ?? ''}
            onChange={(e) => setValue(field.id, e.target.value)}
            className={baseInput}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={(values[field.id] as string) ?? ''}
            onChange={(e) => setValue(field.id, e.target.value)}
            className={baseInput}
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            value={(values[field.id] as string) ?? ''}
            onChange={(e) => setValue(field.id, e.target.value)}
            className={`${baseInput} resize-none`}
            rows={4}
          />
        );
      case 'select':
        return (
          <select
            value={(values[field.id] as string) ?? ''}
            onChange={(e) => setValue(field.id, e.target.value)}
            className={baseInput}
          >
            <option value="">Select an option…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="mt-2 space-y-2">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={(values[field.id] as string) === opt}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: primaryColor }}
                />
                <span className={`${fontSizeClass} text-gray-700`}>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={!!(values[field.id] as boolean)}
              onChange={(e) => setValue(field.id, e.target.checked)}
              className="w-4 h-4"
              style={{ accentColor: primaryColor }}
            />
            <span className={`${fontSizeClass} text-gray-700`}>{field.label}</span>
          </label>
        );
      case 'file':
        return (
          <input
            type="file"
            className={`${baseInput} py-1.5`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: bgColor }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-md p-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
        {description && (
          <p className="text-gray-500 text-sm mb-6">{description}</p>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {sortedFields.map((field) => (
            <div
              key={field.id}
              className={(field.colSpan ?? 2) === 1 ? 'col-span-1' : 'col-span-2'}
            >
              {field.type !== 'checkbox' && (
                <label className={`block font-medium text-gray-700 ${fontSizeClass}`}>
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
              )}
              {renderField(field)}
              {field.helpText && (
                <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
              )}
              {errors[field.id] && (
                <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          className={`mt-6 w-full py-2.5 px-4 font-semibold text-white ${btnRadius} transition-opacity hover:opacity-90 ${fontSizeClass}`}
          style={{ backgroundColor: primaryColor }}
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
}
