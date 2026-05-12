"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, PipelineBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/modal"
import {
  Archive,
  Users,
  ChevronDown,
  ChevronRight,
  Loader2,
  Calendar,
  GraduationCap,
  Phone,
  Mail,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  X,
  RotateCw,
  Download,
  MessageSquare,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { useReRegisterLeads, useActiveSemesters } from "@/lib/hooks/use-semesters"
import { createClient } from "@/lib/supabase/client"
import { LeadFiltersPanel, QuickFilters, type LeadFilters } from "@/components/leads/lead-filters"
import { exportLeadsToCSV, downloadCSV } from "@/lib/csv-utils"
import { stashCampaignPrefill, leadToPrefillContact } from "@/lib/campaigns/prefill"
import { useStageSettings } from "@/lib/hooks/use-stage-settings"
import type { Lead, Semester, EducationCycle, Profile, PipelineStage } from "@/types"
import { PIPELINE_STAGES } from "@/types"

const defaultFilters: LeadFilters = {
  searchQuery: "",
  stages: [],
  lostAtStages: [],
  statuses: [],
  sources: [],
  schools: [],
  appointmentTypes: [],
  submissionSubstages: [],
  submissionStatuses: [],
  fundingType: "all",
  dateRange: "all",
  dateFrom: "",
  dateTo: "",
  assignedTo: "",
  hasEmail: null,
  hasPhone: null,
  gpaMin: null,
  gpaMax: null,
  isKuwaiti: null,
  blockReasons: [],
  hasNotes: "all",
  paymentStatus: "all",
  paymentAmountMin: 0,
  paymentAmountMax: 5000,
  academicTrack: "all",
  lostReasonIds: [],
  withdrawalReasons: [],
  genders: [],
  governorates: [],
  priority: "all",
  ministryAssigned: "all",
  pucImportFlagged: "all",
  docStatuses: [],
  placementLevels: [],
  campaignIds: [],
  semesterIds: [],
}

interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  semesters: Semester[]
}

function cyclesToAcademicYears(cycles: (EducationCycle & { terms: Semester[] })[]): AcademicYear[] {
  return cycles.map((c) => {
    const terms = c.terms || []
    const earliest = terms.length > 0
      ? terms.reduce((min, s) => s.start_date < min ? s.start_date : min, terms[0].start_date)
      : `${c.start_year}-09-01`
    const latest = terms.length > 0
      ? terms.reduce((max, s) => s.end_date > max ? s.end_date : max, terms[0].end_date)
      : `${c.end_year}-06-30`
    return {
      id: c.id,
      name: c.name,
      start_date: earliest,
      end_date: latest,
      semesters: terms,
    }
  }).sort((a, b) => b.name.localeCompare(a.name))
}

// Demo data for presentation purposes
const DEMO_CYCLES: AcademicYear[] = [
  {
    id: "demo-2024-2025",
    name: "2024 – 2025",
    start_date: "2024-09-01",
    end_date: "2025-06-30",
    semesters: [
      { id: "demo-2024-2025-fall", name: "Fall 2024", start_date: "2024-09-01", end_date: "2025-01-31", is_active: false, cycle_id: "demo-2024-2025", term_type: "fall", is_open: false, created_at: "2024-08-15T00:00:00Z" } as Semester,
      { id: "demo-2024-2025-spring", name: "Spring 2025", start_date: "2025-02-01", end_date: "2025-06-30", is_active: false, cycle_id: "demo-2024-2025", term_type: "spring", is_open: false, created_at: "2024-08-15T00:00:00Z" } as Semester,
    ],
  },
  {
    id: "demo-2023-2024",
    name: "2023 – 2024",
    start_date: "2023-09-01",
    end_date: "2024-06-30",
    semesters: [
      { id: "demo-2023-2024-fall", name: "Fall 2023", start_date: "2023-09-01", end_date: "2024-01-31", is_active: false, cycle_id: "demo-2023-2024", term_type: "fall", is_open: false, created_at: "2023-08-10T00:00:00Z" } as Semester,
      { id: "demo-2023-2024-spring", name: "Spring 2024", start_date: "2024-02-01", end_date: "2024-06-30", is_active: false, cycle_id: "demo-2023-2024", term_type: "spring", is_open: false, created_at: "2023-08-10T00:00:00Z" } as Semester,
    ],
  },
  {
    id: "demo-2022-2023",
    name: "2022 – 2023",
    start_date: "2022-09-01",
    end_date: "2023-06-30",
    semesters: [
      { id: "demo-2022-2023-fall", name: "Fall 2022", start_date: "2022-09-01", end_date: "2023-01-31", is_active: false, cycle_id: "demo-2022-2023", term_type: "fall", is_open: false, created_at: "2022-08-12T00:00:00Z" } as Semester,
      { id: "demo-2022-2023-spring", name: "Spring 2023", start_date: "2023-02-01", end_date: "2023-06-30", is_active: false, cycle_id: "demo-2022-2023", term_type: "spring", is_open: false, created_at: "2022-08-12T00:00:00Z" } as Semester,
    ],
  },
]

function makeDemoLead(overrides: Record<string, unknown>): Lead {
  return {
    id: overrides.id as string,
    first_name: overrides.first_name as string,
    last_name: overrides.last_name as string,
    phone: overrides.phone as string,
    email: overrides.email as string,
    civil_id: overrides.civil_id as string,
    nationality: overrides.nationality as string || "Kuwaiti",
    pipeline_stage: overrides.pipeline_stage as string,
    funding_type: overrides.funding_type as string,
    source: overrides.source as string || "website",
    semester_id: overrides.semester_id as string,
    created_at: overrides.created_at as string,
    assigned_agent: overrides.assigned_agent as Record<string, string>,
  } as unknown as Lead
}

const DEMO_LEADS: Record<string, Lead[]> = {
  "demo-2024-2025-fall": [
    makeDemoLead({ id: "d1", first_name: "Ahmad", last_name: "Al-Mutairi", phone: "+965 5512 3401", email: "ahmad.mutairi@gmail.com", civil_id: "298010400123", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2024-2025-fall", created_at: "2024-09-20T10:00:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d2", first_name: "Fatima", last_name: "Al-Rashidi", phone: "+965 5598 7620", email: "fatima.r@hotmail.com", civil_id: "299050300456", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2024-2025-fall", created_at: "2024-09-22T09:30:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d3", first_name: "Mohammed", last_name: "Al-Sabah", phone: "+965 5501 4455", email: "m.sabah@outlook.com", civil_id: "300120100789", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2024-2025-fall", created_at: "2024-10-01T14:15:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d4", first_name: "Noura", last_name: "Al-Dosari", phone: "+965 5567 8899", email: "noura.d@gmail.com", civil_id: "301030200112", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2024-2025-fall", created_at: "2024-10-03T11:00:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d5", first_name: "Khalid", last_name: "Al-Enezi", phone: "+965 5534 2210", email: "khalid.enezi@yahoo.com", civil_id: "297080500234", pipeline_stage: "application", funding_type: "puc", semester_id: "demo-2024-2025-fall", created_at: "2024-10-15T08:45:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d6", first_name: "Sara", last_name: "Al-Ajmi", phone: "+965 5589 1100", email: "sara.ajmi@gmail.com", civil_id: "300070400567", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2024-2025-fall", created_at: "2024-11-08T16:20:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d7", first_name: "Omar", last_name: "Hassan", phone: "+965 5523 6677", email: "omar.hassan@hotmail.com", civil_id: "299110300890", pipeline_stage: "lost", funding_type: "puc", semester_id: "demo-2024-2025-fall", created_at: "2024-11-10T10:10:00Z", nationality: "Egyptian" }),
    makeDemoLead({ id: "d8", first_name: "Maryam", last_name: "Al-Shammari", phone: "+965 5545 9988", email: "maryam.sh@gmail.com", civil_id: "301020100345", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2024-2025-fall", created_at: "2024-12-12T13:30:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d9", first_name: "Abdulrahman", last_name: "Al-Otaibi", phone: "+965 5578 3344", email: "abdulrahman.o@outlook.com", civil_id: "298090200678", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2024-2025-fall", created_at: "2025-01-15T09:00:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d10", first_name: "Haya", last_name: "Al-Fadhli", phone: "+965 5556 7722", email: "haya.f@gmail.com", civil_id: "300040100901", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2024-2025-fall", created_at: "2025-01-18T15:45:00Z", nationality: "Kuwaiti" }),
  ],
  "demo-2024-2025-spring": [
    makeDemoLead({ id: "d11", first_name: "Yusuf", last_name: "Al-Kandari", phone: "+965 5510 8833", email: "yusuf.k@yahoo.com", civil_id: "299060200234", pipeline_stage: "application", funding_type: "puc", semester_id: "demo-2024-2025-spring", created_at: "2025-02-20T11:20:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d12", first_name: "Lulwa", last_name: "Al-Azmi", phone: "+965 5532 4411", email: "lulwa.azmi@gmail.com", civil_id: "301010300567", pipeline_stage: "lost", funding_type: "self_funded", semester_id: "demo-2024-2025-spring", created_at: "2025-02-22T14:00:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d13", first_name: "Bader", last_name: "Al-Mutairi", phone: "+965 5567 1155", email: "bader.m@hotmail.com", civil_id: "298030400890", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2024-2025-spring", created_at: "2025-03-01T10:30:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d14", first_name: "Dana", last_name: "Al-Harbi", phone: "+965 5589 2266", email: "dana.harbi@gmail.com", civil_id: "300080100123", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2024-2025-spring", created_at: "2025-03-05T09:15:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d15", first_name: "Faisal", last_name: "Al-Dhafiri", phone: "+965 5543 7788", email: "faisal.dh@outlook.com", civil_id: "297120500456", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2024-2025-spring", created_at: "2025-04-08T16:40:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d16", first_name: "Nasser", last_name: "Al-Hajri", phone: "+965 5501 2233", email: "nasser.h@gmail.com", civil_id: "298050100789", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2024-2025-spring", created_at: "2025-04-20T10:00:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d17", first_name: "Dalal", last_name: "Al-Subaie", phone: "+965 5567 4455", email: "dalal.s@hotmail.com", civil_id: "300020300012", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2024-2025-spring", created_at: "2025-05-22T11:30:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d18", first_name: "Turki", last_name: "Al-Rashidi", phone: "+965 5534 8899", email: "turki.r@gmail.com", civil_id: "299030200345", pipeline_stage: "lost", funding_type: "self_funded", semester_id: "demo-2024-2025-spring", created_at: "2025-05-01T09:45:00Z", nationality: "Kuwaiti" }),
  ],
  "demo-2023-2024-fall": [
    makeDemoLead({ id: "d19", first_name: "Reem", last_name: "Al-Bloushi", phone: "+965 5578 1100", email: "reem.b@yahoo.com", civil_id: "301040100678", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2023-2024-fall", created_at: "2023-09-05T14:20:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d20", first_name: "Sultan", last_name: "Al-Mutawa", phone: "+965 5523 5566", email: "sultan.m@outlook.com", civil_id: "298070400901", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2023-2024-fall", created_at: "2023-09-10T10:10:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d21", first_name: "Aisha", last_name: "Al-Kandari", phone: "+965 5545 9900", email: "aisha.k@gmail.com", civil_id: "300100200234", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2023-2024-fall", created_at: "2023-10-15T13:00:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d22", first_name: "Hamad", last_name: "Al-Fadhel", phone: "+965 5556 3344", email: "hamad.f@hotmail.com", civil_id: "297090500567", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2023-2024-fall", created_at: "2023-11-20T08:30:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d23", first_name: "Latifa", last_name: "Behbehani", phone: "+965 5510 7722", email: "latifa.b@gmail.com", civil_id: "299080100890", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2023-2024-fall", created_at: "2023-12-01T15:15:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d24", first_name: "Jaber", last_name: "Al-Shammari", phone: "+965 5589 4411", email: "jaber.sh@yahoo.com", civil_id: "300060300123", pipeline_stage: "lost", funding_type: "self_funded", semester_id: "demo-2023-2024-fall", created_at: "2024-01-05T11:45:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d25", first_name: "Shahad", last_name: "Al-Ajmi", phone: "+965 5532 8833", email: "shahad.a@outlook.com", civil_id: "301070200456", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2023-2024-fall", created_at: "2024-01-10T09:00:00Z", nationality: "Kuwaiti" }),
  ],
  "demo-2023-2024-spring": [
    makeDemoLead({ id: "d26", first_name: "Ali", last_name: "Dashti", phone: "+965 5501 6655", email: "ali.dashti@gmail.com", civil_id: "298110400789", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2023-2024-spring", created_at: "2024-02-15T14:30:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d27", first_name: "Maha", last_name: "Al-Enezi", phone: "+965 5567 2200", email: "maha.e@hotmail.com", civil_id: "299120100012", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2023-2024-spring", created_at: "2024-03-20T10:20:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d28", first_name: "Meshal", last_name: "Al-Otaibi", phone: "+965 5534 1122", email: "meshal.o@gmail.com", civil_id: "297040300345", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2023-2024-spring", created_at: "2024-04-05T10:00:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d29", first_name: "Anfal", last_name: "Al-Dosari", phone: "+965 5578 5566", email: "anfal.d@yahoo.com", civil_id: "300030400678", pipeline_stage: "lost", funding_type: "puc", semester_id: "demo-2023-2024-spring", created_at: "2024-04-10T11:30:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d30", first_name: "Khaled", last_name: "Al-Azmi", phone: "+965 5523 9900", email: "khaled.azmi@hotmail.com", civil_id: "298060200901", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2023-2024-spring", created_at: "2024-05-15T09:15:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d31", first_name: "Abeer", last_name: "Al-Sabah", phone: "+965 5545 3344", email: "abeer.s@gmail.com", civil_id: "301050100234", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2023-2024-spring", created_at: "2024-05-20T14:45:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d32", first_name: "Hassan", last_name: "Jamal", phone: "+965 5501 4477", email: "hassan.j@gmail.com", civil_id: "298010300789", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2023-2024-spring", created_at: "2024-06-15T11:10:00Z", nationality: "Jordanian" }),
  ],
  "demo-2022-2023-fall": [
    makeDemoLead({ id: "d33", first_name: "Abdulaziz", last_name: "Al-Mutairi", phone: "+965 5556 7700", email: "abdulaziz.m@outlook.com", civil_id: "299020300567", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2022-2023-fall", created_at: "2022-09-25T10:30:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d34", first_name: "Munirah", last_name: "Al-Harbi", phone: "+965 5510 1155", email: "munirah.h@gmail.com", civil_id: "300090200890", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2022-2023-fall", created_at: "2022-10-01T13:00:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d35", first_name: "Yousef", last_name: "Al-Hajri", phone: "+965 5589 6644", email: "yousef.h@yahoo.com", civil_id: "297100500123", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2022-2023-fall", created_at: "2022-11-05T08:20:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d36", first_name: "Mariam", last_name: "Al-Failakawi", phone: "+965 5532 0088", email: "mariam.f@hotmail.com", civil_id: "299070100456", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2022-2023-fall", created_at: "2022-12-10T15:40:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d37", first_name: "Zainab", last_name: "Al-Qattan", phone: "+965 5567 8800", email: "zainab.q@outlook.com", civil_id: "301080200012", pipeline_stage: "lost", funding_type: "puc", semester_id: "demo-2022-2023-fall", created_at: "2023-01-20T09:50:00Z", nationality: "Kuwaiti" }),
  ],
  "demo-2022-2023-spring": [
    makeDemoLead({ id: "d38", first_name: "Saud", last_name: "Al-Rashidi", phone: "+965 5534 5533", email: "saud.r@gmail.com", civil_id: "297080200345", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2022-2023-spring", created_at: "2023-02-20T10:00:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d39", first_name: "Ghalia", last_name: "Al-Mutawa", phone: "+965 5578 9922", email: "ghalia.m@hotmail.com", civil_id: "300010400678", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2022-2023-spring", created_at: "2023-03-25T11:30:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d40", first_name: "Ibrahim", last_name: "Al-Shammari", phone: "+965 5523 3311", email: "ibrahim.sh@yahoo.com", civil_id: "298040100901", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2022-2023-spring", created_at: "2023-04-01T09:45:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d41", first_name: "Noor", last_name: "Al-Subaie", phone: "+965 5545 7766", email: "noor.s@gmail.com", civil_id: "301020400234", pipeline_stage: "enrolled", funding_type: "puc", semester_id: "demo-2022-2023-spring", created_at: "2023-04-05T14:20:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d42", first_name: "Mishaal", last_name: "Al-Dosari", phone: "+965 5556 1144", email: "mishaal.d@outlook.com", civil_id: "299060300567", pipeline_stage: "lost", funding_type: "puc", semester_id: "demo-2022-2023-spring", created_at: "2023-05-10T10:10:00Z", nationality: "Kuwaiti" }),
    makeDemoLead({ id: "d43", first_name: "Lubna", last_name: "Al-Kandari", phone: "+965 5510 5533", email: "lubna.k@hotmail.com", civil_id: "300110100890", pipeline_stage: "enrolled", funding_type: "self_funded", semester_id: "demo-2022-2023-spring", created_at: "2023-05-15T13:00:00Z", nationality: "Kuwaiti" }),
  ],
}

// ── Transfer Dialog ──────────────────────────────────────────────────────────

interface TransferDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  selectedLeadIds: string[]
  activeSemesters: Semester[]
}

function TransferDialog({
  isOpen,
  onClose,
  selectedCount,
  selectedLeadIds,
  activeSemesters,
}: TransferDialogProps) {
  const reRegister = useReRegisterLeads()
  const [agents, setAgents] = useState<Profile[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ count: number; skipped?: number; skippedNames?: string[] } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedAgent(null)
      setSelectedSemester(activeSemesters[0]?.id || "")
      setSuccess(false)
      setError(null)
      setResult(null)
      setLoadingAgents(true)

      async function fetchAgents() {
        const supabase = createClient()
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("is_active", true)
          .order("full_name")
        setAgents(data || [])
        setLoadingAgents(false)
      }
      fetchAgents()
    }
  }, [isOpen, activeSemesters])

  const handleTransfer = async () => {
    try {
      setError(null)
      const res = await reRegister.mutateAsync({
        leadIds: selectedLeadIds,
        targetSemesterId: selectedSemester || undefined,
        assignedTo: selectedAgent || undefined,
      })
      setResult(res)
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transfer leads")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center mb-2">
            <ArrowRightLeft className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <DialogTitle>Transfer to Active Cycle</DialogTitle>
          <DialogDescription>
            Re-register {selectedCount} lead{selectedCount !== 1 ? "s" : ""} into the current active cycle.
            New leads will be created with pipeline stage reset to &quot;New&quot;.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
              </div>
              <p className="font-medium text-[var(--text-primary)]">
                {result?.count ?? selectedCount} lead{(result?.count ?? selectedCount) !== 1 ? "s" : ""} transferred!
              </p>
              {result?.skipped && result.skipped > 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center">
                  {result.skipped} skipped (already in active cycle)
                </p>
              )}
            </motion.div>
          ) : (
            <>
              {/* Target semester selector */}
              {activeSemesters.length > 1 && (
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                    Target Term
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {activeSemesters.map((sem) => {
                      const isSelected = selectedSemester === sem.id
                      const label = sem.term_type
                        ? sem.term_type.charAt(0).toUpperCase() + sem.term_type.slice(1)
                        : sem.name
                      return (
                        <button
                          key={sem.id}
                          onClick={() => setSelectedSemester(sem.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                            isSelected
                              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                              : "bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Agent selector */}
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                  Assign to Agent
                </label>
                {loadingAgents ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                  </div>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                    {agents.map((agent) => {
                      const isSelected = selectedAgent === agent.id
                      return (
                        <button
                          key={agent.id}
                          onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-elevated)]",
                            isSelected && "bg-[var(--primary-muted)]"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            isSelected
                              ? "bg-[var(--primary)] border-[var(--primary)]"
                              : "border-[var(--border)]"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <Avatar size="sm">
                            <AvatarImage src={agent.avatar_url} />
                            <AvatarFallback>
                              {agent.full_name?.split(" ").map((n: string) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {agent.full_name}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] truncate">
                              {agent.email}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  If no agent is selected, leads will be assigned to you.
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </DialogBody>

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={reRegister.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={reRegister.isPending}
            >
              {reRegister.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4 mr-2" />
              )}
              Transfer {selectedCount} Lead{selectedCount !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Compact per-cycle stage pills ────────────────────────────────────────────

function CycleStagePills({
  stats,
  total,
  activeStage,
  onStageChange,
}: {
  stats: Record<PipelineStage, number>
  total: number
  activeStage: PipelineStage | "all"
  onStageChange: (stage: PipelineStage | "all") => void
}) {
  const { settings: stageSettings } = useStageSettings()
  const orderedStages = stageSettings.length > 0
    ? stageSettings.map(s => PIPELINE_STAGES.find(p => p.value === s.stage)).filter(Boolean) as typeof PIPELINE_STAGES
    : PIPELINE_STAGES
  const stagesToShow = orderedStages.filter(s => s.value !== 'lost')

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
      <button
        onClick={() => onStageChange("all")}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0",
          activeStage === "all"
            ? "bg-[var(--primary)] text-white"
            : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        )}
      >
        All
        <span className={cn(
          "px-1.5 py-0.5 rounded-md text-[10px] font-semibold",
          activeStage === "all"
            ? "bg-white/20 text-white"
            : "bg-[var(--bg-base)] text-[var(--text-muted)]"
        )}>
          {total - (stats.lost || 0)}
        </span>
      </button>
      {stagesToShow.map((stage) => {
        const count = stats[stage.value] || 0
        return (
          <button
            key={stage.value}
            onClick={() => onStageChange(stage.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0",
              activeStage === stage.value
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            )}
          >
            {stage.label}
            {count > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-semibold",
                activeStage === stage.value
                  ? "bg-white/20 text-white"
                  : "bg-[var(--bg-base)] text-[var(--text-muted)]"
              )}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Main Archive Page ────────────────────────────────────────────────────────

export default function ArchivePage() {
  const router = useRouter()
  const { profile, isAdmin } = useUser()
  const { activeSemesters } = useActiveSemesters()
  const [loading, setLoading] = useState(true)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [leadsBySemester, setLeadsBySemester] = useState<Record<string, Lead[]>>({})
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [reRegisteredIds, setReRegisteredIds] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters)
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">("all")
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  useEffect(() => {
    async function fetchArchive() {
      const supabase = createClient()

      // Fetch inactive cycles with their terms
      const { data: cyclesData } = await supabase
        .from("education_cycles")
        .select("*")
        .eq("is_active", false)
        .order("start_year", { ascending: false })

      const hasCycles = cyclesData && cyclesData.length > 0

      // Fetch semesters belonging to those inactive cycles (not by is_active flag,
      // because a semester's is_active means "currently in session" and may not be
      // toggled when its parent cycle becomes inactive)
      const inactiveCycleIds = hasCycles ? cyclesData.map((c) => c.id) : []
      const { data: termsData } = inactiveCycleIds.length > 0
        ? await supabase
            .from("semesters")
            .select("*")
            .in("cycle_id", inactiveCycleIds)
            .order("start_date", { ascending: true })
        : { data: [] as Semester[] }

      if (!hasCycles) {
        // Use demo data
        setAcademicYears(DEMO_CYCLES)
        setLeadsBySemester(DEMO_LEADS)
        setExpandedYears(new Set(DEMO_CYCLES.map((c) => c.id)))
        setExpandedSemesters(new Set(DEMO_CYCLES.flatMap((c) => c.semesters.map((s) => s.id))))
        setIsDemo(true)
        setLoading(false)
        return
      }

      // Group terms under their cycles
      const cyclesWithTerms = cyclesData.map((c) => ({
        ...c,
        terms: (termsData || []).filter((t) => t.cycle_id === c.id),
      }))

      const years = cyclesToAcademicYears(cyclesWithTerms)
      setAcademicYears(years)

      // Fetch leads for all inactive semesters
      const semesterIds = (termsData || []).map((s) => s.id)
      if (semesterIds.length === 0) {
        setLeadsBySemester({})
        setLoading(false)
        return
      }

      const { data: leadsData } = await supabase
        .from("leads")
        .select(`
          id,
          first_name,
          last_name,
          phone,
          email,
          civil_id,
          nationality,
          pipeline_stage,
          contact_status,
          funding_type,
          source,
          school_id,
          semester_id,
          created_at,
          assigned_to,
          assigned_agent:profiles!leads_assigned_to_fkey(full_name),
          is_kuwaiti,
          gpa_grade_12_expected,
          gpa_grade_11,
          gender,
          academic_track,
          priority,
          lost_at_stage,
          lost_reason_id,
          notes,
          ministry_blocked,
          ministry_block_reasons,
          ministry_assigned
        `)
        .in("semester_id", semesterIds)
        .order("created_at", { ascending: false })

      // Group leads by semester
      const grouped: Record<string, Lead[]> = {}
      for (const year of years) {
        for (const sem of year.semesters) {
          grouped[sem.id] = []
        }
      }

      if (leadsData) {
        for (const lead of leadsData) {
          if (lead.semester_id && grouped[lead.semester_id]) {
            grouped[lead.semester_id].push(lead as unknown as Lead)
          }
        }
      }

      setLeadsBySemester(grouped)

      // Auto-expand all cycles so per-cycle filters are visible
      setExpandedYears(new Set(years.map((y) => y.id)))

      // Check which archived leads have already been re-registered
      const allLeadIds = leadsData?.map((l) => l.id) || []
      if (allLeadIds.length > 0) {
        const { data: reRegistered } = await supabase
          .from("leads")
          .select("re_registered_from")
          .in("re_registered_from", allLeadIds)
        if (reRegistered) {
          setReRegisteredIds(new Set(reRegistered.map((r) => r.re_registered_from).filter(Boolean)))
        }
      }

      setLoading(false)
    }

    fetchArchive()
  }, [])

  const toggleYear = (id: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        // Auto-expand semesters when expanding a year
        const year = academicYears.find((y) => y.id === id)
        if (year) {
          setExpandedSemesters((prevSem) => {
            const nextSem = new Set(prevSem)
            year.semesters.forEach((s) => nextSem.add(s.id))
            return nextSem
          })
        }
      }
      return next
    })
  }

  const toggleSemester = (id: string) => {
    setExpandedSemesters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Selection helpers
  const toggleLeadSelection = useCallback((leadId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev)
      if (next.has(leadId)) {
        next.delete(leadId)
      } else {
        next.add(leadId)
      }
      return next
    })
  }, [])

  const toggleSemesterSelection = useCallback((semesterLeads: Lead[]) => {
    const selectable = semesterLeads.filter((l) => !reRegisteredIds.has(l.id))
    setSelectedLeads((prev) => {
      const next = new Set(prev)
      const allSelected = selectable.every((l) => prev.has(l.id))
      if (allSelected) {
        selectable.forEach((l) => next.delete(l.id))
      } else {
        selectable.forEach((l) => next.add(l.id))
      }
      return next
    })
  }, [reRegisteredIds])

  const clearSelection = useCallback(() => {
    setSelectedLeads(new Set())
  }, [])

  // All leads flat (for stats)
  const allLeadsFlat = useMemo(() => {
    return Object.values(leadsBySemester).flat()
  }, [leadsBySemester])

  // Stage stats for QuickFilters
  const stageStats = useMemo(() => {
    const stats: Record<PipelineStage, number> = {} as Record<PipelineStage, number>
    for (const lead of allLeadsFlat) {
      const stage = lead.pipeline_stage as PipelineStage
      stats[stage] = (stats[stage] || 0) + 1
    }
    return stats
  }, [allLeadsFlat])

  // Apply all filters
  const filteredBySemester = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const now = new Date()

    const filtered: Record<string, Lead[]> = {}
    for (const [semId, leads] of Object.entries(leadsBySemester)) {
      filtered[semId] = leads.filter((lead) => {
        // Search query
        if (q && !(
          lead.first_name_ar?.toLowerCase().includes(q) ||
          lead.last_name_ar?.toLowerCase().includes(q) ||
          lead.phone?.includes(q) ||
          lead.email?.toLowerCase().includes(q) ||
          lead.civil_id?.includes(q)
        )) return false

        // Quick stage filter (from stage pills)
        if (stageFilter !== "all" && lead.pipeline_stage !== stageFilter) return false

        // Advanced filters
        if (filters.stages.length > 0 && !filters.stages.includes(lead.pipeline_stage)) return false
        if (filters.lostAtStages.length > 0 && (!lead.lost_at_stage || !filters.lostAtStages.includes(lead.lost_at_stage))) return false
        if (filters.statuses.length > 0 && (!lead.status || !filters.statuses.includes(lead.status))) return false
        if (filters.sources.length > 0 && !filters.sources.includes(lead.source)) return false
        if (filters.schools.length > 0 && (!lead.school || !filters.schools.includes(lead.school))) return false
        if (filters.fundingType !== "all" && lead.funding_type !== filters.fundingType) return false

        // Assigned agent
        if (filters.assignedTo && lead.assigned_to !== filters.assignedTo) return false

        // Contact info
        if (filters.hasEmail === true && !lead.email) return false
        if (filters.hasEmail === false && lead.email) return false
        if (filters.hasPhone === true && !lead.phone) return false
        if (filters.hasPhone === false && lead.phone) return false

        // Nationality
        if (filters.isKuwaiti === true && !lead.is_kuwaiti) return false
        if (filters.isKuwaiti === false && lead.is_kuwaiti) return false

        // GPA (use expected GPA as the primary GPA field)
        const gpa = lead.expected_gpa ?? lead.gpa_grade_12_expected ?? lead.gpa_grade_11
        if (filters.gpaMin !== null && (gpa == null || gpa < filters.gpaMin)) return false
        if (filters.gpaMax !== null && (gpa == null || gpa > filters.gpaMax)) return false

        // Gender
        if (filters.genders.length > 0 && (!lead.gender || !filters.genders.includes(lead.gender))) return false

        // Academic track
        if (filters.academicTrack !== "all" && lead.academic_track !== filters.academicTrack) return false

        // Block reasons
        if (filters.blockReasons.length > 0) {
          const leadReasons = (lead.ministry_block_reasons || []) as string[]
          if (!filters.blockReasons.some(r => leadReasons.includes(r as string))) return false
        }

        // Ministry assigned
        if (filters.ministryAssigned === "assigned" && !lead.ministry_assigned) return false
        if (filters.ministryAssigned === "not_assigned" && lead.ministry_assigned) return false

        // Notes
        if (filters.hasNotes === "with_notes" && !lead.notes) return false
        if (filters.hasNotes === "without_notes" && lead.notes) return false

        // Lost reason
        if (filters.lostReasonIds.length > 0 && (!lead.lost_reason_id || !filters.lostReasonIds.includes(lead.lost_reason_id))) return false

        // Placement level (test level)
        if (filters.placementLevels.length > 0 && (!lead.placement_level || !filters.placementLevels.includes(lead.placement_level))) return false

        // Date range
        if (filters.dateRange !== "all" && filters.dateRange !== "custom") {
          const created = new Date(lead.created_at)
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          if (filters.dateRange === "today" && created < startOfDay) return false
          if (filters.dateRange === "week") {
            const weekAgo = new Date(startOfDay)
            weekAgo.setDate(weekAgo.getDate() - 7)
            if (created < weekAgo) return false
          }
          if (filters.dateRange === "month") {
            const monthAgo = new Date(startOfDay)
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            if (created < monthAgo) return false
          }
          if (filters.dateRange === "quarter") {
            const quarterAgo = new Date(startOfDay)
            quarterAgo.setMonth(quarterAgo.getMonth() - 3)
            if (created < quarterAgo) return false
          }
        }
        if (filters.dateRange === "custom") {
          const created = new Date(lead.created_at)
          if (filters.dateFrom && created < new Date(filters.dateFrom)) return false
          if (filters.dateTo && created > new Date(filters.dateTo + "T23:59:59")) return false
        }

        return true
      })
    }
    return filtered
  }, [leadsBySemester, searchQuery, stageFilter, filters])

  // Helper to get all leads for a cycle (across its semesters)
  const getLeadsForCycle = (year: AcademicYear) => {
    return year.semesters.flatMap((sem) => filteredBySemester[sem.id] || [])
  }

  const totalArchivedLeads = Object.values(filteredBySemester).reduce(
    (sum, leads) => sum + leads.length,
    0
  )

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
  }

  return (
    <div className="flex-1 bg-[var(--bg-base)] flex flex-col min-h-0 min-w-0">
      <Header
        user={profile}
        title="Archive"
        breadcrumbs={[
          { label: "Leads", href: "/leads" },
          { label: "Archive" },
        ]}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Stats summary */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--bg-muted)]">
            <Archive className="w-5 h-5 text-[var(--text-secondary)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {totalArchivedLeads} lead{totalArchivedLeads !== 1 ? "s" : ""} across{" "}
            {academicYears.length} cycle{academicYears.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Global Quick Filters + Search */}
        <QuickFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeStage={stageFilter}
          onStageChange={setStageFilter}
          onOpenAdvanced={() => setShowFiltersPanel(true)}
          stats={stageStats}
          total={allLeadsFlat.length}
        />

        {/* Selection action bar */}
        <AnimatePresence>
          {selectedLeads.size > 0 && isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[var(--primary-muted)] border border-[var(--primary)]/20"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">
                  {selectedLeads.size}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  lead{selectedLeads.size !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors ml-1"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const selectedLeadsList = allLeadsFlat.filter(l => selectedLeads.has(l.id))
                    const csv = exportLeadsToCSV(selectedLeadsList)
                    downloadCSV(csv, `archive-selected-${selectedLeads.size}-leads.csv`)
                  }}
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Export Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const contacts = allLeadsFlat
                      .filter((l) => selectedLeads.has(l.id))
                      .map(leadToPrefillContact)
                    stashCampaignPrefill({
                      origin: "archive",
                      contacts,
                      createdAt: Date.now(),
                    })
                    router.push("/campaigns?prefill=1")
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Campaign
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowTransferDialog(true)}
                  disabled={isDemo}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                  Transfer to Active Cycle
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : academicYears.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Archive className="w-12 h-12 text-[var(--text-muted)] mb-3" />
              <p className="text-[var(--text-secondary)] font-medium">No archived cycles</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Past semesters will appear here once they are marked as inactive.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {academicYears.map((year) => {
              const allLeads = getLeadsForCycle(year)
              // Unfiltered leads for this cycle (for per-cycle stage stats)
              const unfilteredCycleLeads = year.semesters.flatMap((sem) => leadsBySemester[sem.id] || [])
              const cycleStageStats: Record<PipelineStage, number> = {} as Record<PipelineStage, number>
              for (const lead of unfilteredCycleLeads) {
                const stage = lead.pipeline_stage as PipelineStage
                cycleStageStats[stage] = (cycleStageStats[stage] || 0) + 1
              }
              const isExpanded = expandedYears.has(year.id)
              // Sort semesters: fall first, then spring, then summer
              const termOrder: Record<string, number> = { fall: 0, spring: 1, summer: 2 }
              const sortedSemesters = [...year.semesters].sort(
                (a, b) => (termOrder[a.term_type || ""] ?? 9) - (termOrder[b.term_type || ""] ?? 9)
              )

              return (
                <Card key={year.id}>
                  <button
                    onClick={() => toggleYear(year.id)}
                    className="w-full text-left"
                  >
                    <CardHeader className="py-4 px-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          )}
                          <div>
                            <CardTitle className="text-base font-semibold">
                              {year.name}
                            </CardTitle>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {formatDateRange(year.start_date, year.end_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {allLeads.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const csv = exportLeadsToCSV(allLeads)
                                downloadCSV(csv, `archive-${year.name.replace(/\s+/g, "-")}.csv`)
                              }}
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                              title={`Export ${allLeads.length} leads`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <Badge variant="secondary" className="shrink-0">
                            <Users className="w-3 h-3 mr-1" />
                            {allLeads.length} lead{allLeads.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-5 space-y-4">
                      {/* Per-cycle stage pills */}
                      <CycleStagePills
                        stats={cycleStageStats}
                        total={unfilteredCycleLeads.length}
                        activeStage={stageFilter}
                        onStageChange={setStageFilter}
                      />

                      {allLeads.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                          {searchQuery || stageFilter !== "all" ? "No leads match your filters." : "No leads in this cycle."}
                        </p>
                      ) : (
                        sortedSemesters.map((semester) => {
                          const semLeads = filteredBySemester[semester.id] || []
                          const hasActiveFilters = searchQuery || stageFilter !== "all"
                          if (semLeads.length === 0 && hasActiveFilters) return null
                          const termLabel = semester.term_type
                            ? semester.term_type.charAt(0).toUpperCase() + semester.term_type.slice(1)
                            : semester.name

                          const isSemExpanded = expandedSemesters.has(semester.id)
                          const selectableSemLeads = semLeads.filter((l) => !reRegisteredIds.has(l.id))
                          const allSemSelected = selectableSemLeads.length > 0 && selectableSemLeads.every((l) => selectedLeads.has(l.id))
                          const someSemSelected = selectableSemLeads.some((l) => selectedLeads.has(l.id))

                          return (
                            <div key={semester.id}>
                              <button
                                onClick={() => toggleSemester(semester.id)}
                                className="w-full flex items-center justify-between mb-2 group"
                              >
                                <div className="flex items-center gap-2">
                                  {isSemExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                                  )}
                                  <GraduationCap className="w-4 h-4 text-[var(--text-muted)]" />
                                  <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                    {termLabel}
                                  </h4>
                                  <span className="text-xs text-[var(--text-muted)]">
                                    {formatDateRange(semester.start_date, semester.end_date)}
                                  </span>
                                </div>
                                <span className="text-xs text-[var(--text-muted)]">
                                  {semLeads.length} lead{semLeads.length !== 1 ? "s" : ""}
                                </span>
                              </button>
                              {isSemExpanded && (
                                <>
                                  {semLeads.length === 0 ? (
                                    <p className="text-sm text-[var(--text-muted)] py-3 text-center border border-[var(--border)] rounded-lg">
                                      No leads in this semester.
                                    </p>
                                  ) : (
                                    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="bg-[var(--bg-muted)] border-b border-[var(--border)]">
                                            {isAdmin && (
                                              <th className="w-10 py-2.5 px-3">
                                                <input
                                                  type="checkbox"
                                                  checked={allSemSelected}
                                                  ref={(el) => {
                                                    if (el) el.indeterminate = someSemSelected && !allSemSelected
                                                  }}
                                                  onChange={() => toggleSemesterSelection(semLeads)}
                                                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              </th>
                                            )}
                                            <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)]">Name</th>
                                            <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)] hidden md:table-cell">Contact</th>
                                            <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)] hidden lg:table-cell">Civil ID</th>
                                            <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)]">Stage</th>
                                            <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)] hidden sm:table-cell">Funding</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {semLeads.map((lead, idx) => {
                                            const isSelected = selectedLeads.has(lead.id)
                                            const isReRegistered = reRegisteredIds.has(lead.id)
                                            return (
                                              <tr
                                                key={lead.id}
                                                className={cn(
                                                  "hover:bg-[var(--bg-hover)] transition-colors",
                                                  idx !== semLeads.length - 1 && "border-b border-[var(--border)]",
                                                  isSelected && "bg-[var(--primary-muted)]/50",
                                                  isReRegistered && "opacity-60"
                                                )}
                                              >
                                                {isAdmin && (
                                                  <td className="w-10 py-2.5 px-3">
                                                    <input
                                                      type="checkbox"
                                                      checked={isSelected}
                                                      disabled={isReRegistered}
                                                      onChange={() => toggleLeadSelection(lead.id)}
                                                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] disabled:opacity-40"
                                                      title={isReRegistered ? "Already transferred" : undefined}
                                                    />
                                                  </td>
                                                )}
                                                <td className="py-2.5 px-3">
                                                  <div className="flex items-center gap-2">
                                                    <Link
                                                      href={`/leads/${lead.id}`}
                                                      className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                                                    >
                                                      {lead.first_name_ar} {lead.last_name_ar}
                                                    </Link>
                                                    {isReRegistered && (
                                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--success)]/10 text-[10px] font-medium text-[var(--success)] whitespace-nowrap">
                                                        <RotateCw className="w-2.5 h-2.5" />
                                                        Transferred
                                                      </span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="py-2.5 px-3 hidden md:table-cell">
                                                  <div className="flex flex-col gap-0.5 text-[var(--text-secondary)]">
                                                    {lead.phone && (
                                                      <span className="flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3" />
                                                        {lead.phone}
                                                      </span>
                                                    )}
                                                    {lead.email && (
                                                      <span className="flex items-center gap-1.5">
                                                        <Mail className="w-3 h-3" />
                                                        {lead.email}
                                                      </span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-[var(--text-secondary)] hidden lg:table-cell">
                                                  {lead.civil_id || "\u2014"}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                  <PipelineBadge
                                                    stage={lead.pipeline_stage as "new" | "contacted" | "visit" | "test" | "application" | "applicant" | "enrolled" | "lost"}
                                                    size="sm"
                                                  />
                                                </td>
                                                <td className="py-2.5 px-3 hidden sm:table-cell">
                                                  <Badge variant="outline" size="sm">
                                                    {lead.funding_type === "puc" ? "PUC" : lead.funding_type === "self_funded" ? "Self Funded" : lead.funding_type}
                                                  </Badge>
                                                </td>
                                              </tr>
                                            )
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      <TransferDialog
        isOpen={showTransferDialog}
        onClose={() => {
          setShowTransferDialog(false)
          clearSelection()
        }}
        selectedCount={selectedLeads.size}
        selectedLeadIds={Array.from(selectedLeads)}
        activeSemesters={activeSemesters}
      />

      {/* Advanced Filters Panel */}
      <LeadFiltersPanel
        filters={filters}
        onChange={setFilters}
        onClose={() => setShowFiltersPanel(false)}
        isOpen={showFiltersPanel}
      />
    </div>
  )
}
