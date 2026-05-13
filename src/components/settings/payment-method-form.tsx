"use client";

import { useState, useEffect } from "react";
import type { PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PaymentMethodFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PaymentMethod | null;
  onSave: (data: { name: string; code: string; requiresDocs: boolean }) => void;
}

export function PaymentMethodForm({
  open,
  onOpenChange,
  initial,
  onSave,
}: PaymentMethodFormProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [requiresDocs, setRequiresDocs] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setCode(initial.code);
      setRequiresDocs(initial.requiresDocs);
    } else {
      setName("");
      setCode("");
      setRequiresDocs(false);
    }
  }, [initial, open]);

  function handleSubmit() {
    if (!name.trim() || !code.trim()) return;
    onSave({
      name: name.trim(),
      code: code.trim().toLowerCase().replace(/\s+/g, "_"),
      requiresDocs,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-gray-300">Name *</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!initial) {
                  setCode(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                }
              }}
              className="bg-gray-800 border-gray-700 text-gray-100"
              placeholder="e.g. Cartão de Crédito"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Code *</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              className="bg-gray-800 border-gray-700 text-gray-100 font-mono"
              placeholder="e.g. credit"
              disabled={!!initial}
            />
            <p className="text-xs text-gray-500">Machine-readable identifier. Cannot be changed after creation.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="requiresDocs"
              checked={requiresDocs}
              onCheckedChange={setRequiresDocs}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="requiresDocs" className="text-gray-300 cursor-pointer">
              Requires Documentation
            </Label>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, the system will prompt for additional details like installments and card last four digits.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !code.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {initial ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
