"use client"

import React from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { Lead } from "@/types"
import type { SortField } from "./lead-table-utils"

interface LeadTableHeaderProps {
  isSubmissionView: boolean
  isLostView: boolean
  isWithdrawView: boolean
  isEnrolledView: boolean
  isPucSrjView: boolean
  isPucApplicantView: boolean
  isPucDocSubmissionView: boolean
  isPucContactedView: boolean
  isPucAppSubmissionView: boolean
  showSubstageColumn: boolean
  selectedLeads: string[]
  leads: Lead[]
  onSelectAll: () => void
  handleSort: (field: SortField) => void
  getSortIcon: (field: SortField) => React.ReactNode
}

export function LeadTableHeader({
  isSubmissionView,
  isLostView,
  isWithdrawView,
  isEnrolledView,
  isPucSrjView,
  isPucApplicantView,
  isPucDocSubmissionView,
  isPucContactedView,
  isPucAppSubmissionView,
  showSubstageColumn,
  selectedLeads,
  leads,
  onSelectAll,
  handleSort,
  getSortIcon,
}: LeadTableHeaderProps) {
  return (
    <thead className="sticky top-0 z-30">
      <tr className="border-b border-[var(--border)] bg-[var(--bg-sunken)]">
        <th className="px-3 py-1.5 text-left w-10 sticky left-0 z-30 bg-[var(--bg-sunken)]">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={selectedLeads.length === leads.length && leads.length > 0}
              onChange={onSelectAll}
              className="w-4 h-4 rounded-md border-2 border-[var(--border)] bg-[var(--bg-surface)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-muted)] focus:ring-offset-0 cursor-pointer transition-all hover:border-[var(--primary)]"
            />
          </div>
        </th>
        <th className="px-3 py-1.5 text-left w-[180px] min-w-[180px] max-w-[180px] sticky left-10 z-30 bg-[var(--bg-sunken)] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--border)]">
          <button
            onClick={() => handleSort("name")}
            className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
          >
            Lead
            <span className="group-hover:scale-110 transition-transform">{getSortIcon("name")}</span>
          </button>
        </th>
        <th className="px-3 py-1.5 text-left min-w-[120px] w-[130px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Contact
          </span>
        </th>
        {/* Submission-specific columns */}
        {isSubmissionView ? (
          <>
            <th className="px-3 py-1.5 text-left min-w-[160px] w-[180px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Stage
              </span>
            </th>
            {!isPucSrjView && showSubstageColumn && (
              <th className="px-3 py-1.5 text-left min-w-[110px] w-[120px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Substage
                </span>
              </th>
            )}
            {isPucSrjView && !isPucApplicantView && (
            <th className="px-3 py-1.5 text-left min-w-[150px] w-[170px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Status
              </span>
            </th>
            )}
            {(isPucApplicantView || !isPucSrjView) && (
            <th className="px-3 py-1.5 text-left min-w-[120px] w-[130px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Orientation
              </span>
            </th>
            )}
            {isPucDocSubmissionView && (
            <th className="px-3 py-1.5 text-left min-w-[170px] w-[190px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Doc Status
              </span>
            </th>
            )}
            {isPucAppSubmissionView && (
              <th className="px-3 py-1.5 text-left min-w-[130px] w-[150px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Preference
                </span>
              </th>
            )}
            {isPucContactedView && (
              <>
                <th className="px-3 py-1.5 text-left min-w-[120px] w-[140px]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Major
                  </span>
                </th>
                <th className="px-3 py-1.5 text-left w-[75px]">
                  <button
                    onClick={() => handleSort("expected_gpa")}
                    className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group whitespace-nowrap"
                  >
                    Exp. GPA
                    <span className="group-hover:scale-110 transition-transform">{getSortIcon("expected_gpa")}</span>
                  </button>
                </th>
                <th className="px-3 py-1.5 text-left w-[75px]">
                  <button
                    onClick={() => handleSort("actual_gpa")}
                    className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group whitespace-nowrap"
                  >
                    Act. GPA
                    <span className="group-hover:scale-110 transition-transform">{getSortIcon("actual_gpa")}</span>
                  </button>
                </th>
              </>
            )}
            {!isPucContactedView && (
            <th className="px-3 py-1.5 text-left w-[180px] min-w-[160px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Agent
              </span>
            </th>
            )}
          </>
        ) : isLostView ? (
          <>
            <th className="px-3 py-1.5 text-left min-w-[110px] w-[120px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Lost At
              </span>
            </th>
            <th className="px-3 py-1.5 text-left min-w-[160px] w-[180px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Lost Reason
              </span>
            </th>
            <th className="px-3 py-1.5 text-left min-w-[130px] w-[140px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Status
              </span>
            </th>
            <th className="px-3 py-1.5 text-left w-[150px] min-w-[150px]">
              <button
                onClick={() => handleSort("school")}
                className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
              >
                School
                <span className="group-hover:scale-110 transition-transform">{getSortIcon("school")}</span>
              </button>
            </th>
          </>
        ) : isWithdrawView ? (
          <>
            <th className="px-3 py-1.5 text-left min-w-[160px] w-[180px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Stage
              </span>
            </th>
            <th className="px-3 py-1.5 text-left min-w-[170px] w-[200px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Reason
              </span>
            </th>
            <th className="px-3 py-1.5 text-left w-[180px] min-w-[160px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Agent
              </span>
            </th>
          </>
        ) : (
          <>
            <th className="px-3 py-1.5 text-left min-w-[160px] w-[180px]">
              <button
                onClick={() => handleSort("pipeline_stage")}
                className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
              >
                Stage
                <span className="group-hover:scale-110 transition-transform">{getSortIcon("pipeline_stage")}</span>
              </button>
            </th>
            <th className="px-3 py-1.5 text-left min-w-[150px] w-[170px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Status
              </span>
            </th>
            {!isEnrolledView && (
            <th className="px-3 py-1.5 text-left w-[150px] min-w-[150px]">
              <button
                onClick={() => handleSort("school")}
                className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
              >
                School
                <span className="group-hover:scale-110 transition-transform">{getSortIcon("school")}</span>
              </button>
            </th>
            )}
            <th className="px-3 py-1.5 text-left w-[75px]">
              <button
                onClick={() => handleSort("expected_gpa")}
                className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group whitespace-nowrap"
              >
                Exp. GPA
                <span className="group-hover:scale-110 transition-transform">{getSortIcon("expected_gpa")}</span>
              </button>
            </th>
            <th className="px-3 py-1.5 text-left w-[75px]">
              <button
                onClick={() => handleSort("actual_gpa")}
                className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group whitespace-nowrap"
              >
                Act. GPA
                <span className="group-hover:scale-110 transition-transform">{getSortIcon("actual_gpa")}</span>
              </button>
            </th>
          </>
        )}
        <th className="px-3 py-1.5 text-left min-w-[130px] w-[140px] sticky right-0 z-30 bg-[var(--bg-sunken)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Actions
          </span>
        </th>
      </tr>
    </thead>
  )
}
