"use client"

import * as React from 'react'
import type { AppointmentStatus } from '@/types'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

type Props = {
  value: AppointmentStatus
  onChange: (s: AppointmentStatus) => void
  allowed?: AppointmentStatus[]
  disabled?: boolean
}

const OPTIONS: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export default function StatusSelect({ value, onChange, allowed, disabled }: Props) {
  const opts = allowed ?? (Object.keys(OPTIONS) as AppointmentStatus[])

  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-400 mb-1">Status</label>
      <Select value={value} onValueChange={(v) => onChange(v as AppointmentStatus)}>
        <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white h-9 text-sm" disabled={disabled}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          {opts.map((s) => (
            <SelectItem key={s} value={s} className="text-gray-300">
              {OPTIONS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
