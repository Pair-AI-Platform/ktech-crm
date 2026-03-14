"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, PipelineBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Archive,
  Search,
  Users,
  ChevronDown,
  ChevronRight,
  Loader2,
  Calendar,
  GraduationCap,
  Phone,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import type { Lead, Semester } from "@/types"

interface SemesterWithLeads {
  semester: Semester
  leads: Lead[]
}

export default function ArchivePage() {
  const { profile } = useUser()
  const [loading, setLoading] = useState(true)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [leadsBySemester, setLeadsBySemester] = useState<Record<string, Lead[]>>({})
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchArchive() {
      const supabase = createClient()

      // Fetch all inactive semesters
      const { data: semesterData } = await supabase
        .from("semesters")
        .select("*")
        .eq("is_active", false)
        .order("start_date", { ascending: false })

      if (!semesterData || semesterData.length === 0) {
        setSemesters([])
        setLoading(false)
        return
      }

      setSemesters(semesterData)

      // Fetch leads directly by semester_id
      const semesterIds = semesterData.map((s) => s.id)
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
          funding_type,
          source,
          semester_id,
          created_at,
          assigned_agent:profiles!leads_assigned_to_fkey(full_name)
        `)
        .in("semester_id", semesterIds)
        .order("created_at", { ascending: false })

      // Group leads by semester
      const grouped: Record<string, Lead[]> = {}
      for (const semester of semesterData) {
        grouped[semester.id] = []
      }

      if (leadsData) {
        for (const lead of leadsData) {
          if (lead.semester_id && grouped[lead.semester_id]) {
            grouped[lead.semester_id].push(lead as unknown as Lead)
          }
        }
      }

      setLeadsBySemester(grouped)
      setLoading(false)
    }

    fetchArchive()
  }, [])

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

  // Filter leads by search
  const filteredBySemester = useMemo(() => {
    if (!searchQuery.trim()) return leadsBySemester

    const q = searchQuery.toLowerCase()
    const filtered: Record<string, Lead[]> = {}
    for (const [semesterId, leads] of Object.entries(leadsBySemester)) {
      filtered[semesterId] = leads.filter(
        (lead) =>
          lead.first_name?.toLowerCase().includes(q) ||
          lead.last_name?.toLowerCase().includes(q) ||
          lead.phone?.includes(q) ||
          lead.email?.toLowerCase().includes(q) ||
          lead.civil_id?.includes(q)
      )
    }
    return filtered
  }, [leadsBySemester, searchQuery])

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
        {/* Search & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--bg-muted)]">
              <Archive className="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {totalArchivedLeads} lead{totalArchivedLeads !== 1 ? "s" : ""} across{" "}
                {semesters.length} cycle{semesters.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              placeholder="Search archived leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : semesters.length === 0 ? (
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
            {semesters.map((semester) => {
              const leads = filteredBySemester[semester.id] || []
              const isExpanded = expandedSemesters.has(semester.id)

              return (
                <Card key={semester.id}>
                  <button
                    onClick={() => toggleSemester(semester.id)}
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
                              {semester.name}
                            </CardTitle>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {formatDateRange(semester.start_date, semester.end_date)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          <Users className="w-3 h-3 mr-1" />
                          {leads.length} lead{leads.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </CardHeader>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-5">
                      {leads.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                          {searchQuery ? "No leads match your search." : "No leads in this cycle."}
                        </p>
                      ) : (
                        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-[var(--bg-muted)] border-b border-[var(--border)]">
                                <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)]">Name</th>
                                <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)] hidden md:table-cell">Contact</th>
                                <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)] hidden lg:table-cell">Civil ID</th>
                                <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)]">Stage</th>
                                <th className="text-left py-2.5 px-3 font-medium text-[var(--text-secondary)] hidden sm:table-cell">Funding</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leads.map((lead, idx) => (
                                <tr
                                  key={lead.id}
                                  className={cn(
                                    "hover:bg-[var(--bg-hover)] transition-colors",
                                    idx !== leads.length - 1 && "border-b border-[var(--border)]"
                                  )}
                                >
                                  <td className="py-2.5 px-3">
                                    <Link
                                      href={`/leads/${lead.id}`}
                                      className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                                    >
                                      {lead.first_name} {lead.last_name}
                                    </Link>
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
                                    {lead.civil_id || "—"}
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
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
