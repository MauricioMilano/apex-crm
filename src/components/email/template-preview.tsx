"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TemplatePreviewProps {
  subject: string
  bodyHtml: string
}

export function TemplatePreview({ subject, bodyHtml }: TemplatePreviewProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-100 text-sm flex items-center gap-2">
          <span className="text-gray-400 font-normal">Subject:</span>
          <span className="font-medium">{subject || "(no subject)"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-gray-800">
          <iframe
            srcDoc={bodyHtml}
            title="Email preview"
            className="w-full bg-white rounded-b-lg"
            style={{ minHeight: "400px", border: "none" }}
            sandbox="allow-same-origin"
          />
        </div>
      </CardContent>
    </Card>
  )
}
