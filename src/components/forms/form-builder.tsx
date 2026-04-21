'use client';

import { useState, useRef, useCallback } from 'react';
import { useCRM } from '@/contexts/crm-context';
import { Form, FormField, FormFieldType, FormStyling } from '@/types';
import { FieldEditor } from './field-editor';
import { FormPreview } from './form-preview';
import { StyleEditor } from './style-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Type,
  Mail,
  Phone,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  AlignLeft,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Circle,
  Settings,
} from 'lucide-react';

// ─── Field type definitions ───────────────────────────────────────────────────

interface FieldTypeDef {
  type: FormFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultLabel: string;
}

const FIELD_TYPES: FieldTypeDef[] = [
  { type: 'text', label: 'Text', icon: Type, defaultLabel: 'Text Field' },
  { type: 'email', label: 'Email', icon: Mail, defaultLabel: 'Email Address' },
  { type: 'phone', label: 'Phone', icon: Phone, defaultLabel: 'Phone Number' },
  { type: 'number', label: 'Number', icon: Hash, defaultLabel: 'Number' },
  { type: 'date', label: 'Date', icon: Calendar, defaultLabel: 'Date' },
  { type: 'select', label: 'Dropdown', icon: ChevronDown, defaultLabel: 'Select Option' },
  { type: 'radio', label: 'Radio', icon: Circle, defaultLabel: 'Choose One' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, defaultLabel: 'Agree to terms' },
  { type: 'textarea', label: 'Textarea', icon: AlignLeft, defaultLabel: 'Message' },
  { type: 'file', label: 'File Upload', icon: Upload, defaultLabel: 'Attachment' },
];

const TYPE_ICON_MAP: Record<FormFieldType, React.ComponentType<{ className?: string }>> =
  Object.fromEntries(FIELD_TYPES.map((ft) => [ft.type, ft.icon])) as Record<
    FormFieldType,
    React.ComponentType<{ className?: string }>
  >;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FormBuilderProps {
  formId?: string;
  onSave?: (form: Form) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormBuilder({ formId, onSave }: FormBuilderProps) {
  const { forms, addForm, updateForm } = useCRM();

  const existingForm = formId ? forms.find((f) => f.id === formId) : undefined;

  const [formName, setFormName] = useState(existingForm?.name ?? 'Untitled Form');
  const [formDescription, setFormDescription] = useState(existingForm?.description ?? '');
  const [fields, setFields] = useState<FormField[]>(existingForm?.fields ?? []);
  const [styling, setStyling] = useState<FormStyling>(existingForm?.styling ?? {});
  const [isActive, setIsActive] = useState(existingForm?.isActive ?? false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rightTab, setRightTab] = useState<'field' | 'style'>('field');

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  // ── Field operations ───────────────────────────────────────────────────────

  const addField = useCallback((def: FieldTypeDef) => {
    const newField: FormField = {
      id: generateFieldId(),
      type: def.type,
      label: def.defaultLabel,
      required: false,
      order: fields.length,
      options: def.type === 'select' || def.type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    setRightTab('field');
  }, [fields.length]);

  const updateField = useCallback((updated: FormField) => {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }, []);

  const deleteField = useCallback((id: string) => {
    setFields((prev) => {
      const next = prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i }));
      return next;
    });
    setSelectedFieldId((cur) => (cur === id ? null : cur));
  }, []);

  // ── Drag reorder ───────────────────────────────────────────────────────────

  const onDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next.map((f, i) => ({ ...f, order: i }));
    });
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = () => {
    const data = {
      organizationId: existingForm?.organizationId ?? 'org_1',
      name: formName,
      description: formDescription || undefined,
      fields,
      styling,
      isActive,
      submissionsCount: existingForm?.submissionsCount ?? 0,
    };

    if (existingForm) {
      updateForm(existingForm.id, data);
      onSave?.({ ...existingForm, ...data });
    } else {
      const created = addForm(data);
      onSave?.(created);
    }
  };

  // ── Preview form object ─────────────────────────────────────────────────────

  const previewForm: Form = {
    id: existingForm?.id ?? 'preview',
    organizationId: existingForm?.organizationId ?? 'org_1',
    name: formName,
    description: formDescription || undefined,
    fields,
    styling,
    isActive,
    submissionsCount: existingForm?.submissionsCount ?? 0,
    createdAt: existingForm?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (showPreview) {
    return (
      <div className="flex flex-col h-full bg-gray-950">
        {/* Preview top bar */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-800 shrink-0">
          <span className="text-sm text-gray-400">Preview mode</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(false)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Eye className="h-4 w-4 mr-2" />
            Exit Preview
          </Button>
        </div>
        <div className="flex-1 overflow-hidden bg-gray-100">
          <FormPreview form={previewForm} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 h-14 px-4 border-b border-gray-800 shrink-0">
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="max-w-xs bg-gray-900 border-gray-700 text-white font-medium h-8 text-sm"
        />

        <div className="flex items-center gap-2 ml-auto">
          {/* Publish toggle */}
          <button
            onClick={() => setIsActive((v) => !v)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
              isActive
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
            )}
          >
            {isActive ? 'Published' : 'Unpublished'}
          </button>

          {/* Preview */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 h-8"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Preview
          </Button>

          {/* Save */}
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8"
          >
            <Save className="h-4 w-4 mr-1.5" />
            Save
          </Button>
        </div>
      </div>

      {/* ── 3-panel body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: field type palette */}
        <div className="w-60 shrink-0 border-r border-gray-800 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-800">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Fields
            </span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {FIELD_TYPES.map((def) => {
              const Icon = def.icon;
              return (
                <button
                  key={def.type}
                  onClick={() => addField(def)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-800 bg-gray-900 hover:border-blue-500/50 hover:bg-gray-800 transition-colors text-center group"
                >
                  <Icon className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors leading-none">
                    {def.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: form canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 gap-3 select-none">
              <Plus className="h-10 w-10 opacity-30" />
              <p className="text-sm">Click a field type on the left to add it to your form.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-2">
              {fields.map((field, index) => {
                const Icon = TYPE_ICON_MAP[field.type];
                const isSelected = selectedFieldId === field.id;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDrop={(e) => onDrop(e, index)}
                    onDragEnd={onDragEnd}
                    onClick={() => {
                      setSelectedFieldId(field.id);
                      setRightTab('field');
                    }}
                    className={cn(
                      'group flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all select-none',
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700',
                      isDragOver && 'border-blue-400 bg-blue-400/5',
                    )}
                  >
                    {/* Drag handle */}
                    <GripVertical className="h-4 w-4 text-gray-600 cursor-grab active:cursor-grabbing shrink-0" />

                    {/* Icon */}
                    <Icon className="h-4 w-4 text-gray-400 shrink-0" />

                    {/* Label */}
                    <span className="flex-1 text-sm text-gray-200 truncate">
                      {field.label}
                    </span>

                    {/* Required badge */}
                    {field.required && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-1.5 py-0">
                        Required
                      </Badge>
                    )}

                    {/* Type badge */}
                    <Badge
                      variant="outline"
                      className="border-gray-700 text-gray-500 text-xs px-1.5 py-0 capitalize"
                    >
                      {field.type}
                    </Badge>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteField(field.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: field/style editor */}
        <div className="w-72 shrink-0 border-l border-gray-800 flex flex-col overflow-hidden">
          <Tabs
            value={rightTab}
            onValueChange={(v) => setRightTab(v as 'field' | 'style')}
            className="flex flex-col h-full"
          >
            <TabsList className="w-full rounded-none border-b border-gray-800 bg-gray-900 shrink-0 h-10">
              <TabsTrigger
                value="field"
                className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-400 text-sm"
              >
                Field Properties
              </TabsTrigger>
              <TabsTrigger
                value="style"
                className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-400 text-sm"
              >
                <Settings className="h-3.5 w-3.5 mr-1" />
                Style
              </TabsTrigger>
            </TabsList>

            <TabsContent value="field" className="flex-1 overflow-y-auto mt-0">
              <FieldEditor
                field={selectedField}
                onChange={updateField}
              />
            </TabsContent>

            <TabsContent value="style" className="flex-1 overflow-y-auto mt-0">
              <StyleEditor
                styling={styling}
                formName={formName}
                formDescription={formDescription}
                onFormNameChange={setFormName}
                onFormDescriptionChange={setFormDescription}
                onChange={setStyling}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
