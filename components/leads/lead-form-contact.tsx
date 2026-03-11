"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Phone,
  Mail,
} from "lucide-react"
import type { LeadFormData } from "./lead-form-types"
import type { Dispatch, SetStateAction } from "react"

interface LeadFormContactProps {
  formData: LeadFormData
  setFormData: Dispatch<SetStateAction<LeadFormData>>
  handleChange: (field: string, value: string) => void
  errors: Record<string, string>
}

export function LeadFormContact({
  formData,
  handleChange,
  errors,
}: LeadFormContactProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
          <Phone className="w-4 h-4 text-[var(--primary)]" />
        </div>
        <h3 className="font-semibold text-[var(--text-primary)]">Contact Information</h3>
      </div>

      <div className="space-y-4 pl-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="9876 5432"
              maxLength={8}
              icon={<Phone className="w-4 h-4" />}
              error={errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-[var(--error)]">{errors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_secondary">Secondary Phone</Label>
            <Input
              id="phone_secondary"
              value={formData.phone_secondary}
              onChange={(e) => handleChange("phone_secondary", e.target.value)}
              placeholder="5555 1234"
              maxLength={8}
              icon={<Phone className="w-4 h-4" />}
              error={errors.phone_secondary}
            />
            {errors.phone_secondary && (
              <p className="text-xs text-[var(--error)]">{errors.phone_secondary}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="laila@email.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email}
            />
            {errors.email && (
              <p className="text-xs text-[var(--error)]">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="civil_id">Civil ID</Label>
            <Input
              id="civil_id"
              value={formData.civil_id}
              onChange={(e) => handleChange("civil_id", e.target.value)}
              placeholder="298765432109"
              maxLength={12}
              error={errors.civil_id}
            />
            {errors.civil_id && (
              <p className="text-xs text-[var(--error)]">{errors.civil_id}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleChange("date_of_birth", e.target.value)}
              disabled={!!formData.civil_id && formData.date_of_birth !== ""}
            />
            {formData.civil_id && formData.date_of_birth && (
              <p className="text-xs text-[var(--text-muted)]">Auto-extracted from Civil ID</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
