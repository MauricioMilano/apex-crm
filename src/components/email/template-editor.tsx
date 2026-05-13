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
          <h2 className="text-lg font-semibold text-gray-100 capitalize">
            {name.replace(/-/g, " ")}
          </h2>
          <p className="text-sm text-gray-500 capitalize">{category} template</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="border-gray-700 text-gray-300 hover:text-gray-100 hover:bg-gray-800"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
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
            <Label className="text-gray-300">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 font-mono text-sm"
              placeholder="Email subject with {{var}} placeholders"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">HTML Body</Label>
            <div className="relative">
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg p-4 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                style={{ minHeight: "450px" }}
                placeholder="<html>Email body with {{var}} placeholders...</html>"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-800 rounded-lg p-3">
            <p className="font-medium text-gray-400 mb-1">Available Variables:</p>
            <code className="text-blue-400">
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
