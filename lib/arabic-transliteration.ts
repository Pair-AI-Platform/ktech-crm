/**
 * Lightweight English → Arabic transliteration for lead display names.
 *
 * The lead data is mostly romanized Gulf/Kuwaiti Arabic names, so a curated
 * dictionary of common given names and tribal surnames handles the large
 * majority. Anything not in the dictionary falls back to a phonetic mapping so
 * we always produce *some* Arabic rendering rather than a "missing" placeholder.
 *
 * This is a best-effort display aid — it is intentionally not used to overwrite
 * the stored Arabic name fields.
 */

// Common given names (lowercased, no diacritics). Covers the names actually
// present in the lead set plus frequent Gulf names.
const GIVEN_NAMES: Record<string, string> = {
  mohammed: "محمد", mohamed: "محمد", muhammad: "محمد", mohammad: "محمد",
  ahmed: "أحمد", ahmad: "أحمد",
  ali: "علي", omar: "عمر", omer: "عمر",
  abdullah: "عبدالله", abdallah: "عبدالله",
  abdulaziz: "عبدالعزيز", abdelaziz: "عبدالعزيز", abdul: "عبدال",
  abdulrahman: "عبدالرحمن", abdulrahim: "عبدالرحيم",
  khalid: "خالد", khaled: "خالد",
  fahad: "فهد", fahd: "فهد",
  faisal: "فيصل", faysal: "فيصل",
  nasser: "ناصر", nasir: "ناصر",
  yousef: "يوسف", yusuf: "يوسف", youssef: "يوسف",
  hassan: "حسن", hasan: "حسن", hussein: "حسين", hussain: "حسين", husain: "حسين",
  saleh: "صالح", salem: "سالم", salim: "سالم",
  saad: "سعد", saud: "سعود", sultan: "سلطان",
  bader: "بدر", badr: "بدر", talal: "طلال", waleed: "وليد", walid: "وليد",
  mishari: "مشاري", meshal: "مشعل", mishal: "مشعل",
  yaqoub: "يعقوب", yacoub: "يعقوب", ibrahim: "إبراهيم", ismail: "إسماعيل",
  jaber: "جابر", jarrah: "جراح", dhari: "ضاري", rakan: "راكان",
  turki: "تركي", majed: "ماجد", majid: "ماجد", iyad: "إياد", laith: "ليث",
  // Female
  noor: "نور", nour: "نور", noura: "نورة", nora: "نورة",
  sara: "سارة", sarah: "سارة", fatima: "فاطمة", fatema: "فاطمة", fatma: "فاطمة",
  mariam: "مريم", maryam: "مريم", maram: "مرام", dana: "دانة", danah: "دانة",
  reem: "ريم", lina: "لينا", amani: "أماني", abeer: "عبير", aseel: "أسيل",
  munira: "منيرة", munirah: "منيرة", hessa: "حصة", hissa: "حصة",
  shaikha: "شيخة", sheikha: "شيخة", latifa: "لطيفة", lamiss: "لميس", lamees: "لميس",
  mays: "ميس", maya: "مايا", aisha: "عائشة", ayesha: "عائشة",
  ghala: "غلا", jana: "جنى", lulu: "لولو", rana: "رنا", dalal: "دلال",
  hana: "هناء", huda: "هدى", amal: "أمل", asma: "أسماء",
}

// Tribal / family surnames (the part after "Al-"), lowercased without the
// article. Mapped to the Arabic form *including* the ال article.
const SURNAMES: Record<string, string> = {
  enezi: "العنزي", anezi: "العنزي", enazi: "العنزي",
  harbi: "الحربي", mutairi: "المطيري", motairi: "المطيري",
  bloushi: "البلوشي", baloushi: "البلوشي", baloochi: "البلوشي",
  hajri: "الهاجري", ajmi: "العجمي", otaibi: "العتيبي", utaibi: "العتيبي",
  dosari: "الدوسري", dossari: "الدوسري", rashidi: "الرشيدي",
  shammari: "الشمري", qahtani: "القحطاني", subaie: "السبيعي", subai: "السبيعي",
  azmi: "العازمي", azemi: "العازمي", fadhli: "الفضلي", fadli: "الفضلي",
  khalidi: "الخالدي", rasheedi: "الرشيدي", mtairi: "المطيري",
  sabah: "الصباح", sabeeh: "الصبيح", saleh: "الصالح", ali: "العلي",
  mohammed: "المحمد", kandari: "الكندري", failakawi: "الفيلكاوي",
   awadhi: "العوضي", refai: "الرفاعي", rifai: "الرفاعي", mansour: "المنصور",
  yousef: "اليوسف", ibrahim: "الإبراهيم", hamad: "الحمد", roumi: "الرومي",
}

// Phonetic fallback for tokens not in any dictionary. Order matters: longer
// digraphs first.
const DIGRAPHS: Array<[string, string]> = [
  ["sh", "ش"], ["kh", "خ"], ["th", "ث"], ["dh", "ذ"], ["gh", "غ"],
  ["ph", "ف"], ["ch", "تش"], ["ck", "ك"],
  ["oo", "و"], ["ou", "و"], ["ee", "ي"], ["ei", "ي"], ["ai", "اي"],
  ["aa", "ا"], ["ah", "ة"],
]

const SINGLES: Record<string, string> = {
  a: "ا", e: "", i: "ي", o: "و", u: "و",
  b: "ب", t: "ت", j: "ج", h: "ه", d: "د", r: "ر", z: "ز",
  s: "س", f: "ف", q: "ق", k: "ك", l: "ل", m: "م", n: "ن",
  w: "و", y: "ي", p: "ب", v: "ف", g: "ج", c: "ك", x: "كس",
}

function phonetic(token: string): string {
  const s = token.toLowerCase().replace(/[^a-z]/g, "")
  if (!s) return ""
  let out = ""
  let firstLetter = true
  for (let i = 0; i < s.length; ) {
    const pair = s.slice(i, i + 2)
    const digraph = DIGRAPHS.find(([d]) => d === pair)
    if (digraph) {
      out += digraph[1]
      i += 2
      firstLetter = false
      continue
    }
    const ch = s[i]
    let mapped = SINGLES[ch] ?? ""
    // A leading short vowel needs an alif so the word isn't vowel-initial.
    if (firstLetter && (ch === "e" || ch === "u" || ch === "o" || ch === "i")) {
      mapped = "ا"
    }
    out += mapped
    firstLetter = false
    i += 1
  }
  return out
}

function transliterateToken(rawToken: string): string {
  const token = rawToken.trim()
  if (!token) return ""
  const key = token.toLowerCase().replace(/[^a-z]/g, "")
  if (!key) return ""

  // Handle "Al-Xxx" / "Al Xxx" / "El-Xxx" surname forms.
  const articleMatch = token.match(/^(al|el)[\s-]+(.+)$/i)
  if (articleMatch) {
    const rest = articleMatch[2].toLowerCase().replace(/[^a-z]/g, "")
    if (SURNAMES[rest]) return SURNAMES[rest]
    return "ال" + phonetic(rest)
  }

  if (GIVEN_NAMES[key]) return GIVEN_NAMES[key]
  if (SURNAMES[key]) return SURNAMES[key]
  return phonetic(key)
}

/**
 * Transliterate a romanized English name (one or more tokens) to Arabic.
 * Returns "" when there is nothing usable to transliterate.
 */
export function transliterateNameToArabic(value: unknown): string {
  if (typeof value !== "string") return ""
  const cleaned = value.trim().replace(/\s+/g, " ")
  if (!cleaned) return ""
  // Keep "Al-Enezi" as a single token; split on spaces only.
  return cleaned
    .split(" ")
    .map(transliterateToken)
    .filter(Boolean)
    .join(" ")
    .trim()
}
