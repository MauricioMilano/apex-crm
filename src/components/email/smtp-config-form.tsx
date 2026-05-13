"use client"

import { useState, useEffect } from "react"
import { Save, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  testSmtpConnectionAction,
} from "@/actions/email"

interface SmtpConfigFormProps {
  onSettingsChange?: () => void
}

export function SmtpConfigForm({ onSettingsChange }: SmtpConfigFormProps) {
  const [enabled, setEnabled] = useState(false)
  const [host, setHost] = useState("")
  const [port, setPort] = useState("587")
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [from, setFrom] = useState("")
  const [secure, setSecure] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [hasExistingPassword, setHasExistingPassword] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await getOrganizationSettings()
        if (res.success) {
          const s = res.data
          setEnabled(s.smtpEnabled)
          setHost(s.smtpHost ?? "")
          setPort(String(s.smtpPort ?? 587))
          setUser(s.smtpUser ?? "")
          setFrom(s.smtpFrom ?? "")
          setSecure(s.smtpSecure)
          if (s.smtpPass === "••••••") {
            setHasExistingPassword(true)
            setPassword("••••••")
          }
        }
      } catch {
        toast.error("Failed to load SMTP settings")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await updateOrganizationSettings({
        smtpEnabled: enabled,
        smtpHost: host || null,
        smtpPort: port ? parseInt(port, 10) : null,
        smtpUser: user || null,
        smtpPass: password || null,
        smtpFrom: from || null,
        smtpSecure: secure,
      })
      if (res.success) {
        toast.success("SMTP settings saved")
        setPassword("••••••")
        setHasExistingPassword(true)
        onSettingsChange?.()
      } else {
        toast.error(res.error ?? "Failed to save settings")
      }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
      // Save first, then test
      const saveRes = await updateOrganizationSettings({
        smtpEnabled: enabled,
        smtpHost: host || null,
        smtpPort: port ? parseInt(port, 10) : null,
        smtpUser: user || null,
        smtpPass: password || null,
        smtpFrom: from || null,
        smtpSecure: secure,
      })
      if (!saveRes.success) {
        toast.error("Save settings before testing")
        setTesting(false)
        return
      }
      setPassword("••••••")
      setHasExistingPassword(true)

      const res = await testSmtpConnectionAction()
      if (res.success) {
        toast.success("SMTP connection successful!")
      } else {
        toast.error(res.error ?? "Connection failed")
      }
    } catch {
      toast.error("Test connection failed")
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/3" />
            <div className="h-10 bg-gray-700 rounded" />
            <div className="h-10 bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-100">SMTP Configuration</CardTitle>
        <CardDescription className="text-gray-400">
          Configure your SMTP server to enable email sending from the CRM.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-gray-300 font-medium">Enable Email Sending</Label>
            <p className="text-sm text-gray-500 mt-0.5">
              When disabled, no emails will be sent from the system
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            className={enabled ? "bg-blue-600" : ""}
          />
        </div>

        <div className="border-t border-gray-800 pt-6" />

        {/* Server Settings */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label className="text-gray-300">SMTP Host</Label>
            <Input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
              placeholder="smtp.sendgrid.net"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Port</Label>
            <Input
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
              placeholder="587"
            />
          </div>
        </div>

        {/* Authentication */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Username</Label>
            <Input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
              placeholder="apikey"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (e.target.value !== "••••••") {
                  setHasExistingPassword(false)
                }
              }}
              className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
              placeholder={hasExistingPassword ? "••••••" : "Enter password"}
            />
          </div>
        </div>

        {/* From & Secure */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">From Address</Label>
            <Input
              type="email"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
              placeholder="noreply@yourdomain.com"
            />
          </div>
          <div className="flex items-end pb-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={secure}
                onCheckedChange={setSecure}
                className={secure ? "bg-blue-600" : ""}
              />
              <Label className="text-gray-300 cursor-pointer">Use SSL/TLS (port 465)</Label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
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
            Save Settings
          </Button>
          <Button
            onClick={handleTest}
            disabled={testing || !host}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:text-gray-100 hover:bg-gray-800"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
