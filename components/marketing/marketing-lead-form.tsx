"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LEAD_SOURCES, SCHOOLS } from "@/types"
import type { LeadSource, LeadSourceCategory } from "@/types"
import { useMarketingLeads, useActiveSemester } from "@/lib/hooks/use-marketing-leads"
import { useActiveSources } from "@/lib/hooks/use-sources"
import { useUser } from "@/lib/hooks/use-user"
import { isArabicText } from "@/lib/string-utils"
import { Plus, CheckCircle2 } from "lucide-react"

export function MarketingLeadForm() {
  const { user } = useUser()
  const { createLead } = useMarketingLeads()
  const { data: activeSemester } = useActiveSemester()
  const { sources: dbSources } = useActiveSources()
  const leadSources = dbSources.length > 0
    ? dbSources.map(s => ({ value: s.value as LeadSource, label: s.label, category: s.category as LeadSourceCategory }))
    : LEAD_SOURCES
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    school: "",
    source: "" as LeadSource | "",
    source_detail: "",
    notes: "",
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.first_name.trim()) {
      newErrors.first_name = "First name is required"
    } else if (!isArabicText(form.first_name)) {
      newErrors.first_name = "Name must be in Arabic"
    }
    if (!form.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    } else if (!isArabicText(form.last_name)) {
      newErrors.last_name = "Name must be in Arabic"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    if (!user || !activeSemester || !form.source) return

    const sourceObj = leadSources.find(s => s.value === form.source)

    await createLead.mutateAsync({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      school: form.school || undefined,
      source: form.source as LeadSource,
      source_category: (sourceObj?.category ?? "marketing") as LeadSourceCategory,
      source_detail: form.source_detail.trim() || undefined,
      notes: form.notes.trim() || undefined,
      semester_id: activeSemester.id,
      created_by: user.id,
    })

    setForm({
      first_name: "",
      last_name: "",
      phone: "",
      school: "",
      source: "",
      source_detail: "",
      notes: "",
    })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Submit New Lead</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First Name * <span className="text-xs text-[var(--text-secondary)]">(Arabic)</span></Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
              placeholder="الاسم الأول"
              dir="rtl"
              required
              error={errors.first_name}
            />
            {errors.first_name && <p className="text-xs text-[var(--error)]">{errors.first_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last Name * <span className="text-xs text-[var(--text-secondary)]">(Arabic)</span></Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
              placeholder="اسم العائلة"
              dir="rtl"
              required
              error={errors.last_name}
            />
            {errors.last_name && <p className="text-xs text-[var(--error)]">{errors.last_name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 55001234"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source">Source *</Label>
            <Select value={form.source} onValueChange={(v) => setForm(f => ({ ...f, source: v as LeadSource }))}>
              <SelectTrigger id="source">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {leadSources.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="school">School</Label>
            <Select value={form.school} onValueChange={(v) => setForm(f => ({ ...f, school: v }))}>
              <SelectTrigger id="school">
                <SelectValue placeholder="Select school (optional)" />
              </SelectTrigger>
              <SelectContent>
                {SCHOOLS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source_detail">Source Detail</Label>
            <Input
              id="source_detail"
              value={form.source_detail}
              onChange={(e) => setForm(f => ({ ...f, source_detail: e.target.value }))}
              placeholder="e.g. Spring Open Day 2026"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={form.notes}
            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={createLead.isPending} disabled={!activeSemester}>
            <Plus className="w-4 h-4 mr-1.5" />
            Submit Lead
          </Button>
          {success && (
            <span className="flex items-center gap-1.5 text-sm text-[var(--success)]">
              <CheckCircle2 className="w-4 h-4" />
              Lead submitted!
            </span>
          )}
          {createLead.isError && (
            <span className="text-sm text-[var(--error)]">
              {createLead.error?.message || "Failed to submit"}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
