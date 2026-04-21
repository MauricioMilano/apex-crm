'use client';

import { Form, FormField, FormStyling } from '@/types';
import { useState } from 'react';

interface FormPreviewProps {
  form: Form;
  styling?: FormStyling;
}

export function FormPreview({ form, styling }: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});

  const effective = styling ?? form.styling ?? {};

  const title = effective.title || form.name;
  const description = effective.description || form.description;
  const primaryColor = effective.primaryColor || '#3b82f6';
  const bgColor = effective.backgroundColor || '#ffffff';
  const buttonText = effective.buttonText || 'Submit';
  const borderRadius = effective.borderRadius ?? 'rounded';
  const fontSize = effective.fontSize ?? 'medium';

  const fontSizeClass =
    fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base';

  const inputRadius =
    borderRadius === 'sharp' ? 'rounded-none' : borderRadius === 'pill' ? 'rounded-lg' : 'rounded-md';

  const btnRadius =
    borderRadius === 'sharp' ? 'rounded-none' : borderRadius === 'pill' ? 'rounded-full' : 'rounded-md';

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  const setValue = (id: string, val: string | boolean) =>
    setValues((prev) => ({ ...prev, [id]: val }));

  const renderField = (field: FormField) => {
    const baseInput = `mt-1 w-full border border-gray-300 ${inputRadius} px-3 py-2 ${fontSizeClass} focus:outline-none focus:ring-2 text-gray-900 bg-white`;

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
            rows={3}
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
    <div className="overflow-y-auto h-full flex items-start justify-center p-6">
      <div
        className="w-full max-w-lg rounded-xl shadow-lg p-8"
        style={{ backgroundColor: bgColor }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
        {description && (
          <p className="text-gray-500 mb-6 text-sm">{description}</p>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
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
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`mt-6 w-full py-2.5 px-4 font-semibold text-white ${btnRadius} transition-opacity hover:opacity-90 ${fontSizeClass}`}
          style={{ backgroundColor: primaryColor }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
