"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, Loader2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TemplatePreview } from "@/components/email/template-preview"
import { renderTemplate, sampleVariables } from "@/lib/email/renderer"
import { toast } from "sonner"

interface TemplateEditorProps {
  name: string
  category: string
  initialSubject: string
  initialBodyHtml: string
  onSave: (subject: string, bodyHtml: string) => Promise<boolean>
}

export function TemplateEditor({
  name,
  category,
  initialSubject,
  initialBodyHtml,
  onSave,
}: TemplateEditorProps) {
  const [subject, setSubject] = useState(initialSubject)
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [renderedSubject, setRenderedSubject] = useState("")
  const [renderedHtml, setRenderedHtml] = useState("")

  const sampleVars = sampleVariables[name] ?? {}

  const renderPreview = useCallback(() => {
    const vars = sampleVars
    setRenderedSubject(renderTemplate(subject, vars))
    setRenderedHtml(renderTemplate(bodyHtml, vars))
  }, [subject, bodyHtml, sampleVars])

  // Debounced preview update
  useEffect(() => {
    const timer = setTimeout(() => {
      renderPreview()
    }, 300)
    return () => clearTimeout(timer)
  }, [renderPreview])

  // Initial render
  useEffect(() => {
    renderPreview()
  }, [renderPreview])

  async function handleSave() {
    if (!subject.trim()) {
      toast.error("Subject is required")
      return
    }
    if (!bodyHtml.trim()) {
      toast.error("Body HTML is required")
      return
    }
    setSaving(true)
    try {
      const ok = await onSave(subject, bodyHtml)
      if (ok) {
        toast.success("Template saved")
      }
    } catch {
      toast.error("Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground capitalize">
            {name.replace(/-/g, " ")}
          </h2>
          <p className="text-sm text-muted-foreground/80 capitalize">{category} template</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr" }}>
        {/* Editor */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-muted border-border text-foreground focus:border-primary font-mono text-sm"
              placeholder="Email subject with {{var}} placeholders"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">HTML Body</Label>
            <div className="relative">
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                className="w-full bg-muted border border-border text-foreground rounded-lg p-4 font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
                style={{ minHeight: "450px" }}
                placeholder="<html>Email body with {{var}} placeholders...</html>"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground/80 bg-muted rounded-lg p-3">
            <p className="font-medium text-muted-foreground mb-1">Available Variables:</p>
            <code className="text-primary">
              {Object.keys(sampleVars).map((v) => `{{${v}}}`).join(", ")}
            </code>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="sticky top-4 self-start">
            <TemplatePreview subject={renderedSubject} bodyHtml={renderedHtml} />
          </div>
        )}
      </div>
    </div>
  )
}
