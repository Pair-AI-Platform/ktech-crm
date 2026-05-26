"use client"

import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Sparkles,
  Check,
  GraduationCap,
  CreditCard,
  Search,
  Building2,
  Lock,
  Ban,
  Phone,
  PhoneMissed,
  PhoneOff,
  Eye,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  ThumbsDown,
  Heart,
  Trophy,
  Globe,
  XCircle,
  Car,
  BookOpen,
  Unplug,
  Info,
  Plane,
  AlertTriangle,
  Wallet,
  AlertCircle,
  Briefcase,
  School as SchoolIcon,
  type LucideIcon,
} from "lucide-react"
import { EDUCATION_TYPES, MAJORS, PIPELINE_STAGES, LEAD_SOURCES, LEAD_STATUSES, LOCKED_STAGES, MINISTRY_BLOCK_REASONS, type PipelineStage, type LeadStatus, type SchoolEntity } from "@/types"
import { cn } from "@/lib/utils"
import type { LeadFormData } from "./lead-form-types"
import type { Dispatch, SetStateAction } from "react"
import { useActiveExhibitions } from "@/lib/hooks/use-exhibitions"
import type { Campaign } from "@/lib/hooks/use-campaigns"

const SOURCE_CATEGORIES = [
  { value: "direct", label: "Direct", icon: "📞" },
  { value: "events", label: "Events", icon: "🎪" },
  { value: "marketing", label: "Marketing", icon: "📱" },
  { value: "referrals", label: "Referrals", icon: "👥" },
  { value: "outreach", label: "Outreach", icon: "📣" },
]

const LEAD_STATUS_ICONS: Record<LeadStatus, LucideIcon> = {
  no_answer: PhoneMissed,
  callback: RefreshCw,
  not_interested: ThumbsDown,
  switched_off: PhoneOff,
  busy: Clock,
  confirmed: CheckCircle2,
  wrong_number: Ban,
  will_see: Eye,
  postponed: Calendar,
  by_mistake: AlertCircle,
  disconnected: Unplug,
  hanged_up: PhoneOff,
  interested: Heart,
  high_gpa: Trophy,
  cancelled: XCircle,
  online: Globe,
  on_campus: Building2,
  on_the_way: Car,
  cant_reach: PhoneOff,
  contacted: Phone,
  seeking_job: Briefcase,
  current_student: GraduationCap,
  asking_bachelors: SchoolIcon,
  courses_masters: BookOpen,
  rude: Ban,
  informed: Info,
  travelling: Plane,
  might_withdraw: AlertTriangle,
  pay_later: Wallet,
  competitor: Ban,
  applied: CheckCircle2,
  blocked_ku: Ban,
  blocked_paaet: Ban,
  blocked_abroad: Ban,
  blocked_aasu: Ban,
  blocked_paci: Ban,
  blocked_puc: Ban,
  blocked_gpa: Ban,
  documents_missing: AlertCircle,
  payment_pending: Wallet,
  blocked_other: Ban,
  changed_preferences: RefreshCw,
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  warning: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
  accent: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30",
  destructive: "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/30",
  secondary: "bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/30",
  success: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
}

interface LeadFormAcademicProps {
  formData: LeadFormData
  setFormData: Dispatch<SetStateAction<LeadFormData>>
  handleChange: (field: string, value: string) => void
  errors: Record<string, string>
  setErrors: Dispatch<SetStateAction<Record<string, string>>>
  schoolSearch: string
  setSchoolSearch: Dispatch<SetStateAction<string>>
  isSchoolDropdownOpen: boolean
  setIsSchoolDropdownOpen: Dispatch<SetStateAction<boolean>>
  filteredSchools: { id: string; name_en: string; name_ar: string; gender?: string }[]
  schoolSource: { id: string; name_en: string; name_ar: string; gender?: string }[]
  dbSchools: SchoolEntity[]
  isEditing: boolean
  filteredSources: typeof LEAD_SOURCES
  availableStatuses: typeof LEAD_STATUSES
  availablePipelineStages: typeof PIPELINE_STAGES
  isAtTestStage: boolean
  agents: { id: string; full_name: string; email: string; avatar_url: string | null }[]
  semesters: { id: string; name: string; is_active: boolean; is_open: boolean; cycle_id?: string }[]
  campaigns: Campaign[]
}

export function LeadFormAcademic({
  formData,
  setFormData,
  handleChange,
  errors,
  setErrors,
  schoolSearch,
  setSchoolSearch,
  isSchoolDropdownOpen,
  setIsSchoolDropdownOpen,
  filteredSchools,
  schoolSource,
  filteredSources,
  availableStatuses,
  availablePipelineStages,
  agents,
  semesters,
  campaigns,
}: LeadFormAcademicProps) {
  const { exhibitions: activeExhibitions } = useActiveExhibitions()

  return (
    <>
      {/* Section 4: Lead Source */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Lead Source</h3>
        </div>

        <div className="space-y-4 pl-10">
          <div className="space-y-2">
            <Label>Source Category</Label>
            <div className="grid grid-cols-5 gap-2">
              {SOURCE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    handleChange("source_category", cat.value)
                    const categoryMap: Record<string, string> = {
                      direct: "walk_in",
                      events: "school_visit",
                      marketing: "website_form",
                      referrals: "current_student_referral",
                      outreach: "old_contacts",
                    }
                    const source = categoryMap[cat.value] || ""
                    handleChange("source", source)
                    if (source === "walk_in") {
                      handleChange("pipeline_stage", "visit")
                    }
                    // Clear campaign when switching away from outreach
                    if (cat.value !== "outreach") {
                      handleChange("campaign_id", "")
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all",
                    formData.source_category === cat.value
                      ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                      : "border-[var(--border)] hover:border-[var(--primary)]/50"
                  )}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.source_category === "outreach" ? (
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select
                value={formData.campaign_id || ""}
                onValueChange={(value) => {
                  handleChange("campaign_id", value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.campaign_id && (
                <p className="text-xs text-[var(--text-muted)]">
                  📣 {campaigns.find(c => c.id === formData.campaign_id)?.name}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Source</Label>
              <div className="grid grid-cols-2 gap-2">
                {filteredSources.map((source) => (
                  <button
                    key={source.value}
                    type="button"
                    onClick={() => {
                      handleChange("source", source.value)
                      if (source.value === "walk_in") {
                        handleChange("pipeline_stage", "visit")
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-all",
                      formData.source === source.value
                        ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                      formData.source === source.value
                        ? "border-[var(--primary)] bg-[var(--primary)]"
                        : "border-[var(--border)]"
                    )}>
                      {formData.source === source.value && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    {source.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.source === "walk_in" && (
            <p className="text-xs text-[var(--text-muted)] italic">This lead will automatically start at the Visit stage</p>
          )}

          {/* Exhibition Name - Only shown when exhibitions source is selected */}
          {formData.source === "exhibitions" && (
            <div className="space-y-2">
              <Label>Exhibition Name</Label>
              <Select
                value={formData.source_detail || ""}
                onValueChange={(value) => handleChange("source_detail", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exhibition" />
                </SelectTrigger>
                <SelectContent>
                  {activeExhibitions.map((exhibition) => (
                    <SelectItem key={exhibition.id} value={exhibition.name}>
                      {exhibition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        </div>
      </div>

      {/* Section 5: Academic */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Academic Information</h3>
        </div>

        <div className="space-y-4 pl-10">
          {/* Searchable School Dropdown */}
          <div className="space-y-2">
            <Label>School</Label>
            <div className="relative">
              <div
                onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                  isSchoolDropdownOpen
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] hover:border-[var(--primary)]/50"
                )}
              >
                <Building2 className="w-4 h-4 text-[var(--text-muted)]" />
                <span className={formData.school ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                  {formData.school ? (schoolSource.find(s => s.id === formData.school)?.name_ar || formData.school) : "Select school"}
                </span>
              </div>

              {isSchoolDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-[var(--border)]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={schoolSearch}
                        onChange={(e) => setSchoolSearch(e.target.value)}
                        placeholder="Search schools..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                        dir="auto"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school) => (
                        <button
                          key={school.id}
                          type="button"
                          onClick={() => {
                            handleChange("school", school.id)
                            setIsSchoolDropdownOpen(false)
                            setSchoolSearch("")
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]",
                            formData.school === school.id && "bg-[var(--primary-muted)] text-[var(--primary)]"
                          )}
                        >
                          <span>{school.name_ar}</span>
                          <span className="block text-xs text-[var(--text-muted)]">{school.name_en}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-center text-[var(--text-muted)]">
                        No schools found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Education Type */}
          <div id="education_type" className="space-y-2">
            <Label>Education Type <span className="text-[var(--error)]">*</span></Label>
            <div className="grid grid-cols-5 gap-2">
              {EDUCATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      education_type: prev.education_type === type.value ? "" : type.value,
                      education_type_custom: type.value !== 'other' ? "" : prev.education_type_custom,
                    }))
                    if (errors.education_type) {
                      setErrors(prev => ({ ...prev, education_type: "" }))
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center",
                    formData.education_type === type.value
                      ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                      : "border-[var(--border)] hover:border-[var(--primary)]/50"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    formData.education_type === type.value
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-primary)]"
                  )}>
                    {type.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] leading-tight">{type.description}</span>
                </button>
              ))}
            </div>
            {errors.education_type && (
              <p className="text-xs text-[var(--error)]">{errors.education_type}</p>
            )}
            {formData.education_type === 'other' && (
              <motion.div
                id="education_type_custom"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <Input
                  placeholder="Enter education type..."
                  value={formData.education_type_custom}
                  onChange={(e) => setFormData(prev => ({ ...prev, education_type_custom: e.target.value }))}
                  className={cn("w-full", errors.education_type_custom && "border-[var(--error)]")}
                />
                {errors.education_type_custom && (
                  <p className="text-xs text-[var(--error)] mt-1">{errors.education_type_custom}</p>
                )}
              </motion.div>
            )}
          </div>

          {/* Grade Level */}
          <div className="space-y-2">
            <Label>Grade</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "10th", label: "10" },
                { value: "11th", label: "11" },
                { value: "12th", label: "12" },
              ].map((grade) => (
                <button
                  key={grade.value}
                  type="button"
                  onClick={() => handleChange("grade_level", formData.grade_level === grade.value ? "" : grade.value)}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-xl border transition-all text-sm font-bold",
                    formData.grade_level === grade.value
                      ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                      : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-primary)]"
                  )}
                >
                  {grade.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Funding Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange("funding_type", "self_funded")}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all",
                  formData.funding_type === "self_funded"
                    ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                    : "border-[var(--border)] hover:border-[var(--primary)]/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  formData.funding_type === "self_funded"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                )}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[var(--text-primary)]">Self-Funded</p>
                  <p className="text-xs text-[var(--text-muted)]">Private payment</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleChange("funding_type", "puc")}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all",
                  formData.funding_type === "puc"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  formData.funding_type === "puc"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                )}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[var(--text-primary)]">PUC</p>
                  <p className="text-xs text-[var(--text-muted)]">Government scholarship</p>
                </div>
              </button>
            </div>
          </div>

          {/* Cycle / Semester */}
          <div id="semester_id" className="space-y-2">
            <Label>Term <span className="text-red-500">*</span></Label>
            <Select
              value={formData.semester_id}
              onValueChange={(value) => handleChange("semester_id", value)}
            >
              <SelectTrigger className={errors.semester_id ? "border-red-500" : ""}>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {semesters.filter(s => s.is_active).map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.semester_id && (
              <p className="text-xs text-red-500">{errors.semester_id}</p>
            )}
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ktech Intended Major</Label>
              <Select
                value={formData.intended_major}
                onValueChange={(value) => handleChange("intended_major", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select intended major" />
                </SelectTrigger>
                <SelectContent>
                  {MAJORS.map((major) => (
                    <SelectItem key={major.value} value={major.value}>
                      {major.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Graduation Year</Label>
              <Select
                value={formData.graduation_year}
                onValueChange={(value) => handleChange("graduation_year", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select graduation year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 2030 - 1980 + 1 }, (_, i) => 1980 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_major">Preferred Major</Label>
              <Input
                id="preferred_major"
                value={formData.preferred_major}
                onChange={(e) => handleChange("preferred_major", e.target.value)}
                placeholder="Enter preferred major"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ministry_accepted_major">ktech Actual Major</Label>
              <Input
                id="ministry_accepted_major"
                value={formData.ministry_accepted_major}
                placeholder="From ministry file"
                disabled
              />
            </div>
          </div>

          {/* GPA Section */}
          <div className="space-y-3">
            <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">GPA Scores (0-100%)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expected_gpa" className="text-xs">Expected GPA</Label>
                <Input
                  id="expected_gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.expected_gpa}
                  onChange={(e) => handleChange("expected_gpa", e.target.value)}
                  placeholder="e.g. 85"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual_gpa" className="text-xs">Actual Accumulative GPA</Label>
                <Input
                  id="actual_gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.actual_gpa}
                  onChange={(e) => handleChange("actual_gpa", e.target.value)}
                  placeholder="e.g. 82"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_track" className="text-xs">Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.academic_track}
                  onValueChange={(value) => {
                    handleChange("academic_track", value)
                    if (errors.academic_track) {
                      setErrors(prev => ({ ...prev, academic_track: "" }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="arts">Art</SelectItem>
                  </SelectContent>
                </Select>
                {errors.academic_track && (
                  <p className="text-xs text-red-500">{errors.academic_track}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seat Number for MOE GPA Fetch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seat_number" className="text-xs">Seat Number (MOE)</Label>
              <Input
                id="seat_number"
                value={formData.seat_number}
                onChange={(e) => handleChange("seat_number", e.target.value)}
                placeholder="e.g. 12345"
                maxLength={20}
              />
              <p className="text-xs text-[var(--text-muted)]">Required for fetching GPA from MOE portal</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pipeline Stage</Label>
            {LOCKED_STAGES.includes(formData.pipeline_stage as PipelineStage) ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] text-[var(--text-muted)]">
                <Lock className="w-4 h-4" />
                <span className="text-sm">{PIPELINE_STAGES.find(s => s.value === formData.pipeline_stage)?.label}</span>
                <span className="text-xs ml-auto">(Locked)</span>
              </div>
            ) : (
              <Select
                value={formData.pipeline_stage}
                onValueChange={(value) => handleChange("pipeline_stage", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {availablePipelineStages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {availableStatuses.length > 0 && <div className="p-4 rounded-xl border border-[var(--border)]/50 bg-[var(--bg-sunken)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Lead Status
            </p>
            <div className="flex flex-wrap gap-2">
              {availableStatuses.map((status) => {
                const isActive = formData.status === status.value
                const Icon = LEAD_STATUS_ICONS[status.value]
                const colorClass = LEAD_STATUS_COLORS[status.color] || LEAD_STATUS_COLORS.secondary
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleChange("status", status.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5",
                      isActive
                        ? cn(colorClass, "ring-2 ring-offset-1 ring-current/30 scale-105")
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {status.label}
                  </button>
                )
              })}
            </div>
          </div>}

          {/* Assign To */}
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => handleChange("assigned_to", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auto-assign to me" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.full_name || agent.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[var(--text-muted)]">Leave empty to auto-assign to yourself</p>
          </div>
        </div>
      </div>
    </>
  )
}
