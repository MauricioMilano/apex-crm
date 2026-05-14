"use client"

import { useOrgFormat } from "@/hooks/use-org-format"
import { Pencil, FileText, Calendar, User, UserPlus, Package, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface TemplateListItem {
  id: string
  name: string
  subject: string
  category: string
  updatedAt: string
  isCustomized: boolean
}

interface TemplateListProps {
  templates: TemplateListItem[]
  onEdit: (name: string) => void
}

const categoryIcons: Record<string, typeof FileText> = {
  appointment: Calendar,
  lead: User,
  client: UserPlus,
  subscription: Package,
  team: Users,
  auth: Shield,
}

const categoryLabels: Record<string, string> = {
  appointment: "Appointment",
  lead: "Lead",
  client: "Client",
  subscription: "Subscription",
  team: "Team",
  auth: "Auth / Security",
}

const categoryColors: Record<string, string> = {
  appointment: "text-primary bg-primary/15",
  lead: "text-green-400 bg-green-600/15",
  client: "text-purple-400 bg-purple-600/15",
  subscription: "text-amber-400 bg-amber-600/15",
  team: "text-cyan-400 bg-cyan-600/15",
  auth: "text-rose-400 bg-rose-600/15",
}

export function TemplateList({ templates, onEdit }: TemplateListProps) {
  const { formatDate } = useOrgFormat()
  // Group by category
  const grouped = templates.reduce<Record<string, TemplateListItem[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground/80">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No email templates found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => {
        const Icon = categoryIcons[category] ?? FileText
        const colorClass = categoryColors[category] ?? "text-muted-foreground bg-muted"

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`rounded-lg p-1.5 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {categoryLabels[category] ?? category}
              </h3>
            </div>
            <div className="grid gap-3">
              {items.map((template) => (
                <Card
                  key={template.id}
                  className="bg-card border-border hover:border-border transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground capitalize">
                            {template.name.replace(/-/g, " ")}
                          </h4>
                          {template.isCustomized && (
                            <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30 text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground/80 mt-1 truncate max-w-xl">
                          {template.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {formatDate(template.updatedAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => onEdit(template.name)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
