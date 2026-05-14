"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TemplatePreviewProps {
  subject: string
  bodyHtml: string
}

export function TemplatePreview({ subject, bodyHtml }: TemplatePreviewProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-sm flex items-center gap-2">
          <span className="text-muted-foreground font-normal">Subject:</span>
          <span className="font-medium">{subject || "(no subject)"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border">
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
