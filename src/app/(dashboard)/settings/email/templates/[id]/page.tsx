"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { TemplateEditor } from "@/components/email/template-editor"
import { getEmailTemplate, updateEmailTemplate } from "@/actions/email"
import { toast } from "sonner"

export default function TemplateEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const name = params.id

  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [category, setCategory] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await getEmailTemplate(name)
        if (res.success) {
          const t = res.data
          setSubject(t.subject)
          setBodyHtml(t.bodyHtml)
          setCategory(t.category)
        } else {
          toast.error("Template not found")
          router.push("/settings/email")
        }
      } catch {
        toast.error("Failed to load template")
        router.push("/settings/email")
      } finally {
        setLoading(false)
      }
    }
    if (name) void load()
  }, [name, router])

  async function handleSave(newSubject: string, newBodyHtml: string): Promise<boolean> {
    try {
      const res = await updateEmailTemplate(name, {
        subject: newSubject,
        bodyHtml: newBodyHtml,
      })
      if (res.success) {
        setSubject(newSubject)
        setBodyHtml(newBodyHtml)
        return true
      } else {
        toast.error(res.error ?? "Failed to save")
        return false
      }
    } catch {
      toast.error("Failed to save template")
      return false
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16 text-muted-foreground/80">
        Loading template...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={name} backHref="/settings/email" />

      <TemplateEditor
        name={name}
        category={category}
        initialSubject={subject}
        initialBodyHtml={bodyHtml}
        onSave={handleSave}
      />
    </div>
  )
}
