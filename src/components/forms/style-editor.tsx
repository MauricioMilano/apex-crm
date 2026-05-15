'use client';

import { FormStyling } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StyleEditorProps {
  styling: FormStyling;
  formName: string;
  formDescription: string;
  onFormNameChange: (name: string) => void;
  onFormDescriptionChange: (desc: string) => void;
  onChange: (styling: FormStyling) => void;
}

export function StyleEditor({
  styling,
  formName,
  formDescription,
  onFormNameChange,
  onFormDescriptionChange,
  onChange,
}: StyleEditorProps) {
  const update = (updates: Partial<FormStyling>) =>
    onChange({ ...styling, ...updates });

  return (
    <div className="space-y-4 p-4 overflow-y-auto">
      {/* Form Title */}
      <div>
        <Label htmlFor="se-title" className="text-sm text-muted-foreground">
          Form Name
        </Label>
        <Input
          id="se-title"
          value={formName}
          onChange={(e) => onFormNameChange(e.target.value)}
          placeholder="Form name"
          className="mt-1 bg-card border-border text-foreground"
        />
      </div>

      {/* Display Title override */}
      <div>
        <Label htmlFor="se-display-title" className="text-sm text-muted-foreground">
          Display Title
        </Label>
        <Input
          id="se-display-title"
          value={styling.title ?? ''}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Override title shown to users"
          className="mt-1 bg-card border-border text-foreground"
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="se-desc" className="text-sm text-muted-foreground">
          Description
        </Label>
        <Input
          id="se-desc"
          value={formDescription}
          onChange={(e) => onFormDescriptionChange(e.target.value)}
          placeholder="Short description"
          className="mt-1 bg-card border-border text-foreground"
        />
      </div>

      {/* Primary color */}
      <div>
        <Label className="text-sm text-muted-foreground">Primary Color</Label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="color"
            value={styling.primaryColor ?? '#3b82f6'}
            onChange={(e) => update({ primaryColor: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded border border-border bg-card p-1"
          />
          <Input
            value={styling.primaryColor ?? '#3b82f6'}
            onChange={(e) => update({ primaryColor: e.target.value })}
            className="bg-card border-border text-foreground font-mono text-sm"
          />
        </div>
      </div>

      {/* Background color */}
      <div>
        <Label className="text-sm text-muted-foreground">Background Color</Label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="color"
            value={styling.backgroundColor ?? '#ffffff'}
            onChange={(e) => update({ backgroundColor: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded border border-border bg-card p-1"
          />
          <Input
            value={styling.backgroundColor ?? '#ffffff'}
            onChange={(e) => update({ backgroundColor: e.target.value })}
            className="bg-card border-border text-foreground font-mono text-sm"
          />
        </div>
      </div>

      {/* Font size */}
      <div>
        <Label className="text-sm text-muted-foreground">Font Size</Label>
        <Select
          value={styling.fontSize ?? 'medium'}
          onValueChange={(v) => update({ fontSize: v as FormStyling['fontSize'] })}
        >
          <SelectTrigger className="mt-1 bg-card border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Border radius */}
      <div>
        <Label className="text-sm text-muted-foreground">Border Radius</Label>
        <Select
          value={styling.borderRadius ?? 'rounded'}
          onValueChange={(v) =>
            update({ borderRadius: v as FormStyling['borderRadius'] })
          }
        >
          <SelectTrigger className="mt-1 bg-card border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="sharp">Sharp</SelectItem>
            <SelectItem value="rounded">Rounded</SelectItem>
            <SelectItem value="pill">Pill</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Button text */}
      <div>
        <Label htmlFor="se-btn" className="text-sm text-muted-foreground">
          Button Text
        </Label>
        <Input
          id="se-btn"
          value={styling.buttonText ?? 'Submit'}
          onChange={(e) => update({ buttonText: e.target.value })}
          className="mt-1 bg-card border-border text-foreground"
        />
      </div>
    </div>
  );
}
