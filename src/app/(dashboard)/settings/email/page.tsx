"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SmtpConfigForm } from "@/components/email/smtp-config-form"
import { TemplateList } from "@/components/email/template-list"
import { getEmailTemplates } from "@/actions/email"
import { useCRM } from "@/contexts/crm-context"
import type { EmailTemplate } from "@/types"
import { useEffect } from "react"

interface TemplateWithMeta extends EmailTemplate {
  isCustomized: boolean
}

export default function EmailSettingsPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  const loadTemplates = useCallback(async () => {
    try {
      const res = await getEmailTemplates()
      if (res.success) {
        setTemplates(res.data as TemplateWithMeta[])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  function handleEditTemplate(name: string) {
    router.push(`/settings/email/templates/${name}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Email Settings</h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure SMTP and manage email templates.
        </p>
      </div>

      {/* SMTP Configuration */}
      <SmtpConfigForm onSettingsChange={loadTemplates} />

      {/* Email Templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Email Templates</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading templates...</div>
        ) : (
          <TemplateList templates={templates} onEdit={handleEditTemplate} />
        )}
      </div>
    </div>
  )
}
