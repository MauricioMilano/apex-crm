'use client';

import { FormField } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface FieldEditorProps {
  field: FormField | null;
  onChange: (field: FormField) => void;
}

export function FieldEditor({ field, onChange }: FieldEditorProps) {
  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm p-6 text-center gap-2">
        <span>Select a field from the canvas to edit its properties.</span>
      </div>
    );
  }

  const update = (updates: Partial<FormField>) => onChange({ ...field, ...updates });

  const addOption = () => {
    const opts = field.options ?? [];
    update({ options: [...opts, `Option ${opts.length + 1}`] });
  };

  const updateOption = (i: number, value: string) => {
    const opts = [...(field.options ?? [])];
    opts[i] = value;
    update({ options: opts });
  };

  const removeOption = (i: number) => {
    update({ options: (field.options ?? []).filter((_, idx) => idx !== i) });
  };

  const showOptions = field.type === 'select' || field.type === 'radio';
  const showPlaceholder =
    field.type !== 'checkbox' &&
    field.type !== 'radio' &&
    field.type !== 'file';

  return (
    <div className="space-y-4 p-4 overflow-y-auto">
      {/* Type (read-only) */}
      <div>
        <Label className="text-xs text-gray-400 uppercase tracking-wider">
          Field Type
        </Label>
        <div className="mt-1 px-3 py-2 rounded-md bg-gray-800 text-gray-300 text-sm capitalize border border-gray-700">
          {field.type}
        </div>
      </div>

      {/* Label */}
      <div>
        <Label htmlFor="fe-label" className="text-sm text-gray-300">
          Label
        </Label>
        <Input
          id="fe-label"
          value={field.label}
          onChange={(e) => update({ label: e.target.value })}
          className="mt-1 bg-gray-800 border-gray-700 text-white"
        />
      </div>

      {/* Placeholder */}
      {showPlaceholder && (
        <div>
          <Label htmlFor="fe-placeholder" className="text-sm text-gray-300">
            Placeholder
          </Label>
          <Input
            id="fe-placeholder"
            value={field.placeholder ?? ''}
            onChange={(e) => update({ placeholder: e.target.value })}
            className="mt-1 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      )}

      {/* Required */}
      <div className="flex items-center justify-between">
        <Label className="text-sm text-gray-300">Required</Label>
        <Switch
          checked={field.required}
          onCheckedChange={(v) => update({ required: v })}
        />
      </div>

      {/* Options (select / radio) */}
      {showOptions && (
        <div>
          <Label className="text-sm text-gray-300">Options</Label>
          <div className="mt-2 space-y-2">
            {(field.options ?? []).map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(i)}
                  className="shrink-0 text-gray-500 hover:text-red-400 hover:bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        </div>
      )}

      {/* Help text */}
      <div>
        <Label htmlFor="fe-help" className="text-sm text-gray-300">
          Help Text
        </Label>
        <Textarea
          id="fe-help"
          value={field.helpText ?? ''}
          onChange={(e) => update({ helpText: e.target.value })}
          placeholder="Optional hint shown below the field"
          className="mt-1 bg-gray-800 border-gray-700 text-white text-sm resize-none"
          rows={2}
        />
      </div>

      {/* Column span */}
      <div>
        <Label className="text-sm text-gray-300">Column Width</Label>
        <Select
          value={String(field.colSpan ?? 2)}
          onValueChange={(v) => update({ colSpan: Number(v) as 1 | 2 })}
        >
          <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="2">Full Width</SelectItem>
            <SelectItem value="1">Half Width</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
