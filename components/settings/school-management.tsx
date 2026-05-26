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
  Phone,
  User,
  Pencil,
} from "lucide-react"
import { GOVERNORATES, SCHOOL_GENDERS, SCHOOL_TYPES, type SchoolEntity, type Governorate, type SchoolGender, type SchoolType } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { compareSchoolsBySearch, schoolMatchesSearch } from "@/lib/schools/search"

export function SchoolManagement() {
  const [schools, setSchools] = useState<SchoolEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [governorateFilter, setGovernorateFilter] = useState<string>("all")
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [editingSchool, setEditingSchool] = useState<SchoolEntity | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // New school form
  const [newSchool, setNewSchool] = useState({
    name_en: "",
    name_ar: "",
    governorate: "" as Governorate | "",
    gender: "" as SchoolGender | "",
    school_type: "" as SchoolType | "",
    location: "",
    principal_name: "",
    phone_number: "",
  })

  // Edit school form
  const [editForm, setEditForm] = useState({
    name_en: "",
    name_ar: "",
    governorate: "" as Governorate | "",
    gender: "" as SchoolGender | "",
    school_type: "" as SchoolType | "",
    location: "",
    principal_name: "",
    phone_number: "",
  })

  // Track if user manually edited English name
  const [manualEnAdd, setManualEnAdd] = useState(false)
  const [manualEnEdit, setManualEnEdit] = useState(false)

  const supabase = createClient()

  // Arabic → English transliteration for common school name words
  const arabicToEnglish: Record<string, string> = {
    "مدرسة": "School",
    "ثانوية": "Secondary School",
    "متوسطة": "Intermediate School",
    "ابتدائية": "Primary School",
    "روضة": "Kindergarten",
    "حضانة": "Nursery",
    "بنين": "Boys",
    "بنات": "Girls",
    "الثانوية": "Secondary",
    "المتوسطة": "Intermediate",
    "الابتدائية": "Primary",
    "الصباح": "Al-Sabah",
    "الجابر": "Al-Jaber",
    "المبارك": "Al-Mubarak",
    "الأحمد": "Al-Ahmad",
    "السالم": "Al-Salem",
    "العبدالله": "Al-Abdullah",
    "الخليفة": "Al-Khalifa",
    "المنصور": "Al-Mansour",
    "الفارسي": "Al-Farsi",
    "الشملان": "Al-Shamlan",
    "الغانم": "Al-Ghanim",
    "الحمد": "Al-Hamad",
    "الرشيد": "Al-Rasheed",
    "العثمان": "Al-Othman",
    "البدر": "Al-Badr",
    "الفهد": "Al-Fahad",
    "النصار": "Al-Nassar",
    "الخالد": "Al-Khaled",
    "العلي": "Al-Ali",
    "الحسين": "Al-Hussain",
    "الموسى": "Al-Mousa",
    "العيسى": "Al-Eissa",
    "السعد": "Al-Saad",
    "الزهراء": "Al-Zahraa",
    "الأمين": "Al-Ameen",
    "النور": "Al-Nour",
    "الإيمان": "Al-Iman",
    "التقوى": "Al-Taqwa",
    "السلام": "Al-Salam",
    "الهداية": "Al-Hedaya",
    "الفلاح": "Al-Falah",
    "النجاح": "Al-Najah",
    "العروبة": "Al-Orouba",
    "الوطنية": "National",
    "الكويت": "Kuwait",
    "الكويتية": "Kuwaiti",
    "عبدالله": "Abdullah",
    "عبدالعزيز": "Abdulaziz",
    "عبدالرحمن": "Abdulrahman",
    "عبداللطيف": "Abdullatif",
    "محمد": "Mohammed",
    "أحمد": "Ahmad",
    "خالد": "Khaled",
    "فاطمة": "Fatima",
    "عائشة": "Aisha",
    "مريم": "Mariam",
    "خديجة": "Khadija",
    "عمر": "Omar",
    "علي": "Ali",
    "حسن": "Hassan",
    "حسين": "Hussain",
    "إبراهيم": "Ibrahim",
    "يوسف": "Youssef",
    "سعد": "Saad",
    "فهد": "Fahad",
    "ناصر": "Nasser",
    "جاسم": "Jassem",
    "سالم": "Salem",
    "مبارك": "Mubarak",
    "صباح": "Sabah",
    "جابر": "Jaber",
    "بدر": "Badr",
    "طارق": "Tariq",
    "منصور": "Mansour",
    "بن": "Bin",
    "ابن": "Ibn",
    "آل": "Al",
    "الشيخ": "Sheikh",
    "الأمير": "Prince",
    "الأميرة": "Princess",
  }

  const transliterateArabic = (arabic: string): string => {
    if (!arabic.trim()) return ""
    let result = arabic.trim()
    // Sort by length (longest first) to match longer phrases before shorter ones
    const sorted = Object.entries(arabicToEnglish).sort((a, b) => b[0].length - a[0].length)
    for (const [ar, en] of sorted) {
      result = result.replaceAll(ar, en)
    }
    // Clean up: remove remaining Arabic chars, normalize spaces
    result = result.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, "").replace(/\s+/g, " ").trim()
    return result
  }

  useEffect(() => {
    fetchSchools()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (!newSchool.gender) {
      setError("Gender is required")
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
      if (newSchool.gender) {
        insertData.gender = newSchool.gender
      }
      if (newSchool.school_type) {
        insertData.school_type = newSchool.school_type
      }
      if (newSchool.location.trim()) {
        insertData.location = newSchool.location.trim()
      }
      if (newSchool.principal_name.trim()) {
        insertData.principal_name = newSchool.principal_name.trim()
      }
      if (newSchool.phone_number.trim()) {
        insertData.phone_number = newSchool.phone_number.trim()
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

      setNewSchool({ name_en: "", name_ar: "", governorate: "", gender: "", school_type: "", location: "", principal_name: "", phone_number: "" })
      setManualEnAdd(false)
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

  const openEditModal = (school: SchoolEntity) => {
    setEditingSchool(school)
    setEditForm({
      name_en: school.name_en || "",
      name_ar: school.name_ar || "",
      governorate: (school.governorate || "") as Governorate | "",
      gender: (school.gender || "") as SchoolGender | "",
      school_type: (school.school_type || "") as SchoolType | "",
      location: school.location || "",
      principal_name: school.principal_name || "",
      phone_number: school.phone_number || "",
    })
    setError("")
    // If school already has a custom English name, treat as manually set
    setManualEnEdit(!!school.name_en)
    setShowEditModal(true)
  }

  const handleEditSchool = async () => {
    if (!editingSchool) return

    if (!editForm.name_ar.trim()) {
      setError("School name (Arabic) is required")
      return
    }

    if (!editForm.gender) {
      setError("Gender is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const updateData: Record<string, string | null> = {
        name_en: editForm.name_en.trim() || editForm.name_ar.trim(),
        name_ar: editForm.name_ar.trim(),
        governorate: editForm.governorate || null,
        gender: editForm.gender || null,
        school_type: editForm.school_type || null,
        location: editForm.location.trim() || null,
        principal_name: editForm.principal_name.trim() || null,
        phone_number: editForm.phone_number.trim() || null,
      }

      const { data, error: updateError } = await supabase
        .from("schools")
        .update(updateData)
        .eq("id", editingSchool.id)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        return
      }

      if (data) {
        setSchools(prev =>
          prev.map(s => s.id === editingSchool.id ? data : s)
            .sort((a, b) => a.name_ar.localeCompare(b.name_ar))
        )
      }

      setShowEditModal(false)
      setEditingSchool(null)
      setSuccessMessage("School updated successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    } finally {
      setSaving(false)
    }
  }

  const filteredSchools = schools.filter(s => {
    const matchesSearch = schoolMatchesSearch(s, searchQuery)
    const matchesGovernorate =
      governorateFilter === "all" || s.governorate === governorateFilter
    const matchesGender =
      genderFilter === "all" || s.gender === genderFilter
    const matchesType =
      typeFilter === "all" || s.school_type === typeFilter
    return matchesSearch && matchesGovernorate && matchesGender && matchesType
  }).sort(compareSchoolsBySearch(searchQuery))

  const activeCount = schools.filter(s => s.is_active).length
  const totalCount = schools.length
  const maleCount = schools.filter(s => s.gender === 'male').length
  const femaleCount = schools.filter(s => s.gender === 'female').length

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
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Total Schools</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] text-center">
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Active</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-sunken)] border border-blue-200 dark:border-blue-800/50 text-center">
              <p className="text-2xl font-bold text-blue-600">{maleCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Male</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-sunken)] border border-pink-200 dark:border-pink-800/50 text-center">
              <p className="text-2xl font-bold text-pink-600">{femaleCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Female</p>
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
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                {SCHOOL_GENDERS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.labelAr} ({g.label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {SCHOOL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} ({t.labelAr})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {searchQuery || governorateFilter !== "all" || genderFilter !== "all" || typeFilter !== "all"
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
                      ? "border-[var(--border)] bg-[var(--bg-sunken)]"
                      : "border-[var(--border)] bg-[var(--bg-sunken)] opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      school.is_active
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
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
                        {school.gender && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 shrink-0",
                              school.gender === 'male'
                                ? "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                                : school.gender === 'female'
                                ? "border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30"
                                : "border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30"
                            )}
                          >
                            {SCHOOL_GENDERS.find(g => g.value === school.gender)?.labelAr || school.gender}
                          </Badge>
                        )}
                        {school.school_type && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 shrink-0 font-semibold",
                              school.school_type === 'gov'
                                ? "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                                : school.school_type === 'us'
                                ? "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                                : school.school_type === 'uk'
                                ? "border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                                : school.school_type === 'ksa'
                                ? "border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30"
                                : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30"
                            )}
                          >
                            {SCHOOL_TYPES.find(t => t.value === school.school_type)?.label || school.school_type}
                          </Badge>
                        )}
                        {school.governorate && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            {GOVERNORATES.find(g => g.value === school.governorate)?.labelAr || school.governorate}
                          </Badge>
                        )}
                      </div>
                      {(school.location || school.principal_name || school.phone_number) && (
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--text-muted)]">
                          {school.location && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MapPin className="w-3 h-3" />
                              {school.location}
                            </a>
                          )}
                          {school.principal_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {school.principal_name}
                            </span>
                          )}
                          {school.phone_number && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span dir="ltr">{school.phone_number}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--primary)]"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(school)
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Switch
                      checked={school.is_active}
                      onCheckedChange={() => handleToggleActive(school)}
                    />
                  </div>
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
          <DialogHeader className="pt-7 pb-5 px-7 border-b-0">
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

          <DialogBody className="px-7 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
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
                  const arValue = e.target.value
                  setError("")
                  if (!manualEnAdd) {
                    const translated = transliterateArabic(arValue)
                    setNewSchool(prev => ({ ...prev, name_ar: arValue, name_en: translated }))
                  } else {
                    setNewSchool(prev => ({ ...prev, name_ar: arValue }))
                  }
                }}
                placeholder="School name in Arabic..."
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
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">Auto-filled</span>
              </div>
              <Input
                id="name_en"
                value={newSchool.name_en}
                onChange={(e) => {
                  setManualEnAdd(true)
                  setNewSchool(prev => ({ ...prev, name_en: e.target.value }))
                }}
                placeholder="e.g. Al-Sabah Secondary School"
                variant="filled"
              />
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-50" />
                Auto-translated from Arabic name — edit to override
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

            {/* Gender Field */}
            <div className="space-y-2.5">
              <Label required className="text-[var(--text-primary)]">Gender</Label>
              <Select
                value={newSchool.gender || "none"}
                onValueChange={(value) => {
                  setNewSchool(prev => ({ ...prev, gender: value === "none" ? "" : value as SchoolGender }))
                  setError("")
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Select gender</SelectItem>
                  {SCHOOL_GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.labelAr} ({g.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* School Type Field */}
            <div className="space-y-2.5">
              <Label className="text-[var(--text-primary)]">School Type</Label>
              <Select
                value={newSchool.school_type || "none"}
                onValueChange={(value) => setNewSchool(prev => ({ ...prev, school_type: value === "none" ? "" : value as SchoolType }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No type</SelectItem>
                  {SCHOOL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label} - {t.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Field */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="location" className="text-[var(--text-primary)]">
                  Location
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">Optional</span>
              </div>
              <Input
                id="location"
                value={newSchool.location}
                onChange={(e) => setNewSchool(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Block 3, Salmiya"
                variant="filled"
              />
            </div>

            {/* Principal/Manager Field */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="principal_name" className="text-[var(--text-primary)]">
                  Principal / Manager
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">Optional</span>
              </div>
              <Input
                id="principal_name"
                value={newSchool.principal_name}
                onChange={(e) => setNewSchool(prev => ({ ...prev, principal_name: e.target.value }))}
                placeholder="e.g. Ahmad Al-Sabah"
                variant="filled"
              />
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="phone_number" className="text-[var(--text-primary)]">
                  Phone Number
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">Optional</span>
              </div>
              <Input
                id="phone_number"
                value={newSchool.phone_number}
                onChange={(e) => setNewSchool(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="e.g. +965 2222 3333"
                dir="ltr"
                variant="filled"
              />
            </div>
          </DialogBody>

          <DialogFooter className="px-7 py-5 bg-[var(--bg-sunken)]/50">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false)
                setNewSchool({ name_en: "", name_ar: "", governorate: "", gender: "", school_type: "", location: "", principal_name: "", phone_number: "" })
                setManualEnAdd(false)
                setError("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSchool}
              disabled={saving || !newSchool.name_ar.trim() || !newSchool.gender}
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

      {/* Edit School Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        setShowEditModal(open)
        if (!open) {
          setEditingSchool(null)
          setError("")
        }
      }}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden">
          <DialogHeader className="pt-7 pb-5 px-7 border-b-0">
            <DialogTitle className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                  <Pencil className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Edit School</h2>
                <p className="text-sm text-[var(--text-muted)] font-normal mt-0.5">Update school information</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="px-7 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
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

            {/* Arabic Name */}
            <div className="space-y-2.5">
              <Label htmlFor="edit_name_ar" required className="text-[var(--text-primary)]">
                School Name (Arabic)
              </Label>
              <Input
                id="edit_name_ar"
                value={editForm.name_ar}
                onChange={(e) => {
                  const arValue = e.target.value
                  setError("")
                  if (!manualEnEdit) {
                    const translated = transliterateArabic(arValue)
                    setEditForm(prev => ({ ...prev, name_ar: arValue, name_en: translated }))
                  } else {
                    setEditForm(prev => ({ ...prev, name_ar: arValue }))
                  }
                }}
                placeholder="School name in Arabic..."
                dir="rtl"
                variant="filled"
                className="h-12 text-base font-medium"
              />
            </div>

            {/* English Name */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="edit_name_en" className="text-[var(--text-primary)]">
                  School Name (English)
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">Auto-filled</span>
              </div>
              <Input
                id="edit_name_en"
                value={editForm.name_en}
                onChange={(e) => {
                  setManualEnEdit(true)
                  setEditForm(prev => ({ ...prev, name_en: e.target.value }))
                }}
                placeholder="e.g. Al-Sabah Secondary School"
                variant="filled"
              />
            </div>

            {/* Governorate */}
            <div className="space-y-2.5">
              <Label className="text-[var(--text-primary)]">Governorate</Label>
              <Select
                value={editForm.governorate || "none"}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, governorate: value === "none" ? "" : value as Governorate }))}
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

            {/* Gender */}
            <div className="space-y-2.5">
              <Label required className="text-[var(--text-primary)]">Gender</Label>
              <Select
                value={editForm.gender || "none"}
                onValueChange={(value) => {
                  setEditForm(prev => ({ ...prev, gender: value === "none" ? "" : value as SchoolGender }))
                  setError("")
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Select gender</SelectItem>
                  {SCHOOL_GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.labelAr} ({g.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* School Type */}
            <div className="space-y-2.5">
              <Label className="text-[var(--text-primary)]">School Type</Label>
              <Select
                value={editForm.school_type || "none"}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, school_type: value === "none" ? "" : value as SchoolType }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No type</SelectItem>
                  {SCHOOL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label} - {t.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="edit_location" className="text-[var(--text-primary)]">Location</Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">Optional</span>
              </div>
              <Input
                id="edit_location"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Block 3, Salmiya"
                variant="filled"
              />
            </div>

            {/* Principal */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="edit_principal_name" className="text-[var(--text-primary)]">Principal / Manager</Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">Optional</span>
              </div>
              <Input
                id="edit_principal_name"
                value={editForm.principal_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, principal_name: e.target.value }))}
                placeholder="e.g. Ahmad Al-Sabah"
                variant="filled"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="edit_phone_number" className="text-[var(--text-primary)]">Phone Number</Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">Optional</span>
              </div>
              <Input
                id="edit_phone_number"
                value={editForm.phone_number}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="e.g. +965 2222 3333"
                dir="ltr"
                variant="filled"
              />
            </div>
          </DialogBody>

          <DialogFooter className="px-7 py-5 bg-[var(--bg-sunken)]/50">
            <Button
              variant="ghost"
              onClick={() => {
                setShowEditModal(false)
                setEditingSchool(null)
                setError("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSchool}
              disabled={saving || !editForm.name_ar.trim() || !editForm.gender}
              variant="gradient"
              className="min-w-[140px] shadow-md shadow-[var(--primary)]/15"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
