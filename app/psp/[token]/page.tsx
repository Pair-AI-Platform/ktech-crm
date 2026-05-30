"use client"

import { useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
  getDocumentsForGraduateType,
  type GraduateType,
  type DocumentRule,
  type ConditionalDocumentFlags,
} from "@/lib/psp/document-rules"
import { MAJORS, type IntendedMajor } from "@/types"
import { getArabicLeadDisplayName, getArabicLeadNameParts } from "@/lib/lead-name-policy"

type PageState = "verify" | "verifying" | "ready" | "submitted" | "expired" | "error"

interface LeadView {
  id: string
  first_name: string | null
  last_name: string | null
  first_name_ar: string | null
  last_name_ar: string | null
  civil_id: string | null
  phone: string | null
  phone_secondary: string | null
  email: string | null
  date_of_birth: string | null
  school_id: string | null
  graduation_year: number | null
  gpa_grade_11: number | null
  intended_major: IntendedMajor | null
  education_type: GraduateType | null
  is_diplomatic: boolean | null
  is_special_needs: boolean | null
  funding_type: string | null
}

interface UploadedDoc {
  id: string
  document_type: string
  graduate_type: string
  file_name: string
  public_url: string | null
  is_verified: boolean
  uploaded_at: string
  expiration_date: string | null
}

const GRAD_TYPES: { id: GraduateType; label: string; labelAr: string }[] = [
  { id: "GOV", label: "GOV", labelAr: "حكومية" },
  { id: "US", label: "US", labelAr: "أمريكية" },
  { id: "UK", label: "UK", labelAr: "بريطانية" },
  { id: "KSA", label: "KSA", labelAr: "سعودية" },
  { id: "OTHER", label: "Others", labelAr: "أخرى" },
]

// Lead.education_type may arrive as lowercase "other" (from EducationType enum).
// PSP document rules use uppercase "OTHER" (GraduateType enum). Normalize here.
function normalizeGraduateType(raw: unknown): GraduateType | null {
  if (typeof raw !== "string") return null
  const upper = raw.toUpperCase()
  if (upper === "GOV" || upper === "US" || upper === "UK" || upper === "KSA" || upper === "OTHER") {
    return upper
  }
  return null
}

export default function PspSelfServicePage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<PageState>("verify")
  const [errorMsg, setErrorMsg] = useState("")
  const [lead, setLead] = useState<LeadView | null>(null)
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)

  // Phone-as-password: held in memory only, never persisted. Sent with every
  // API call so the server can verify the holder of the link is the lead.
  const [phone, setPhone] = useState("")
  const [verifyError, setVerifyError] = useState("")

  // Editable form state (phone intentionally omitted — it is the auth secret)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    first_name_ar: "",
    last_name_ar: "",
    civil_id: "",
    phone_secondary: "",
    email: "",
    date_of_birth: "",
    graduation_year: "",
    gpa_grade_11: "",
    intended_major: "" as IntendedMajor | "",
    education_type: null as GraduateType | null,
    is_diplomatic: false,
    is_special_needs: false,
  })

  async function verifyAndLoad(rawPhone: string) {
    if (!token) return
    const trimmed = rawPhone.trim()
    if (!trimmed) {
      setVerifyError("Phone number is required")
      return
    }
    setVerifyError("")
    setState("verifying")

    // Demo-preview short-circuit: lets agents see the student-facing form
    // without minting a real token. Any phone is accepted.
    if (token === "demo-preview") {
      const demoLead: LeadView = {
        id: "demo",
        first_name: "Aldana",
        last_name: "Ali",
        first_name_ar: "الدانة",
        last_name_ar: "علي",
        civil_id: "300010100123",
        phone: trimmed,
        phone_secondary: null,
        email: "aldana@example.com",
        date_of_birth: "2006-03-14",
        school_id: null,
        graduation_year: 2025,
        gpa_grade_11: 3.6,
        intended_major: "network_security",
        education_type: "GOV",
        is_diplomatic: false,
        is_special_needs: false,
        funding_type: "psp",
      }
      setLead(demoLead)
      setDocs([])
      setPhone(trimmed)
      setForm({
        first_name: demoLead.first_name ?? "",
        last_name: demoLead.last_name ?? "",
        first_name_ar: demoLead.first_name_ar ?? "",
        last_name_ar: demoLead.last_name_ar ?? "",
        civil_id: demoLead.civil_id ?? "",
        phone_secondary: "",
        email: demoLead.email ?? "",
        date_of_birth: demoLead.date_of_birth ?? "",
        graduation_year: String(demoLead.graduation_year ?? ""),
        gpa_grade_11: String(demoLead.gpa_grade_11 ?? ""),
        intended_major: demoLead.intended_major ?? "",
        education_type: "GOV",
        is_diplomatic: false,
        is_special_needs: false,
      })
      setState("ready")
      return
    }

    try {
      const res = await fetch(
        `/api/psp/self-service/details?token=${token}&phone=${encodeURIComponent(trimmed)}`,
      )
      if (res.status === 410) {
        setState("expired")
        return
      }
      if (res.status === 401) {
        setVerifyError("That phone number doesn't match the one on file.")
        setState("verify")
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setState("error")
        setErrorMsg(err.error || "Invalid link")
        return
      }
      const json = (await res.json()) as { lead: LeadView; documents: UploadedDoc[]; submitted_at: string | null }
      setLead(json.lead)
      setDocs(json.documents || [])
      setPhone(trimmed)
      const { firstName, lastName } = getArabicLeadNameParts(json.lead)
      setForm({
        first_name: firstName,
        last_name: lastName,
        first_name_ar: firstName,
        last_name_ar: lastName,
        civil_id: json.lead.civil_id ?? "",
        phone_secondary: json.lead.phone_secondary ?? "",
        email: json.lead.email ?? "",
        date_of_birth: json.lead.date_of_birth ?? "",
        graduation_year: json.lead.graduation_year ? String(json.lead.graduation_year) : "",
        gpa_grade_11: json.lead.gpa_grade_11 != null ? String(json.lead.gpa_grade_11) : "",
        intended_major: json.lead.intended_major ?? "",
        education_type: normalizeGraduateType(json.lead.education_type),
        is_diplomatic: !!json.lead.is_diplomatic,
        is_special_needs: !!json.lead.is_special_needs,
      })
      setState(json.submitted_at ? "submitted" : "ready")
    } catch {
      setState("error")
      setErrorMsg("Something went wrong")
    }
  }

  async function reloadDocs() {
    if (!token || !phone) return
    const res = await fetch(
      `/api/psp/self-service/details?token=${token}&phone=${encodeURIComponent(phone)}`,
    )
    if (!res.ok) return
    const json = (await res.json()) as { documents: UploadedDoc[] }
    setDocs(json.documents || [])
  }

  const requiredDocs = useMemo<DocumentRule[]>(() => {
    if (!form.education_type) return []
    const flags: ConditionalDocumentFlags = {
      isSpecialNeeds: form.is_special_needs,
      isDiplomatic: form.is_diplomatic,
    }
    return getDocumentsForGraduateType(form.education_type, flags)
  }, [form.education_type, form.is_special_needs, form.is_diplomatic])

  const docsByType = useMemo(() => {
    const map = new Map<string, UploadedDoc>()
    if (!form.education_type) return map
    for (const d of docs) {
      if (d.graduate_type === form.education_type) {
        map.set(d.document_type, d)
      }
    }
    return map
  }, [docs, form.education_type])

  async function saveInfo() {
    if (!token || !phone) return
    if (token === "demo-preview") {
      setSaving(true)
      await new Promise(r => setTimeout(r, 300))
      setSaving(false)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
      return
    }
    setSaving(true)
    try {
      const updates: Record<string, unknown> = {
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        first_name_ar: form.first_name_ar || null,
        last_name_ar: form.last_name_ar || null,
        civil_id: form.civil_id || null,
        phone_secondary: form.phone_secondary || null,
        email: form.email || null,
        date_of_birth: form.date_of_birth || null,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        gpa_grade_11: form.gpa_grade_11 ? Number(form.gpa_grade_11) : null,
        intended_major: form.intended_major || null,
        education_type: form.education_type,
      }
      const res = await fetch("/api/psp/self-service/save-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, phone, updates }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 410) {
          setState("expired")
          return
        }
        if (res.status === 401) {
          setVerifyError("Session expired — please verify your phone again.")
          setPhone("")
          setState("verify")
          return
        }
        alert(err.error || "Failed to save")
        return
      }
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
    } finally {
      setSaving(false)
    }
  }

  async function uploadDoc(rule: DocumentRule, file: File) {
    if (!token || !phone) return
    const gradType = form.education_type
    if (!gradType) return
    if (token === "demo-preview") {
      setUploadingDocId(rule.id)
      await new Promise(r => setTimeout(r, 400))
      setDocs(prev => [
        ...prev.filter(d => !(d.document_type === rule.id && d.graduate_type === gradType)),
        {
          id: `demo-${rule.id}-${Date.now()}`,
          document_type: rule.id,
          graduate_type: gradType,
          file_name: file.name,
          public_url: null,
          is_verified: false,
          uploaded_at: new Date().toISOString(),
          expiration_date: null,
        },
      ])
      setUploadingDocId(null)
      return
    }
    setUploadingDocId(rule.id)
    try {
      const fd = new FormData()
      fd.append("token", token)
      fd.append("phone", phone)
      fd.append("file", file)
      fd.append("document_type", rule.id)
      fd.append("graduate_type", gradType)
      const res = await fetch("/api/psp/self-service/upload-doc", { method: "POST", body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 410) {
          setState("expired")
          return
        }
        if (res.status === 401) {
          setVerifyError("Session expired — please verify your phone again.")
          setPhone("")
          setState("verify")
          return
        }
        alert(err.error || "Failed to upload")
        return
      }
      await reloadDocs()
    } finally {
      setUploadingDocId(null)
    }
  }

  async function submit() {
    if (!token || !phone) return
    if (token === "demo-preview") {
      setSubmitting(true)
      await new Promise(r => setTimeout(r, 500))
      setSubmitting(false)
      setState("submitted")
      return
    }
    setSubmitting(true)
    try {
      // Save edits first so submit reflects current state.
      await saveInfo()
      const res = await fetch("/api/psp/self-service/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, phone }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 410) {
          setState("expired")
          return
        }
        if (res.status === 401) {
          setVerifyError("Session expired — please verify your phone again.")
          setPhone("")
          setState("verify")
          return
        }
        alert(err.error || "Failed to submit")
        return
      }
      setState("submitted")
    } finally {
      setSubmitting(false)
    }
  }

  if (state === "verify" || state === "verifying") {
    return (
      <Shell>
        <VerifyForm
          loading={state === "verifying"}
          error={verifyError}
          onSubmit={verifyAndLoad}
        />
      </Shell>
    )
  }
  if (state === "expired") {
    return (
      <Shell>
        <Centered>
          <IconBubble color="amber">!</IconBubble>
          <h2 className="text-xl font-semibold text-slate-900 mt-3">Link Expired</h2>
          <p className="text-slate-500 mt-2 text-center">انتهت صلاحية هذا الرابط. يرجى التواصل مع فريق القبول.</p>
          <p className="text-slate-500 mt-1 text-center text-sm">This link has expired. Please contact the admissions team.</p>
        </Centered>
      </Shell>
    )
  }
  if (state === "error") {
    return (
      <Shell>
        <Centered>
          <IconBubble color="red">×</IconBubble>
          <h2 className="text-xl font-semibold text-slate-900 mt-3">Something Went Wrong</h2>
          <p className="text-slate-500 mt-2 text-center">{errorMsg}</p>
        </Centered>
      </Shell>
    )
  }

  const submittedBadge = state === "submitted"

  return (
    <Shell>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-gradient-to-br from-blue-50 to-slate-50">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">PSP Application / تقديم الطلب</h1>
          <p className="text-sm text-slate-600 mt-1">
            {lead
              ? `Welcome, ${getArabicLeadDisplayName(lead)}`
              : "Complete your KTECH application below"}
          </p>
          {submittedBadge && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
              ✓ Submitted — you can still edit until the link expires
            </div>
          )}
        </div>

        {/* Info section */}
        <section className="p-6 sm:p-8 space-y-5">
          <SectionTitle en="Student Information" ar="بيانات الطالب" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name (EN)" labelAr="الاسم الأول (إنجليزي)">
              <Input value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
            </Field>
            <Field label="Last Name (EN)" labelAr="اسم العائلة (إنجليزي)">
              <Input value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
            </Field>
            <Field label="First Name (AR)" labelAr="الاسم الأول (عربي)">
              <Input value={form.first_name_ar} onChange={(v) => setForm({ ...form, first_name_ar: v })} dir="rtl" />
            </Field>
            <Field label="Last Name (AR)" labelAr="اسم العائلة (عربي)">
              <Input value={form.last_name_ar} onChange={(v) => setForm({ ...form, last_name_ar: v })} dir="rtl" />
            </Field>
            <Field label="Civil ID" labelAr="الرقم المدني">
              <Input value={form.civil_id} onChange={(v) => setForm({ ...form, civil_id: v })} inputMode="numeric" />
            </Field>
            <Field label="Phone (Secondary)" labelAr="رقم هاتف إضافي">
              <Input value={form.phone_secondary} onChange={(v) => setForm({ ...form, phone_secondary: v })} inputMode="tel" />
            </Field>
            <Field label="Email" labelAr="البريد الإلكتروني">
              <Input value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            </Field>
            <Field label="Date of Birth" labelAr="تاريخ الميلاد">
              <Input value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} type="date" />
            </Field>
            <Field label="Graduation Year" labelAr="سنة التخرج">
              <Input value={form.graduation_year} onChange={(v) => setForm({ ...form, graduation_year: v })} inputMode="numeric" />
            </Field>
            <Field label="Actual Accumulative GPA" labelAr="المعدل التراكمي الفعلي">
              <Input value={form.gpa_grade_11} onChange={(v) => setForm({ ...form, gpa_grade_11: v })} inputMode="decimal" />
            </Field>
            <Field label="ktech Intended Major" labelAr="التخصص المطلوب في KTECH">
              <SelectInput
                value={form.intended_major}
                onChange={(v) => setForm({ ...form, intended_major: v as IntendedMajor | "" })}
                placeholder="Select intended major"
                options={MAJORS}
              />
            </Field>
          </div>
        </section>

        {/* Documents section */}
        <section className="p-6 sm:p-8 border-t border-slate-200 space-y-5 bg-slate-50/40">
          <SectionTitle en="Documents" ar="المستندات" />

          <div>
            <p className="text-xs text-slate-500 mb-2">
              Graduate Type / نوع الشهادة
              <span className="text-rose-600 ml-1">*</span>
            </p>
            {form.education_type ? (
              (() => {
                const g = GRAD_TYPES.find((t) => t.id === form.education_type)
                if (!g) return null
                return (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white border border-blue-600"
                    aria-label="Graduate type (set by admissions, not editable)"
                  >
                    <span className="font-medium">{g.label}</span>
                    <span className="text-xs opacity-80">{g.labelAr}</span>
                    <span
                      className="ml-1 text-[10px] uppercase tracking-wide opacity-70"
                      aria-hidden="true"
                    >
                      Locked
                    </span>
                  </div>
                )
              })()
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-rose-50 text-rose-700 border border-rose-200">
                <span className="font-medium">Not set — contact admissions</span>
                <span className="text-xs" dir="rtl">
                  لم يتم تحديد نوع الشهادة — يرجى التواصل مع القبول
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {requiredDocs.map((rule) => {
              const uploaded = docsByType.get(rule.id)
              return (
                <DocRow
                  key={rule.id}
                  rule={rule}
                  uploaded={uploaded}
                  uploading={uploadingDocId === rule.id}
                  onUpload={(file) => uploadDoc(rule, file)}
                />
              )
            })}
          </div>
        </section>

        {/* Footer actions */}
        <div className="p-6 sm:p-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
          <div className="text-xs text-slate-500">
            {savedFlash && <span className="text-emerald-600 font-medium">✓ Saved</span>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveInfo}
              disabled={saving || submitting}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save / حفظ"}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving || submitting || !form.education_type}
              title={!form.education_type ? "Graduate type is not set — please contact admissions" : undefined}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-medium"
            >
              {submitting ? "Submitting..." : submittedBadge ? "Re-submit / إعادة الإرسال" : "Submit / إرسال"}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  )
}

function VerifyForm({
  loading,
  error,
  onSubmit,
}: {
  loading: boolean
  error: string
  onSubmit: (phone: string) => void
}) {
  const [value, setValue] = useState("")
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-900 text-center">Verify your identity</h2>
      <p className="text-sm text-slate-500 text-center mt-1">تأكيد الهوية</p>
      <p className="text-xs text-slate-500 text-center mt-3">
        Enter the phone number registered with KTECH to open your application.
      </p>
      <p className="text-xs text-slate-500 text-center mt-1" dir="rtl">
        أدخل رقم الهاتف المسجل لدى KTECH لفتح طلبك.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(value)
        }}
        className="mt-5 space-y-3"
      >
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 51234567"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-wider"
          autoFocus
        />
        {error && <p className="text-xs text-rose-600 text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-medium"
        >
          {loading ? "Verifying..." : "Continue / متابعة"}
        </button>
      </form>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">ktech</h1>
          <p className="text-xs text-slate-500">Kuwait Technical College</p>
        </div>
        {children}
        <p className="text-center text-[11px] text-slate-400 mt-6">Kuwait Technical College &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 flex flex-col items-center justify-center">
      {children}
    </div>
  )
}

function IconBubble({ color, children }: { color: "amber" | "red"; children: React.ReactNode }) {
  const palette = color === "amber" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
  return <div className={`w-14 h-14 rounded-full ${palette} flex items-center justify-center text-2xl font-bold`}>{children}</div>
}

function SectionTitle({ en, ar }: { en: string; ar: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-900">{en}</h2>
      <p className="text-xs text-slate-500" dir="rtl">{ar}</p>
    </div>
  )
}

function Field({ label, labelAr, children }: { label: string; labelAr: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-[11px] text-slate-400" dir="rtl">{labelAr}</span>
      </div>
      {children}
    </label>
  )
}

function Input(props: {
  value: string
  onChange: (v: string) => void
  type?: string
  inputMode?: "text" | "numeric" | "tel" | "email" | "decimal"
  dir?: "ltr" | "rtl"
}) {
  return (
    <input
      type={props.type ?? "text"}
      inputMode={props.inputMode}
      dir={props.dir}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  )
}

function SelectInput(props: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">{props.placeholder}</option>
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function DocRow({
  rule,
  uploaded,
  uploading,
  onUpload,
}: {
  rule: DocumentRule
  uploaded?: UploadedDoc
  uploading: boolean
  onUpload: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const accept = rule.acceptedFileTypes.join(",")

  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900">{rule.name}</span>
          <span className="text-xs text-slate-500" dir="rtl">{rule.nameAr}</span>
          {rule.required ? (
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Required</span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Optional</span>
          )}
          {uploaded && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {uploaded.is_verified ? "Verified" : "Uploaded"}
            </span>
          )}
        </div>
        {uploaded?.file_name && (
          <p className="text-xs text-slate-500 mt-1 truncate">{uploaded.file_name}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {uploaded?.public_url && (
          <a
            href={uploaded.public_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View
          </a>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
            if (inputRef.current) inputRef.current.value = ""
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-60"
        >
          {uploading ? "Uploading..." : uploaded ? "Replace" : "Upload"}
        </button>
      </div>
    </div>
  )
}
