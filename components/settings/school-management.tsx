"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  School,
  Plus,
  Search,
  MapPin,
  Check,
  Loader2,
  Building2,
  AlertCircle,
} from "lucide-react"
import { GOVERNORATES, type SchoolEntity, type Governorate } from "@/types"
import { createClient } from "@/lib/supabase/client"

export function SchoolManagement() {
  const [schools, setSchools] = useState<SchoolEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [governorateFilter, setGovernorateFilter] = useState<string>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // New school form
  const [newSchool, setNewSchool] = useState({
    name_en: "",
    name_ar: "",
    governorate: "" as Governorate | "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("name_ar", { ascending: true })

      if (!error && data) {
        setSchools(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddSchool = async () => {
    if (!newSchool.name_ar.trim()) {
      setError("School name (Arabic) is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const insertData: Record<string, string | boolean> = {
        name_en: newSchool.name_en.trim() || newSchool.name_ar.trim(),
        name_ar: newSchool.name_ar.trim(),
        is_active: true,
      }
      if (newSchool.governorate) {
        insertData.governorate = newSchool.governorate
      }

      const { data, error: insertError } = await supabase
        .from("schools")
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return
      }

      if (data) {
        setSchools(prev => [...prev, data].sort((a, b) => a.name_ar.localeCompare(b.name_ar)))
      }

      setNewSchool({ name_en: "", name_ar: "", governorate: "" })
      setShowAddModal(false)
      setSuccessMessage("School added successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (school: SchoolEntity) => {
    const { error: updateError } = await supabase
      .from("schools")
      .update({ is_active: !school.is_active })
      .eq("id", school.id)

    if (!updateError) {
      setSchools(prev =>
        prev.map(s => s.id === school.id ? { ...s, is_active: !s.is_active } : s)
      )
    }
  }

  const filteredSchools = schools.filter(s => {
    const matchesSearch =
      s.name_ar.includes(searchQuery) ||
      s.name_en.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGovernorate =
      governorateFilter === "all" || s.governorate === governorateFilter
    return matchesSearch && matchesGovernorate
  })

  const activeCount = schools.filter(s => s.is_active).length
  const totalCount = schools.length

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5 text-[var(--primary)]" />
                School Management
              </CardTitle>
              <CardDescription className="mt-1">
                Manage the list of schools available in the system
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add School
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[var(--bg-depth-3)] border border-[var(--border)] text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Total Schools</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-depth-3)] border border-[var(--border)] text-center">
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Active</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-depth-3)] border border-[var(--border)] text-center">
              <p className="text-2xl font-bold text-[var(--text-muted)]">{totalCount - activeCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Inactive</p>
            </div>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm"
              >
                <Check className="w-4 h-4" />
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schools..."
                className="pl-9"
              />
            </div>
            <Select value={governorateFilter} onValueChange={setGovernorateFilter}>
              <SelectTrigger className="w-48">
                <MapPin className="w-4 h-4 mr-2 text-[var(--text-muted)]" />
                <SelectValue placeholder="All Governorates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Governorates</SelectItem>
                {GOVERNORATES.map((gov) => (
                  <SelectItem key={gov.value} value={gov.value}>
                    {gov.labelAr} ({gov.label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* School List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">
                {searchQuery || governorateFilter !== "all"
                  ? "No schools match your search"
                  : "No schools added yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredSchools.map((school) => (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    school.is_active
                      ? "border-[var(--border)] bg-[var(--bg-depth-3)]"
                      : "border-[var(--border)] bg-[var(--bg-depth-3)] opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      school.is_active
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "bg-[var(--bg-depth-4)] text-[var(--text-muted)]"
                    )}>
                      <School className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {school.name_ar}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {school.name_en && (
                          <span className="text-xs text-[var(--text-muted)] truncate">
                            {school.name_en}
                          </span>
                        )}
                        {school.governorate && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            {GOVERNORATES.find(g => g.value === school.governorate)?.labelAr || school.governorate}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={school.is_active}
                    onCheckedChange={() => handleToggleActive(school)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)] mt-4">
            Showing {filteredSchools.length} of {totalCount} schools
          </p>
        </CardContent>
      </Card>

      {/* Add School Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden">
          {/* Header with decorative accent bar */}
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]" />
            <DialogHeader className="pt-8 pb-5 px-7 border-b-0">
              <DialogTitle className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--bg-surface)] flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">New School</h2>
                  <p className="text-sm text-[var(--text-muted)] font-normal mt-0.5">Register a school in the system</p>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>

          <DialogBody className="px-7 py-5 space-y-5 max-h-none overflow-visible">
            {/* Error display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--error-bg)] border border-[var(--error)]/20 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-[var(--error)]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-[var(--error)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--error)]">Validation Error</p>
                      <p className="text-[var(--error)]/80 mt-0.5">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Arabic Name Field */}
            <div className="space-y-2.5">
              <Label htmlFor="name_ar" required className="text-[var(--text-primary)]">
                School Name (Arabic)
              </Label>
              <Input
                id="name_ar"
                value={newSchool.name_ar}
                onChange={(e) => {
                  setNewSchool(prev => ({ ...prev, name_ar: e.target.value }))
                  setError("")
                }}
                placeholder="ثانوية ..."
                dir="rtl"
                variant="filled"
                className="h-12 text-base font-medium"
              />
            </div>

            {/* English Name Field */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="name_en" className="text-[var(--text-primary)]">
                  School Name (English)
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">Optional</span>
              </div>
              <Input
                id="name_en"
                value={newSchool.name_en}
                onChange={(e) => setNewSchool(prev => ({ ...prev, name_en: e.target.value }))}
                placeholder="e.g. Al-Sabah Secondary School"
                variant="filled"
              />
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-50" />
                Defaults to Arabic name if empty
              </p>
            </div>

            {/* Governorate Field */}
            <div className="space-y-2.5">
              <Label className="text-[var(--text-primary)]">Governorate</Label>
              <Select
                value={newSchool.governorate || "none"}
                onValueChange={(value) => setNewSchool(prev => ({ ...prev, governorate: value === "none" ? "" : value as Governorate }))}
              >
                <SelectTrigger className="h-11">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                    <SelectValue placeholder="Select governorate" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No governorate</SelectItem>
                  {GOVERNORATES.map((gov) => (
                    <SelectItem key={gov.value} value={gov.value}>
                      {gov.labelAr} ({gov.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogBody>

          <DialogFooter className="px-7 py-5 bg-[var(--bg-depth-3)]/50">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false)
                setNewSchool({ name_en: "", name_ar: "", governorate: "" })
                setError("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSchool}
              disabled={saving || !newSchool.name_ar.trim()}
              variant="gradient"
              className="min-w-[140px] shadow-md shadow-[var(--primary)]/15"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? "Adding..." : "Add School"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
