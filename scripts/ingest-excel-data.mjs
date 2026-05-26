#!/usr/bin/env node
// One-time ETL: parses the two operational Excel files
//   - COLLEGE APPLICANT QUALITY SCALE.xlsx (2,223 applicants Nov 2025 → May 2026)
//   - school visit 2026.xlsx (per-school visit logs)
// Produces imports/applicants.json and imports/visit-leads.json ready for
// POST /api/leads/bulk-import. Also writes audit reports.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/ingest-excel-data.mjs [--dry-run]
//
// The script needs read access to the `schools`, `semesters`, and `profiles`
// tables to resolve foreign keys. Output JSON contains no service-role secrets.

import { createClient } from "@supabase/supabase-js"
import { readFile, writeFile, mkdir, open } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import * as XLSX from "xlsx"

// -----------------------------------------------------------------------------
// CLI args + paths
// -----------------------------------------------------------------------------

const ROOT = process.cwd()
const QUALITY_PATH = path.join(ROOT, "COLLEGE APPLICANT QUALITY SCALE.xlsx")
const VISIT_PATH = path.join(ROOT, "school visit 2026.xlsx")
const OUT_DIR = path.join(ROOT, "imports")

const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has("--dry-run")

// -----------------------------------------------------------------------------
// Supabase client (read-only; we never write from this script)
// -----------------------------------------------------------------------------

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_API_URL
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env")
  process.exit(1)
}
const supabase = createClient(url, key, { auth: { persistSession: false } })

// -----------------------------------------------------------------------------
// School-name normalizer (mirrors lib/schools/search.ts so matching is identical)
// -----------------------------------------------------------------------------

function normalizeSchoolSearchText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim()
}

function compactArabic(value) {
  return normalizeSchoolSearchText(value).replace(/\s+/g, "")
}

// -----------------------------------------------------------------------------
// Scoring (mirrors lib/lead-scoring.ts so the script is self-contained)
// -----------------------------------------------------------------------------

const GOVERNORATE_SCORES = {
  capital: 5,
  hawalli: 5,
  mubarak_alkabeer: 4,
  ahmadi: 4,
  jahra: 3,
  farwaniya: 3,
  "al asimah": 5,
  "mubarak al-kabeer": 4,
  "mubarak al kabeer": 4,
  "al jahra": 3,
}

function scoreGpa(gpa) {
  if (gpa == null || Number.isNaN(gpa)) return null
  if (gpa >= 80) return 5
  if (gpa >= 70) return 4
  return 3
}
function scorePlacementTest(raw) {
  if (raw == null || Number.isNaN(raw)) return null
  if (raw >= 45) return 3
  if (raw >= 24) return 4
  return 0
}
function classifyFoundationLevel(raw) {
  if (raw == null || Number.isNaN(raw)) return null
  if (raw < 30) return "not_pass"
  if (raw < 50) return "f1"
  if (raw < 70) return "f2"
  return "major"
}
function scoreGender(g) {
  if (!g) return null
  const v = String(g).toLowerCase().trim()
  if (v === "female") return 5
  if (v === "male") return 4
  return null
}
function scoreGovernorate(g) {
  if (!g) return null
  return GOVERNORATE_SCORES[String(g).toLowerCase().trim()] ?? 0
}
function computeFinalScore(p) {
  if (p.gender_score == null) return null
  const raw = (p.gpa_auto_score ?? 0) * 0.4
    + (p.placement_test_auto_score ?? 0) * 0.2
    + p.gender_score * 0.3
    + (p.governorate_score ?? 0) * 0.1
  return Math.round(raw * 100) / 100
}
function classifyTier(score) {
  if (score == null || Number.isNaN(score)) return null
  if (score >= 4.3) return "tier_1_excellent"
  if (score >= 3.6) return "tier_2_very_good"
  if (score >= 3) return "tier_3_good"
  if (score >= 2) return "tier_4_weak"
  return "tier_5_not_eligible"
}
function calculateLeadQuality({ gpa, placement_test_raw, gender, governorate }) {
  const gpa_auto_score = scoreGpa(gpa)
  const placement_test_auto_score = scorePlacementTest(placement_test_raw)
  const foundation_level = classifyFoundationLevel(placement_test_raw)
  const gender_score = scoreGender(gender)
  const governorate_score = scoreGovernorate(governorate)
  const final_weighted_score = computeFinalScore({
    gpa_auto_score, placement_test_auto_score, gender_score, governorate_score,
  })
  const quality_tier = classifyTier(final_weighted_score)
  return {
    gpa_auto_score, placement_test_auto_score, foundation_level,
    gender_score, governorate_score, final_weighted_score, quality_tier,
  }
}

// -----------------------------------------------------------------------------
// Excel-value mappers
// -----------------------------------------------------------------------------

const SOURCE_MAP = {
  bulk: "gpa_lists",
  "school visit": "school_visit",
  "school list": "gpa_lists",
  "call center": "call_center",
  ai: "whatsapp_ai",
  carnival: "karnival",
  "carnival 26 attend boys": "karnival",
  "carnival 26 attend girls": "karnival",
  "dasman expo": "exhibitions",
  expo: "exhibitions",
  "ktech student": "current_student_referral",
  "ktech applicant": "current_student_referral",
  "my source": "staff_referral",
  walkin: "walk_in",
  "walk in": "walk_in",
  "walk-in": "walk_in",
  whatsapp: "whatsapp",
  facebook: "facebook",
  instagram: "instagram",
  tiktok: "tiktok",
}

const SOURCE_CATEGORY_MAP = {
  walk_in: "direct",
  call_center: "direct",
  whatsapp: "direct",
  whatsapp_ai: "direct",
  email: "direct",
  school_visit: "outreach",
  exhibitions: "events",
  karnival: "events",
  website_form: "marketing",
  facebook: "marketing",
  instagram: "marketing",
  tiktok: "marketing",
  email_marketing: "marketing",
  current_student_referral: "referrals",
  staff_referral: "referrals",
  friend_referral: "referrals",
  old_contacts: "outreach",
  paaet_rejected: "outreach",
  gpa_lists: "outreach",
}

const TRACK_MAP = {
  science: "science",
  art: "arts",
  arts: "arts",
  literary: "arts",
  ادبي: "arts",
  علمي: "science",
}

const MAJOR_MAP = {
  "cyber security": "cyber_security",
  cyber: "cyber_security",
  "cyber-security": "cyber_security",
  cybersecurity: "cyber_security",
  cis: "cis",
  marketing: "marketing",
  accounting: "accounting",
  mis: "mis",
  "network security": "network_security",
  network: "network_security",
}

const GOV_MAP = {
  "al asimah": "capital",
  "al-asimah": "capital",
  asimah: "capital",
  capital: "capital",
  hawalli: "hawalli",
  hawally: "hawalli",
  "mubarak al-kabeer": "mubarak_alkabeer",
  "mubarak al kabeer": "mubarak_alkabeer",
  mubarak_alkabeer: "mubarak_alkabeer",
  ahmadi: "ahmadi",
  "al ahmadi": "ahmadi",
  "al-ahmadi": "ahmadi",
  jahra: "jahra",
  "al jahra": "jahra",
  "al-jahra": "jahra",
  farwaniya: "farwaniya",
  farwania: "farwaniya",
}

function mapSource(raw) {
  if (!raw) return null
  return SOURCE_MAP[String(raw).toLowerCase().trim()] ?? null
}
function sourceCategoryFor(src) { return SOURCE_CATEGORY_MAP[src] ?? "outreach" }
function mapTrack(raw) { return raw ? TRACK_MAP[String(raw).toLowerCase().trim()] ?? null : null }
function mapMajor(raw) {
  if (!raw) return null
  const v = String(raw).toLowerCase().trim()
  return MAJOR_MAP[v] ?? (v ? "other" : null)
}
function mapGovernorate(raw) {
  if (!raw) return null
  return GOV_MAP[String(raw).toLowerCase().trim()] ?? null
}

// -----------------------------------------------------------------------------
// Field helpers
// -----------------------------------------------------------------------------

function normalizePhone(raw) {
  if (raw == null) return null
  const digits = String(raw).replace(/\D+/g, "")
  if (!digits) return null
  // Strip leading 965 country code if present
  const local = digits.length > 8 && digits.startsWith("965") ? digits.slice(3) : digits
  if (local.length < 8) return null
  const eight = local.slice(0, 8)
  // System CHECK constraint: must start with 5, 6, or 9
  if (!/^[569]/.test(eight)) return null
  return eight
}

function normalizeCivilId(raw) {
  if (raw == null) return null
  const digits = String(raw).replace(/\D+/g, "")
  if (digits.length !== 12) return null
  // System CHECK: must start with 2 or 3
  if (!/^[23]/.test(digits)) return null
  return digits
}

function splitArabicName(full) {
  if (!full) return { first_name_ar: null, last_name_ar: null, full_name_ar: null }
  const cleaned = String(full).trim().replace(/\s+/g, " ")
  if (!cleaned) return { first_name_ar: null, last_name_ar: null, full_name_ar: null }
  const parts = cleaned.split(" ")
  const first = parts[0]
  const last = parts.length > 1 ? parts.slice(1).join(" ") : ""
  return { first_name_ar: first, last_name_ar: last, full_name_ar: cleaned }
}

function transliteratePlaceholder(arabicName) {
  // The DB requires NOT NULL first_name/last_name in latin. We don't have a clean
  // transliteration in Excel; use a stable placeholder so the row is insertable.
  // The Arabic name fields carry the real value, which the UI prefers anyway.
  return arabicName ? `ar:${arabicName.slice(0, 80)}` : "Unknown"
}

function excelDateToISO(raw) {
  if (raw == null || raw === "") return null
  if (raw instanceof Date) return raw.toISOString()
  if (typeof raw === "number") {
    // Excel serial date: days since 1899-12-30. cellDates:true usually handles this,
    // but fall back manually in case a cell slipped through as a raw number.
    const ms = Math.round((raw - 25569) * 86400 * 1000)
    const js = new Date(ms)
    return Number.isNaN(js.getTime()) ? null : js.toISOString()
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function numOrNull(raw) {
  if (raw == null || raw === "" || raw === "-" || raw === "\xa0") return null
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/,/g, ""))
  return Number.isFinite(n) ? n : null
}

function pipelineStageForApplicant(placement_test_raw, sheetName) {
  // If they took the test, they progressed at least to 'test'; default historical
  // months to 'applicant'. May is still active so leave at 'test'.
  if (placement_test_raw == null) return "visit"
  if (sheetName === "May") return "test"
  return "applicant"
}

// -----------------------------------------------------------------------------
// Reference data
// -----------------------------------------------------------------------------

async function loadSchools() {
  console.log("Loading schools from DB...")
  const { data, error } = await supabase
    .from("schools")
    .select("id, name_en, name_ar, gender, governorate")
  if (error) throw new Error(`Failed to load schools: ${error.message}`)
  console.log(`  ${data.length} schools loaded`)

  // Build lookup index: normalized text → school
  const byNormalized = new Map()
  const byCompact = new Map()
  for (const s of data) {
    const normAr = normalizeSchoolSearchText(s.name_ar)
    const normEn = normalizeSchoolSearchText(s.name_en)
    const compactAr = compactArabic(s.name_ar)
    if (normAr && !byNormalized.has(normAr)) byNormalized.set(normAr, s)
    if (normEn && !byNormalized.has(normEn)) byNormalized.set(normEn, s)
    if (compactAr && !byCompact.has(compactAr)) byCompact.set(compactAr, s)
  }
  return { all: data, byNormalized, byCompact }
}

function matchSchool(name, idx) {
  if (!name) return null
  const norm = normalizeSchoolSearchText(name)
  if (!norm) return null
  if (idx.byNormalized.has(norm)) return idx.byNormalized.get(norm)
  const compact = norm.replace(/\s+/g, "")
  if (idx.byCompact.has(compact)) return idx.byCompact.get(compact)
  // Fuzzy: search any normalized name that contains the query (or vice versa)
  for (const s of idx.all) {
    const sNorm = normalizeSchoolSearchText(s.name_ar)
    if (!sNorm) continue
    if (sNorm.includes(norm) || norm.includes(sNorm)) return s
  }
  return null
}

async function loadSemesters() {
  console.log("Loading semesters from DB...")
  const { data, error } = await supabase
    .from("semesters")
    .select("id, name, start_date, end_date, is_active")
    .order("start_date", { ascending: true })
  if (error) throw new Error(`Failed to load semesters: ${error.message}`)
  console.log(`  ${data.length} semesters loaded`)
  return data
}

function semesterFor(date, semesters) {
  if (!date) return semesters.find((s) => s.is_active) || semesters[semesters.length - 1]
  const t = new Date(date).getTime()
  for (const s of semesters) {
    const start = new Date(s.start_date).getTime()
    const end = new Date(s.end_date).getTime() + 24 * 60 * 60 * 1000
    if (t >= start && t < end) return s
  }
  return semesters.find((s) => s.is_active) || semesters[semesters.length - 1]
}

async function loadAgents() {
  console.log("Loading profiles for agent assignment...")
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
  if (error) throw new Error(`Failed to load profiles: ${error.message}`)
  console.log(`  ${data.length} profiles loaded`)
  const byName = new Map()
  for (const p of data) {
    const key = String(p.full_name || "").toLowerCase().trim()
    if (key && !byName.has(key)) byName.set(key, p)
    const firstWord = key.split(" ")[0]
    if (firstWord && !byName.has(firstWord)) byName.set(firstWord, p)
    const emailLocal = String(p.email || "").split("@")[0].toLowerCase()
    if (emailLocal && !byName.has(emailLocal)) byName.set(emailLocal, p)
  }
  return byName
}

function matchAgent(name, byName) {
  if (!name) return null
  const key = String(name).toLowerCase().trim()
  if (byName.has(key)) return byName.get(key)
  const firstWord = key.split(" ")[0]
  if (byName.has(firstWord)) return byName.get(firstWord)
  return null
}

// -----------------------------------------------------------------------------
// Parse: COLLEGE APPLICANT QUALITY SCALE
// -----------------------------------------------------------------------------

const QUALITY_SHEETS = [
  "High GPA",
  "November",
  "December",
  "January",
  "February",
  "Ramdan Feb - Mar",
  "March",
  "April",
  "May",
]

function parseQualitySheet(wb, sheetName, ctx) {
  const ws = wb.Sheets[sheetName]
  if (!ws || !ws["!ref"]) return []
  // Read defensively — Excel sheets can have formatting extending past data.
  const range = XLSX.utils.decode_range(ws["!ref"])
  const maxRow = Math.min(range.e.r, 5000)
  const maxCol = Math.min(range.e.c, 50)
  // Materialize just the header row + bounded data range as a 2D array.
  const rows = []
  for (let i = 0; i <= maxRow; i++) {
    const row = []
    for (let j = 0; j <= maxCol; j++) row.push(cellAt(ws, i, j))
    rows.push(row)
  }
  const headers = (rows[1] || []).map((h) => (h == null ? "" : String(h).trim().toLowerCase()))
  const colOf = (label) => headers.findIndex((h) => h === label.toLowerCase())
  const c = {
    code: colOf("code no."),
    name: colOf("applicant name"),
    civil: colOf("civil id"),
    phone: colOf("contact no."),
    phone2: colOf("emergency contact no."),
    school: colOf("school name"),
    source: colOf("source"),
    major: colOf("major"),
    intended: colOf("intended major"),
    classOf: colOf("class of"),
    specialNeed: colOf("special need"),
    athlete: colOf("athelete"),
    date: colOf("date"),
    gpa: colOf("gpa"),
    placement: colOf("placement test"),
    foundation: colOf("foundation"),
    gender: colOf("gender score"),
    governorate: colOf("governorate"),
    onlineCampus: colOf("online/campus"),
    note: colOf("note"),
    agent: colOf("agent"),
  }

  // Some sheets have two "Gender Score" columns: the first is the gender value
  // ("Male"/"Female") and the second is the numeric component score. Same for
  // "Governorate Score". We took the first (the value) above; ignore numerics.

  const out = []
  let consecutiveBlank = 0
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    const name = r[c.name]
    const phone = r[c.phone]
    if (!name && !phone) {
      if (++consecutiveBlank >= 50) break
      continue
    }
    consecutiveBlank = 0

    const arabicName = splitArabicName(name)
    const normPhone = normalizePhone(phone)
    const normCivil = normalizeCivilId(r[c.civil])
    if (!normPhone) {
      ctx.warnings.push(`[${sheetName} row ${i + 1}] invalid phone "${phone}" — skipping`)
      continue
    }

    const gpaRaw = numOrNull(r[c.gpa])
    const placementRaw = numOrNull(r[c.placement])
    const gender = r[c.gender]
    const governorate = mapGovernorate(r[c.governorate])

    const scoring = calculateLeadQuality({
      gpa: gpaRaw, placement_test_raw: placementRaw, gender, governorate,
    })

    const source = mapSource(r[c.source]) || "gpa_lists"
    const matchedSchool = matchSchool(r[c.school], ctx.schoolIdx)
    if (r[c.school] && !matchedSchool) ctx.unmatchedSchools.add(String(r[c.school]).trim())
    const matchedAgent = matchAgent(r[c.agent], ctx.agentsByName)
    if (r[c.agent] && !matchedAgent) ctx.unmatchedAgents.add(String(r[c.agent]).trim())
    const createdAt = excelDateToISO(r[c.date])
    const semester = semesterFor(createdAt, ctx.semesters)

    const noteBits = []
    if (r[c.code]) noteBits.push(`excel_code:${r[c.code]}`)
    if (r[c.specialNeed] && String(r[c.specialNeed]).toLowerCase() === "yes") noteBits.push("special_need:yes")
    if (r[c.athlete] && String(r[c.athlete]).toLowerCase() === "yes") noteBits.push("athlete:yes")
    if (r[c.onlineCampus]) noteBits.push(`mode:${r[c.onlineCampus]}`)
    if (r[c.note]) noteBits.push(String(r[c.note]))
    noteBits.push(`source_sheet:${sheetName}`)

    out.push({
      first_name: transliteratePlaceholder(arabicName.first_name_ar),
      last_name: transliteratePlaceholder(arabicName.last_name_ar),
      first_name_ar: arabicName.first_name_ar,
      last_name_ar: arabicName.last_name_ar,
      full_name_ar: arabicName.full_name_ar,
      civil_id: normCivil,
      phone: normPhone,
      phone_secondary: normalizePhone(r[c.phone2]),
      gender: scoring.gender_score != null ? (scoring.gender_score === 5 ? "female" : "male") : null,
      nationality: "Kuwaiti",
      is_kuwaiti: true,
      school_id: matchedSchool?.id ?? null,
      school_name_custom: matchedSchool ? null : (r[c.school] ? String(r[c.school]).trim() : null),
      governorate: governorate,
      grade_level: "12th",
      academic_track: mapTrack(r[c.major]),
      gpa_grade_12_expected: gpaRaw,
      intended_major: mapMajor(r[c.intended]),
      graduation_year: numOrNull(r[c.classOf]),
      funding_type: "self_funded",
      has_weyay_account: false,
      has_bank_account: false,
      source_category: sourceCategoryFor(source),
      source,
      semester_id: semester?.id ?? null,
      pipeline_stage: pipelineStageForApplicant(placementRaw, sheetName),
      contact_status: "interested",
      assigned_to: matchedAgent?.id ?? null,
      created_at: createdAt,
      external_code: r[c.code] ? String(r[c.code]) : null,
      placement_test_raw: placementRaw,
      placement_english_score: placementRaw,
      // Scoring fields — recomputed server-side too, but ship them for fidelity
      gpa_auto_score: scoring.gpa_auto_score,
      placement_test_auto_score: scoring.placement_test_auto_score,
      foundation_level: scoring.foundation_level,
      gender_score: scoring.gender_score,
      governorate_score: scoring.governorate_score,
      final_weighted_score: scoring.final_weighted_score,
      quality_tier: scoring.quality_tier,
      notes: noteBits.join(" | "),
    })
  }
  return out
}

// -----------------------------------------------------------------------------
// Parse: school visit 2026 (per-school sheets)
// -----------------------------------------------------------------------------

const VISIT_SKIP_SHEETS = new Set(["Used Schools"])

const USED_SCHOOLS_MONTHS = {
  november: "2025-11",
  december: "2025-12",
  january: "2026-01",
  february: "2026-02",
  march: "2026-03",
  april: "2026-04",
  may: "2026-05",
}

// Parses the "Used Schools" master sheet that records, per month:
// which agent(s) visited which school(s). Returns an array of
// { normalized, month, agents }. We use it during visit-sheet parsing
// to backdate created_at and assign an owner agent.
function parseUsedSchoolsAssignments(wb) {
  const ws = wb.Sheets["Used Schools"]
  if (!ws || !ws["!ref"]) return []
  const range = XLSX.utils.decode_range(ws["!ref"])
  const out = []
  let currentMonth = null

  for (let i = 0; i <= range.e.r; i++) {
    const a = cellAt(ws, i, 0)
    const b = cellAt(ws, i, 1)
    const aStr = a == null ? "" : String(a).trim()
    const aLower = aStr.toLowerCase()
    if (aLower && USED_SCHOOLS_MONTHS[aLower]) {
      currentMonth = USED_SCHOOLS_MONTHS[aLower]
      continue
    }
    if (aLower === "agent") continue
    if (!currentMonth) continue
    if (!b) continue
    const bStr = String(b).trim()
    if (!bStr || bStr === "-" || bStr.toLowerCase() === "leave") continue

    // Split agent cell on +, /, comma; drop "all" placeholder.
    const agents = aStr
      .split(/[+/,]|\s+and\s+/i)
      .map((s) => s.trim())
      .filter((s) => s && s.toLowerCase() !== "all")

    // Split school cell on + or / or - (when surrounded by content).
    const schoolParts = bStr
      .split(/[+/]|(?<=\S)\s*-\s*(?=\S)/)
      .map((s) => s.trim())
      .filter((s) => s && s !== "-" && s.toLowerCase() !== "leave")

    for (const s of schoolParts) {
      out.push({
        normalized: normalizeSchoolSearchText(s),
        compact: normalizeSchoolSearchText(s).replace(/\s+/g, ""),
        raw: s,
        month: currentMonth,
        agents,
      })
    }
  }
  return out
}

function findUsedSchoolsAssignment(query, assignments) {
  if (!query) return null
  const norm = normalizeSchoolSearchText(query)
  if (!norm) return null
  const compact = norm.replace(/\s+/g, "")
  // First pass: exact or substring match
  for (const a of assignments) {
    if (a.normalized === norm) return a
  }
  for (const a of assignments) {
    if (a.normalized.includes(norm) || norm.includes(a.normalized)) return a
  }
  for (const a of assignments) {
    if (a.compact.includes(compact) || compact.includes(a.compact)) return a
  }
  return null
}

// Read a single cell value without materializing the whole sheet.
function cellAt(ws, row, col) {
  // row/col are 0-indexed
  const addr = XLSX.utils.encode_cell({ r: row, c: col })
  const cell = ws[addr]
  return cell == null ? null : (cell.v ?? null)
}

function parseVisitSheet(wb, sheetName, ctx) {
  const ws = wb.Sheets[sheetName]
  if (!ws || !ws["!ref"]) return []

  // Layout: row 3 holds the school name in col A; row 4 is header; row 5+ is data.
  // Read only the cells we care about — many sheets extend formatting to row 1,048,575.
  const schoolNameRaw = cellAt(ws, 3, 0)
  const schoolHit = matchSchool(schoolNameRaw || sheetName, ctx.schoolIdx)
  if (!schoolHit) {
    ctx.unmatchedSchools.add(String(schoolNameRaw || sheetName).trim())
  }

  // Backdate to the month this school was assigned in Used Schools.
  // Use the matched school's canonical Arabic name when available so the
  // fuzzy matcher hits assignments written with slight spelling variants.
  const assignment = findUsedSchoolsAssignment(
    schoolHit?.name_ar || schoolNameRaw || sheetName,
    ctx.usedSchools,
  )
  const visitDate = assignment ? `${assignment.month}-15T12:00:00.000Z` : new Date().toISOString()
  const assignedAgent = assignment && assignment.agents.length > 0
    ? matchAgent(assignment.agents[0], ctx.agentsByName)
    : null

  // Bound the read range. Stop after 50 consecutive fully-blank rows.
  const range = XLSX.utils.decode_range(ws["!ref"])
  const maxRow = Math.min(range.e.r, 5000)
  let consecutiveBlank = 0

  const out = []
  for (let i = 5; i <= maxRow; i++) {
    const r = [
      cellAt(ws, i, 0), cellAt(ws, i, 1), cellAt(ws, i, 2),
      cellAt(ws, i, 3), cellAt(ws, i, 4), cellAt(ws, i, 5),
      cellAt(ws, i, 6), cellAt(ws, i, 7),
    ]
    const name = r[0]
    const studentPhone = r[1]
    if (!name && !studentPhone) {
      consecutiveBlank++
      if (consecutiveBlank >= 50) break
      continue
    }
    consecutiveBlank = 0

    const arabicName = splitArabicName(name)
    const normPhone = normalizePhone(studentPhone)
    if (!normPhone) {
      ctx.warnings.push(`[visit:${sheetName} row ${i + 1}] invalid phone "${studentPhone}" — skipping`)
      continue
    }

    const gpaRaw = numOrNull(r[5])
    const major = r[3]
    const preferred = r[4]
    const bank = r[6]
    const note = r[7]

    const scoring = calculateLeadQuality({
      gpa: gpaRaw,
      placement_test_raw: null,
      gender: null, // unknown from visit sheet
      governorate: schoolHit?.governorate ?? null,
    })

    const noteBits = [`source_sheet:visit:${sheetName.trim()}`]
    if (bank) noteBits.push(`bank:${bank}`)
    if (note) noteBits.push(String(note))
    if (preferred) noteBits.push(`preferred_major:${preferred}`)

    const createdAt = visitDate

    out.push({
      first_name: transliteratePlaceholder(arabicName.first_name_ar),
      last_name: transliteratePlaceholder(arabicName.last_name_ar),
      first_name_ar: arabicName.first_name_ar,
      last_name_ar: arabicName.last_name_ar,
      full_name_ar: arabicName.full_name_ar,
      phone: normPhone,
      phone_secondary: normalizePhone(r[2]),
      nationality: "Kuwaiti",
      is_kuwaiti: true,
      school_id: schoolHit?.id ?? null,
      school_name_custom: schoolHit ? null : (schoolNameRaw ? String(schoolNameRaw).trim() : sheetName.trim()),
      governorate: schoolHit?.governorate ?? null,
      grade_level: "12th",
      academic_track: mapTrack(major),
      gpa_grade_12_expected: gpaRaw,
      intended_major: mapMajor(preferred),
      funding_type: "self_funded",
      has_weyay_account: false,
      has_bank_account: !!bank,
      source_category: "outreach",
      source: "school_visit",
      semester_id: semesterFor(createdAt, ctx.semesters)?.id ?? null,
      pipeline_stage: "visit",
      contact_status: "interested",
      created_at: createdAt,
      assigned_to: assignedAgent?.id ?? null,
      gpa_auto_score: scoring.gpa_auto_score,
      governorate_score: scoring.governorate_score,
      final_weighted_score: scoring.final_weighted_score,
      quality_tier: scoring.quality_tier,
      notes: noteBits.join(" | "),
    })
  }
  return out
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log(`Reading ${QUALITY_PATH}...`)
  const qualityBuf = await readFile(QUALITY_PATH)
  const qualityWb = XLSX.read(qualityBuf, { cellDates: true })

  console.log(`Reading ${VISIT_PATH}...`)
  const visitBuf = await readFile(VISIT_PATH)
  const visitWb = XLSX.read(visitBuf, { cellDates: true })

  const schoolIdx = await loadSchools()
  const semesters = await loadSemesters()
  const agentsByName = await loadAgents()
  console.log(`Semesters resolved: ${semesters.map((s) => s.name).join(", ")}`)

  const usedSchools = parseUsedSchoolsAssignments(visitWb)
  console.log(`Used Schools assignments parsed: ${usedSchools.length}`)

  const ctx = {
    schoolIdx,
    semesters,
    agentsByName,
    usedSchools,
    unmatchedSchools: new Set(),
    unmatchedAgents: new Set(),
    warnings: [],
  }

  // ---- Quality Scale applicants ----
  const applicants = []
  for (const sheet of QUALITY_SHEETS) {
    const rows = parseQualitySheet(qualityWb, sheet, ctx)
    console.log(`  ${sheet}: ${rows.length} parsed`)
    applicants.push(...rows)
  }

  // De-dupe applicants in place. Use sets (membership only, no row keeping).
  const seenCivil = new Set()
  const seenPhone = new Set()
  const dedupedApplicants = []
  for (const a of applicants) {
    const phoneKey = a.phone
    const civilKey = a.civil_id || null
    if (civilKey && seenCivil.has(civilKey)) continue
    if (!civilKey && seenPhone.has(phoneKey)) continue
    if (civilKey) seenCivil.add(civilKey)
    seenPhone.add(phoneKey)
    dedupedApplicants.push(a)
  }

  // ---- Summary counters (incremental — no need to hold all rows) ----
  const summary = {
    applicants_parsed: applicants.length,
    applicants_kept: dedupedApplicants.length,
    applicants_dropped_duplicates: applicants.length - dedupedApplicants.length,
    visit_leads_parsed: 0,
    visit_leads_kept: 0,
    visit_leads_dropped_duplicates: 0,
    unmatched_schools: 0,
    unmatched_agents: 0,
    warnings: 0,
    by_tier: {},
    by_source: {},
    by_pipeline_stage: {},
    by_month: {},
  }
  function tallyRow(row) {
    summary.by_tier[row.quality_tier || "(none)"] = (summary.by_tier[row.quality_tier || "(none)"] || 0) + 1
    summary.by_source[row.source] = (summary.by_source[row.source] || 0) + 1
    summary.by_pipeline_stage[row.pipeline_stage] = (summary.by_pipeline_stage[row.pipeline_stage] || 0) + 1
    const month = row.created_at ? row.created_at.slice(0, 7) : "(unknown)"
    summary.by_month[month] = (summary.by_month[month] || 0) + 1
  }
  for (const a of dedupedApplicants) tallyRow(a)

  // ---- Visit-sheet leads: stream-parse + stream-write to free memory ----
  let visitFile = null
  let visitFirst = true
  if (!DRY_RUN) {
    visitFile = await open(path.join(OUT_DIR, "visit-leads.json"), "w")
    await visitFile.write('{\n  "leads": [\n')
  }

  for (const sheet of visitWb.SheetNames) {
    if (VISIT_SKIP_SHEETS.has(sheet)) continue
    const rows = parseVisitSheet(visitWb, sheet, ctx)
    if (!rows.length) continue
    summary.visit_leads_parsed += rows.length
    let kept = 0
    for (const v of rows) {
      if (v.civil_id && seenCivil.has(v.civil_id)) { summary.visit_leads_dropped_duplicates++; continue }
      if (seenPhone.has(v.phone)) { summary.visit_leads_dropped_duplicates++; continue }
      seenPhone.add(v.phone)
      if (v.civil_id) seenCivil.add(v.civil_id)
      kept++
      summary.visit_leads_kept++
      tallyRow(v)
      if (visitFile) {
        const prefix = visitFirst ? "    " : ",\n    "
        visitFirst = false
        await visitFile.write(prefix + JSON.stringify(v))
      }
    }
    console.log(`  visit:${sheet.trim()}: ${rows.length} parsed, ${kept} kept`)
    // Free the rows array
    rows.length = 0
  }

  if (visitFile) {
    await visitFile.write("\n  ]\n}\n")
    await visitFile.close()
  }

  summary.unmatched_schools = ctx.unmatchedSchools.size
  summary.unmatched_agents = ctx.unmatchedAgents.size
  summary.warnings = ctx.warnings.length

  console.log("\n=== Summary ===")
  console.log(JSON.stringify(summary, null, 2))

  if (!DRY_RUN) {
    await writeFile(
      path.join(OUT_DIR, "applicants.json"),
      JSON.stringify({ leads: dedupedApplicants }, null, 2),
    )
    await writeFile(
      path.join(OUT_DIR, "summary.json"),
      JSON.stringify(summary, null, 2),
    )
    await writeFile(
      path.join(OUT_DIR, "unmatched-schools.txt"),
      [...ctx.unmatchedSchools].sort().join("\n"),
    )
    await writeFile(
      path.join(OUT_DIR, "unmatched-agents.txt"),
      [...ctx.unmatchedAgents].sort().join("\n"),
    )
    await writeFile(
      path.join(OUT_DIR, "warnings.txt"),
      ctx.warnings.join("\n"),
    )
    console.log(`\nWrote outputs to ${OUT_DIR}`)
  } else {
    console.log("\n(--dry-run: outputs not written)")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
