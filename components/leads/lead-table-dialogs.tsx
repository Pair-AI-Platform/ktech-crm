"use client"

import React from "react"
import type { Lead, PipelineStage, LeadStatus } from "@/types"
import type { SubmissionBlockedReason } from "@/types"
import { AppointmentBooking } from "@/components/calendar/appointment-booking"
import { AppointmentDetail } from "@/components/calendar/appointment-detail"
import { CallbackScheduler } from "@/components/leads/callback-scheduler"
import { MarkLostDialog } from "@/components/leads/mark-lost-dialog"
import { ContactedStatusDialog } from "@/components/leads/contacted-status-dialog"
import { BlockedReasonDialog } from "@/components/leads/blocked-reason-dialog"
import { WithdrawReasonDialog } from "@/components/leads/withdraw-reason-dialog"
import { EnrollmentPaymentDialog } from "@/components/leads/enrollment-payment-dialog"
import { FileFeePaymentDialog } from "@/components/leads/file-fee-payment-dialog"
import { FileStageRequirementsDialog } from "@/components/leads/file-stage-requirements-dialog"
import { PSPSubmissionWizard } from "@/components/leads/psp-submission-wizard"
import { getLeadDisplayName as _getLeadDisplayName } from "@/lib/lead-utils"

function getLeadDisplayName(lead: Lead | null): string {
  if (!lead) return ''
  return _getLeadDisplayName(lead)
}

export interface LeadTableDialogsProps {
  bookingLead: Lead | null
  bookingCallbackMode: boolean
  callbackLead: Lead | null
  callbackFromStage: PipelineStage | undefined
  lostDialogLead: Lead | null
  contactedDialogLead: Lead | null
  blockedDialogLead: Lead | null
  withdrawDialogLead: Lead | null
  fileRequirementsDialog: { lead: Lead; missingFields: string[] } | null
  fileFeeDialogLead: Lead | null
  paymentDialogLead: Lead | null
  pspWizardLead: Lead | null
  viewingAppointment: import("@/types").Appointment | null
  setBookingLead: (lead: Lead | null) => void
  setBookingSimpleMode: (val: boolean) => void
  setBookingCallbackMode: (val: boolean) => void
  setCallbackLead: (lead: Lead | null) => void
  setCallbackFromStage: (stage: PipelineStage | undefined) => void
  setLostDialogLead: (lead: Lead | null) => void
  setContactedDialogLead: (lead: Lead | null) => void
  setBlockedDialogLead: (lead: Lead | null) => void
  setWithdrawDialogLead: (lead: Lead | null) => void
  setFileRequirementsDialog: (dialog: { lead: Lead; missingFields: string[] } | null) => void
  setFileFeeDialogLead: (lead: Lead | null) => void
  handleFileFeeSuccess: (action: 'paid' | 'sent' | 'exempt') => Promise<void>
  setPaymentDialogLead: (lead: Lead | null) => void
  setPspWizardLead: (lead: Lead | null) => void
  setViewingAppointment: (apt: import("@/types").Appointment | null) => void
  handleLostConfirm: (reasonId: string, notes?: string) => Promise<void>
  handleAssignLostReason?: (reasonId: string, notes?: string) => Promise<void>
  assignReasonMode?: boolean
  handleContactedConfirm: (status: LeadStatus, notes?: string) => Promise<void>
  handleBlockedConfirm: (reason: SubmissionBlockedReason, notes?: string) => Promise<void>
  handleWithdrawConfirm: (reason: string, notes?: string) => Promise<void>
  editWithdrawReasonLead: Lead | null
  setEditWithdrawReasonLead: (lead: Lead | null) => void
  handleEditWithdrawReasonConfirm: (reason: string, notes?: string) => Promise<void>
  incrementContactCount: (leadId: string) => void
  updateLead?: (id: string, updates: Partial<Lead>) => Promise<unknown>
  refreshPucDocCounts: () => void
  refreshPucPaymentStatus: () => void
}

export function LeadTableDialogs({
  bookingLead,
  bookingCallbackMode,
  callbackLead,
  callbackFromStage,
  lostDialogLead,
  contactedDialogLead,
  blockedDialogLead,
  withdrawDialogLead,
  fileRequirementsDialog,
  fileFeeDialogLead,
  paymentDialogLead,
  pspWizardLead,
  viewingAppointment,
  setBookingLead,
  setBookingSimpleMode,
  setBookingCallbackMode,
  setCallbackLead,
  setCallbackFromStage,
  setLostDialogLead,
  setContactedDialogLead,
  setBlockedDialogLead,
  setWithdrawDialogLead,
  setFileRequirementsDialog,
  setFileFeeDialogLead,
  handleFileFeeSuccess,
  setPaymentDialogLead,
  setPspWizardLead,
  setViewingAppointment,
  handleLostConfirm,
  handleAssignLostReason,
  assignReasonMode,
  handleContactedConfirm,
  handleBlockedConfirm,
  handleWithdrawConfirm,
  editWithdrawReasonLead,
  setEditWithdrawReasonLead,
  handleEditWithdrawReasonConfirm,
  incrementContactCount,
  updateLead,
  refreshPucDocCounts,
  refreshPucPaymentStatus,
}: LeadTableDialogsProps) {
  return (
    <>
      {/* Appointment Booking Popup */}
      <AppointmentBooking
        isOpen={!!bookingLead}
        onClose={() => {
          setBookingLead(null)
          setBookingSimpleMode(false)
          setBookingCallbackMode(false)
        }}
        onSuccess={() => {
          // Don't close the modal here - let the success animation play
          // The modal will auto-close after 2.5s via its own setTimeout -> onClose
        }}
        preselectedLead={bookingLead || undefined}
        singleFormMode={true}
        callbackMode={bookingCallbackMode}
      />

      {/* Callback Scheduler Popup */}
      <CallbackScheduler
        isOpen={!!callbackLead}
        onClose={() => {
          setCallbackLead(null)
          setCallbackFromStage(undefined)
        }}
        onSuccess={() => {
          if (callbackLead) {
            incrementContactCount(callbackLead.id)
          }
          setCallbackLead(null)
          setCallbackFromStage(undefined)
        }}
        onUpdateLead={updateLead}
        lead={callbackLead}
        fromStage={callbackFromStage}
      />

      {/* Mark Lost Dialog / Assign Reason Dialog */}
      <MarkLostDialog
        open={!!lostDialogLead}
        onOpenChange={(open) => {
          if (!open) setLostDialogLead(null)
        }}
        leadName={getLeadDisplayName(lostDialogLead)}
        onConfirm={assignReasonMode && handleAssignLostReason ? handleAssignLostReason : handleLostConfirm}
        assignReasonMode={assignReasonMode}
      />

      {/* Contacted Status Required Dialog */}
      <ContactedStatusDialog
        open={!!contactedDialogLead}
        onOpenChange={(open) => {
          if (!open) setContactedDialogLead(null)
        }}
        leadName={getLeadDisplayName(contactedDialogLead)}
        currentStatus={contactedDialogLead?.status as LeadStatus | null | undefined}
        onConfirm={handleContactedConfirm}
      />

      {/* Withdraw Reason Dialog */}
      <WithdrawReasonDialog
        open={!!withdrawDialogLead}
        onOpenChange={(open) => {
          if (!open) setWithdrawDialogLead(null)
        }}
        leadName={getLeadDisplayName(withdrawDialogLead)}
        onConfirm={handleWithdrawConfirm}
      />

      {/* Edit Withdraw Reason Dialog (for existing withdrawn leads) */}
      <WithdrawReasonDialog
        open={!!editWithdrawReasonLead}
        onOpenChange={(open) => {
          if (!open) setEditWithdrawReasonLead(null)
        }}
        leadName={getLeadDisplayName(editWithdrawReasonLead)}
        onConfirm={handleEditWithdrawReasonConfirm}
      />

      {/* Blocked Reason Dialog (PUC PSP) */}
      <BlockedReasonDialog
        open={!!blockedDialogLead}
        onOpenChange={(open) => {
          if (!open) setBlockedDialogLead(null)
        }}
        leadName={getLeadDisplayName(blockedDialogLead)}
        onConfirm={handleBlockedConfirm}
      />

      {/* File stage requirements dialog */}
      <FileStageRequirementsDialog
        open={!!fileRequirementsDialog}
        lead={fileRequirementsDialog?.lead ?? null}
        missingFields={fileRequirementsDialog?.missingFields ?? []}
        onOpenChange={(open) => {
          if (!open) setFileRequirementsDialog(null)
        }}
        onFillRequiredFields={() => {
          const lead = fileRequirementsDialog?.lead
          setFileRequirementsDialog(null)
          if (lead) setPspWizardLead(lead)
        }}
      />

      {/* File Fee Payment Dialog - shown when moving lead to File (application) stage */}
      {fileFeeDialogLead && (
        <FileFeePaymentDialog
          open={!!fileFeeDialogLead}
          onOpenChange={(open) => { if (!open) setFileFeeDialogLead(null) }}
          lead={fileFeeDialogLead}
          onSuccess={handleFileFeeSuccess}
        />
      )}

      {/* Enrollment Payment Dialog - shown after moving lead to Applicant without paying */}
      {paymentDialogLead && (
        <EnrollmentPaymentDialog
          open={!!paymentDialogLead}
          onOpenChange={(open) => { if (!open) setPaymentDialogLead(null) }}
          lead={paymentDialogLead}
          onSuccess={async () => { setPaymentDialogLead(null) }}
        />
      )}

      {/* PSP Submission Wizard - used to complete PUC info/docs before Document Submission */}
      <PSPSubmissionWizard
        isOpen={!!pspWizardLead}
        onClose={() => {
          setPspWizardLead(null)
          // Refresh doc status data after wizard closes (docs may have been uploaded / payment made)
          refreshPucDocCounts()
          refreshPucPaymentStatus()
        }}
        lead={pspWizardLead}
        onSuccess={() => {
          setPspWizardLead(null)
          refreshPucDocCounts()
          refreshPucPaymentStatus()
        }}
      />

      {/* Appointment Detail Modal */}
      <AppointmentDetail
        appointment={viewingAppointment}
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
      />
    </>
  )
}
