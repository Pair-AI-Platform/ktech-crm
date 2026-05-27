"use client"

import dynamic from "next/dynamic"
import type { Lead, PipelineStage, LeadStatus } from "@/types"
import type { SubmissionBlockedReason } from "@/types"
import { getLeadDisplayName as _getLeadDisplayName } from "@/lib/lead-utils"

const AppointmentBooking = dynamic(
  () => import("@/components/calendar/appointment-booking").then(m => m.AppointmentBooking),
  { ssr: false }
)
const AppointmentDetail = dynamic(
  () => import("@/components/calendar/appointment-detail").then(m => m.AppointmentDetail),
  { ssr: false }
)
const CallbackScheduler = dynamic(
  () => import("@/components/leads/callback-scheduler").then(m => m.CallbackScheduler),
  { ssr: false }
)
const MarkLostDialog = dynamic(
  () => import("@/components/leads/mark-lost-dialog").then(m => m.MarkLostDialog),
  { ssr: false }
)
const ContactedStatusDialog = dynamic(
  () => import("@/components/leads/contacted-status-dialog").then(m => m.ContactedStatusDialog),
  { ssr: false }
)
const BlockedReasonDialog = dynamic(
  () => import("@/components/leads/blocked-reason-dialog").then(m => m.BlockedReasonDialog),
  { ssr: false }
)
const WithdrawReasonDialog = dynamic(
  () => import("@/components/leads/withdraw-reason-dialog").then(m => m.WithdrawReasonDialog),
  { ssr: false }
)
const EnrollmentPaymentDialog = dynamic(
  () => import("@/components/leads/enrollment-payment-dialog").then(m => m.EnrollmentPaymentDialog),
  { ssr: false }
)
const FileFeePaymentDialog = dynamic(
  () => import("@/components/leads/file-fee-payment-dialog").then(m => m.FileFeePaymentDialog),
  { ssr: false }
)
const FileStageRequirementsDialog = dynamic(
  () => import("@/components/leads/file-stage-requirements-dialog").then(m => m.FileStageRequirementsDialog),
  { ssr: false }
)
const PSPSubmissionWizard = dynamic(
  () => import("@/components/leads/psp-submission-wizard").then(m => m.PSPSubmissionWizard),
  { ssr: false }
)

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
      {bookingLead && (
        <AppointmentBooking
          isOpen={!!bookingLead}
          onClose={() => {
            setBookingLead(null)
            setBookingSimpleMode(false)
            setBookingCallbackMode(false)
          }}
          onSuccess={() => {
            // Don't close the modal here - let the success animation play.
            // The modal auto-closes after its own success timeout.
          }}
          preselectedLead={bookingLead}
          singleFormMode={true}
          callbackMode={bookingCallbackMode}
        />
      )}

      {/* Callback Scheduler Popup */}
      {callbackLead && (
        <CallbackScheduler
          isOpen={!!callbackLead}
          onClose={() => {
            setCallbackLead(null)
            setCallbackFromStage(undefined)
          }}
          onSuccess={() => {
            incrementContactCount(callbackLead.id)
            setCallbackLead(null)
            setCallbackFromStage(undefined)
          }}
          onUpdateLead={updateLead}
          lead={callbackLead}
          fromStage={callbackFromStage}
        />
      )}

      {/* Mark Lost Dialog / Assign Reason Dialog */}
      {lostDialogLead && (
        <MarkLostDialog
          open={!!lostDialogLead}
          onOpenChange={(open) => {
            if (!open) setLostDialogLead(null)
          }}
          leadName={getLeadDisplayName(lostDialogLead)}
          onConfirm={assignReasonMode && handleAssignLostReason ? handleAssignLostReason : handleLostConfirm}
          assignReasonMode={assignReasonMode}
        />
      )}

      {/* Contacted Status Required Dialog */}
      {contactedDialogLead && (
        <ContactedStatusDialog
          open={!!contactedDialogLead}
          onOpenChange={(open) => {
            if (!open) setContactedDialogLead(null)
          }}
          leadName={getLeadDisplayName(contactedDialogLead)}
          currentStatus={contactedDialogLead.status as LeadStatus | null | undefined}
          onConfirm={handleContactedConfirm}
        />
      )}

      {/* Withdraw Reason Dialog */}
      {withdrawDialogLead && (
        <WithdrawReasonDialog
          open={!!withdrawDialogLead}
          onOpenChange={(open) => {
            if (!open) setWithdrawDialogLead(null)
          }}
          leadName={getLeadDisplayName(withdrawDialogLead)}
          onConfirm={handleWithdrawConfirm}
        />
      )}

      {/* Edit Withdraw Reason Dialog (for existing withdrawn leads) */}
      {editWithdrawReasonLead && (
        <WithdrawReasonDialog
          open={!!editWithdrawReasonLead}
          onOpenChange={(open) => {
            if (!open) setEditWithdrawReasonLead(null)
          }}
          leadName={getLeadDisplayName(editWithdrawReasonLead)}
          onConfirm={handleEditWithdrawReasonConfirm}
        />
      )}

      {/* Blocked Reason Dialog (PUC PSP) */}
      {blockedDialogLead && (
        <BlockedReasonDialog
          open={!!blockedDialogLead}
          onOpenChange={(open) => {
            if (!open) setBlockedDialogLead(null)
          }}
          leadName={getLeadDisplayName(blockedDialogLead)}
          onConfirm={handleBlockedConfirm}
        />
      )}

      {/* File stage requirements dialog */}
      {fileRequirementsDialog && (
        <FileStageRequirementsDialog
          open={!!fileRequirementsDialog}
          lead={fileRequirementsDialog.lead}
          missingFields={fileRequirementsDialog.missingFields}
          onOpenChange={(open) => {
            if (!open) setFileRequirementsDialog(null)
          }}
          onFillRequiredFields={() => {
            const lead = fileRequirementsDialog.lead
            setFileRequirementsDialog(null)
            setPspWizardLead(lead)
          }}
        />
      )}

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
      {pspWizardLead && (
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
      )}

      {/* Appointment Detail Modal */}
      {viewingAppointment && (
        <AppointmentDetail
          appointment={viewingAppointment}
          isOpen={!!viewingAppointment}
          onClose={() => setViewingAppointment(null)}
        />
      )}
    </>
  )
}
