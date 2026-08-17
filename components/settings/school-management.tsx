"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  School as SchoolIcon,
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
} from "lucide-react";
import {
  GOVERNORATES,
  SCHOOL_GENDERS,
  SCHOOL_TYPES,
  type Governorate,
  type SchoolGender,
  type SchoolType,
} from "@/types";
import {
  compareSchoolsBySearch,
  schoolMatchesSearch,
} from "@/lib/schools/search";
import {
  useSchools,
  useSchoolStats,
  useCreateSchool,
  useUpdateSchool,
  useToggleSchoolActive,
  type School,
} from "@/lib/hooks/use-schools";

export function SchoolManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [governorateFilter, setGovernorateFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch schools and stats using hooks
  const { schools, loading } = useSchools();
  const { stats } = useSchoolStats();
  const createSchoolMutation = useCreateSchool();
  const updateSchoolMutation = useUpdateSchool();
  const toggleActiveMutation = useToggleSchoolActive();

  // New school form
  const [newSchool, setNewSchool] = useState({
    nameEn: "",
    nameAr: "",
    governorate: "" as Governorate | "",
    gender: "" as SchoolGender | "",
    schoolType: "" as SchoolType | "",
    location: "",
    principalName: "",
    phone: "",
  });

  // Edit school form
  const [editForm, setEditForm] = useState({
    nameEn: "",
    nameAr: "",
    governorate: "" as Governorate | "",
    gender: "" as SchoolGender | "",
    schoolType: "" as SchoolType | "",
    location: "",
    principalName: "",
    phone: "",
  });

  // Track if user manually edited English name
  const [manualEnAdd, setManualEnAdd] = useState(false);
  const [manualEnEdit, setManualEnEdit] = useState(false);

  // Arabic → English transliteration for common school name words
  const arabicToEnglish: Record<string, string> = {
    مدرسة: "School",
    ثانوية: "Secondary School",
    متوسطة: "Intermediate School",
    ابتدائية: "Primary School",
    روضة: "Kindergarten",
    حضانة: "Nursery",
    بنين: "Boys",
    بنات: "Girls",
    الثانوية: "Secondary",
    المتوسطة: "Intermediate",
    الابتدائية: "Primary",
    الصباح: "Al-Sabah",
    الجابر: "Al-Jaber",
    المبارك: "Al-Mubarak",
    الأحمد: "Al-Ahmad",
    السالم: "Al-Salem",
    العبدالله: "Al-Abdullah",
    الخليفة: "Al-Khalifa",
    المنصور: "Al-Mansour",
    الفارسي: "Al-Farsi",
    الشملان: "Al-Shamlan",
    الغانم: "Al-Ghanim",
    الحمد: "Al-Hamad",
    الرشيد: "Al-Rasheed",
    العثمان: "Al-Othman",
    البدر: "Al-Badr",
    الفهد: "Al-Fahad",
    النصار: "Al-Nassar",
    الخالد: "Al-Khaled",
    العلي: "Al-Ali",
    الحسين: "Al-Hussain",
    الموسى: "Al-Mousa",
    العيسى: "Al-Eissa",
    السعد: "Al-Saad",
    الزهراء: "Al-Zahraa",
    الأمين: "Al-Ameen",
    النور: "Al-Nour",
    الإيمان: "Al-Iman",
    التقوى: "Al-Taqwa",
    السلام: "Al-Salam",
    الهداية: "Al-Hedaya",
    الفلاح: "Al-Falah",
    النجاح: "Al-Najah",
    العروبة: "Al-Orouba",
    الوطنية: "National",
    الكويت: "Kuwait",
    الكويتية: "Kuwaiti",
    عبدالله: "Abdullah",
    عبدالعزيز: "Abdulaziz",
    عبدالرحمن: "Abdulrahman",
    عبداللطيف: "Abdullatif",
    محمد: "Mohammed",
    أحمد: "Ahmad",
    خالد: "Khaled",
    فاطمة: "Fatima",
    عائشة: "Aisha",
    مريم: "Mariam",
    خديجة: "Khadija",
    عمر: "Omar",
    علي: "Ali",
    حسن: "Hassan",
    حسين: "Hussain",
    إبراهيم: "Ibrahim",
    يوسف: "Youssef",
    سعد: "Saad",
    فهد: "Fahad",
    ناصر: "Nasser",
    جاسم: "Jassem",
    سالم: "Salem",
    مبارك: "Mubarak",
    صباح: "Sabah",
    جابر: "Jaber",
    بدر: "Badr",
    طارق: "Tariq",
    منصور: "Mansour",
    بن: "Bin",
    ابن: "Ibn",
    آل: "Al",
    الشيخ: "Sheikh",
    الأمير: "Prince",
    الأميرة: "Princess",
  };

  const transliterateArabic = (arabic: string): string => {
    if (!arabic.trim()) return "";
    let result = arabic.trim();
    // Sort by length (longest first) to match longer phrases before shorter ones
    const sorted = Object.entries(arabicToEnglish).sort(
      (a, b) => b[0].length - a[0].length,
    );
    for (const [ar, en] of sorted) {
      result = result.replaceAll(ar, en);
    }
    // Clean up: remove remaining Arabic chars, normalize spaces
    result = result
      .replace(
        /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();
    return result;
  };

  const handleAddSchool = async () => {
    if (!newSchool.nameAr.trim()) {
      setError("School name (Arabic) is required");
      return;
    }

    if (!newSchool.gender) {
      setError("Gender is required");
      return;
    }

    if (!newSchool.schoolType) {
      setError("School type is required — it sets the education type on leads");
      return;
    }

    setError("");

    try {
      await createSchoolMutation.mutateAsync({
        nameAr: newSchool.nameAr.trim(),
        nameEn: newSchool.nameEn.trim() || newSchool.nameAr.trim(),
        governorate: newSchool.governorate || undefined,
        gender: newSchool.gender,
        schoolType: newSchool.schoolType,
        location: newSchool.location.trim() || undefined,
        principalName: newSchool.principalName.trim() || undefined,
        phone: newSchool.phone.trim() || undefined,
        active: true,
      });

      setNewSchool({
        nameEn: "",
        nameAr: "",
        governorate: "",
        gender: "",
        schoolType: "",
        location: "",
        principalName: "",
        phone: "",
      });
      setManualEnAdd(false);
      setShowAddModal(false);
      setSuccessMessage("School added successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add school");
    }
  };

  const handleToggleActive = async (school: School) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: school.id,
        active: !school.active,
      });
    } catch (err) {
      console.error("Failed to toggle school active status:", err);
    }
  };

  const openEditModal = (school: School) => {
    setEditingSchool(school);
    setEditForm({
      nameEn: school.nameEn || "",
      nameAr: school.nameAr || "",
      governorate: (school.governorate || "") as Governorate | "",
      gender: school.gender,
      schoolType: school.schoolType,
      location: school.location || "",
      principalName: school.principalName || "",
      phone: school.phone || "",
    });
    setError("");
    // If school already has a custom English name, treat as manually set
    setManualEnEdit(!!school.nameEn);
    setShowEditModal(true);
  };

  const handleEditSchool = async () => {
    if (!editingSchool) return;

    if (!editForm.nameAr.trim()) {
      setError("School name (Arabic) is required");
      return;
    }

    if (!editForm.gender) {
      setError("Gender is required");
      return;
    }

    if (!editForm.schoolType) {
      setError("School type is required — it sets the education type on leads");
      return;
    }

    setError("");

    try {
      await updateSchoolMutation.mutateAsync({
        id: editingSchool.id,
        nameAr: editForm.nameAr.trim(),
        nameEn: editForm.nameEn.trim() || editForm.nameAr.trim(),
        governorate: editForm.governorate || null,
        gender: editForm.gender,
        schoolType: editForm.schoolType,
        location: editForm.location.trim() || null,
        principalName: editForm.principalName.trim() || null,
        phone: editForm.phone.trim() || null,
      });

      setShowEditModal(false);
      setEditingSchool(null);
      setSuccessMessage("School updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update school");
    }
  };

  // Convert API schools to match the search function's expected format
  const schoolsForSearch = schools.map((s) => ({
    id: s.id,
    name_ar: s.nameAr,
    name_en: s.nameEn,
    governorate: s.governorate,
    gender: s.gender,
    school_type: s.schoolType,
    location: s.location,
    principal_name: s.principalName,
    phone_number: s.phone,
    is_active: s.active,
  }));

  const filteredSchools = schoolsForSearch
    .filter((s) => {
      const matchesSearch = schoolMatchesSearch(s, searchQuery);
      const matchesGovernorate =
        governorateFilter === "all" || s.governorate === governorateFilter;
      const matchesGender = genderFilter === "all" || s.gender === genderFilter;
      const matchesType = typeFilter === "all" || s.school_type === typeFilter;
      return (
        matchesSearch && matchesGovernorate && matchesGender && matchesType
      );
    })
    .sort(compareSchoolsBySearch(searchQuery));

  // Convert back to API format for display
  const displaySchools: School[] = filteredSchools.map((s) => ({
    id: s.id,
    nameAr: s.name_ar,
    nameEn: s.name_en,
    governorate: s.governorate,
    gender: s.gender,
    schoolType: s.school_type,
    location: s.location,
    principalName: s.principal_name,
    phone: s.phone_number,
    active: s.is_active,
    createdAt: "",
    updatedAt: "",
  }));

  const totalCount = schools.length;
  const activeCount =
    stats?.activeSchools || schools.filter((s) => s.active).length;
  const maleCount =
    stats?.maleSchools || schools.filter((s) => s.gender === "male").length;
  const femaleCount =
    stats?.femaleSchools || schools.filter((s) => s.gender === "female").length;

  const saving =
    createSchoolMutation.isPending || updateSchoolMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SchoolIcon className="w-5 h-5 text-primary" />
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
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {totalCount}
              </p>
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
            <Select
              value={governorateFilter}
              onValueChange={setGovernorateFilter}
            >
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
          ) : displaySchools.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">
                {searchQuery ||
                governorateFilter !== "all" ||
                genderFilter !== "all" ||
                typeFilter !== "all"
                  ? "No schools match your search"
                  : "No schools added yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {displaySchools.map((school) => (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    school.active
                      ? "border-[var(--border)] bg-[var(--bg-sunken)]"
                      : "border-[var(--border)] bg-[var(--bg-sunken)] opacity-60",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        school.active
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "bg-[var(--bg-hover)] text-[var(--text-muted)]",
                      )}
                    >
                      <SchoolIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {school.nameAr}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {school.nameEn && (
                          <span className="text-xs text-[var(--text-muted)] truncate">
                            {school.nameEn}
                          </span>
                        )}
                        {school.gender && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 shrink-0",
                              school.gender === "male"
                                ? "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                                : school.gender === "female"
                                  ? "border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30"
                                  : "border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30",
                            )}
                          >
                            {SCHOOL_GENDERS.find(
                              (g) => g.value === school.gender,
                            )?.labelAr || school.gender}
                          </Badge>
                        )}
                        {school.schoolType && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 shrink-0 font-semibold",
                              school.schoolType === "gov"
                                ? "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                                : school.schoolType === "us"
                                  ? "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                                  : school.schoolType === "uk"
                                    ? "border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                                    : school.schoolType === "ksa"
                                      ? "border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30"
                                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30",
                            )}
                          >
                            {SCHOOL_TYPES.find(
                              (t) => t.value === school.schoolType,
                            )?.label || school.schoolType}
                          </Badge>
                        )}
                        {school.governorate && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 shrink-0"
                          >
                            {GOVERNORATES.find(
                              (g) => g.value === school.governorate,
                            )?.labelAr || school.governorate}
                          </Badge>
                        )}
                      </div>
                      {(school.location ||
                        school.principalName ||
                        school.phone) && (
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
                          {school.principalName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {school.principalName}
                            </span>
                          )}
                          {school.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span dir="ltr">{school.phone}</span>
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
                        e.stopPropagation();
                        openEditModal(school);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Switch
                      checked={school.active}
                      onCheckedChange={() => handleToggleActive(school)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)] mt-4">
            Showing {displaySchools.length} of {totalCount} schools
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
                  <SchoolIcon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--bg-surface)] flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                  New School
                </h2>
                <p className="text-sm text-[var(--text-muted)] font-normal mt-0.5">
                  Register a school in the system
                </p>
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
                      <p className="font-medium text-[var(--error)]">
                        Validation Error
                      </p>
                      <p className="text-[var(--error)]/80 mt-0.5">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Arabic Name Field */}
            <div className="space-y-2.5">
              <Label
                htmlFor="name_ar"
                required
                className="text-[var(--text-primary)]"
              >
                School Name (Arabic)
              </Label>
              <Input
                id="name_ar"
                value={newSchool.nameAr}
                onChange={(e) => {
                  const arValue = e.target.value;
                  setError("");
                  if (!manualEnAdd) {
                    const translated = transliterateArabic(arValue);
                    setNewSchool((prev) => ({
                      ...prev,
                      nameAr: arValue,
                      nameEn: translated,
                    }));
                  } else {
                    setNewSchool((prev) => ({ ...prev, nameAr: arValue }));
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
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">
                  Auto-filled
                </span>
              </div>
              <Input
                id="name_en"
                value={newSchool.nameEn}
                onChange={(e) => {
                  setManualEnAdd(true);
                  setNewSchool((prev) => ({ ...prev, nameEn: e.target.value }));
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
                onValueChange={(value) =>
                  setNewSchool((prev) => ({
                    ...prev,
                    governorate: value === "none" ? "" : (value as Governorate),
                  }))
                }
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
              <Label required className="text-[var(--text-primary)]">
                Gender
              </Label>
              <Select
                value={newSchool.gender || "none"}
                onValueChange={(value) => {
                  setNewSchool((prev) => ({
                    ...prev,
                    gender: value === "none" ? "" : (value as SchoolGender),
                  }));
                  setError("");
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select gender
                  </SelectItem>
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
              <Label required className="text-[var(--text-primary)]">
                School Type
              </Label>
              <Select
                value={newSchool.schoolType || "none"}
                onValueChange={(value) => {
                  setNewSchool((prev) => ({
                    ...prev,
                    schoolType: value === "none" ? "" : (value as SchoolType),
                  }));
                  setError("");
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select type
                  </SelectItem>
                  {SCHOOL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label} - {t.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-50" />
                Sets the education type automatically on every lead from this
                school
              </p>
            </div>

            {/* Location Field */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="location"
                  className="text-[var(--text-primary)]"
                >
                  Location
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">
                  Optional
                </span>
              </div>
              <Input
                id="location"
                value={newSchool.location}
                onChange={(e) =>
                  setNewSchool((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="e.g. Block 3, Salmiya"
                variant="filled"
              />
            </div>

            {/* Principal/Manager Field */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="principal_name"
                  className="text-[var(--text-primary)]"
                >
                  Principal / Manager
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">
                  Optional
                </span>
              </div>
              <Input
                id="principal_name"
                value={newSchool.principalName}
                onChange={(e) =>
                  setNewSchool((prev) => ({
                    ...prev,
                    principalName: e.target.value,
                  }))
                }
                placeholder="e.g. Ahmad Al-Sabah"
                variant="filled"
              />
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="phone_number"
                  className="text-[var(--text-primary)]"
                >
                  Phone Number
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">
                  Optional
                </span>
              </div>
              <Input
                id="phone_number"
                value={newSchool.phone}
                onChange={(e) =>
                  setNewSchool((prev) => ({ ...prev, phone: e.target.value }))
                }
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
                setShowAddModal(false);
                setNewSchool({
                  nameEn: "",
                  nameAr: "",
                  governorate: "",
                  gender: "",
                  schoolType: "",
                  location: "",
                  principalName: "",
                  phone: "",
                });
                setManualEnAdd(false);
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSchool}
              disabled={
                saving ||
                !newSchool.nameAr.trim() ||
                !newSchool.gender ||
                !newSchool.schoolType
              }
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
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) {
            setEditingSchool(null);
            setError("");
          }
        }}
      >
        <DialogContent className="max-w-[480px] p-0 overflow-hidden">
          <DialogHeader className="pt-7 pb-5 px-7 border-b-0">
            <DialogTitle className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                  <Pencil className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                  Edit School
                </h2>
                <p className="text-sm text-[var(--text-muted)] font-normal mt-0.5">
                  Update school information
                </p>
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
                      <p className="font-medium text-[var(--error)]">
                        Validation Error
                      </p>
                      <p className="text-[var(--error)]/80 mt-0.5">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Arabic Name */}
            <div className="space-y-2.5">
              <Label
                htmlFor="edit_name_ar"
                required
                className="text-[var(--text-primary)]"
              >
                School Name (Arabic)
              </Label>
              <Input
                id="edit_name_ar"
                value={editForm.nameAr}
                onChange={(e) => {
                  const arValue = e.target.value;
                  setError("");
                  if (!manualEnEdit) {
                    const translated = transliterateArabic(arValue);
                    setEditForm((prev) => ({
                      ...prev,
                      nameAr: arValue,
                      nameEn: translated,
                    }));
                  } else {
                    setEditForm((prev) => ({ ...prev, nameAr: arValue }));
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
                <Label
                  htmlFor="edit_name_en"
                  className="text-[var(--text-primary)]"
                >
                  School Name (English)
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">
                  Auto-filled
                </span>
              </div>
              <Input
                id="edit_name_en"
                value={editForm.nameEn}
                onChange={(e) => {
                  setManualEnEdit(true);
                  setEditForm((prev) => ({ ...prev, nameEn: e.target.value }));
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
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    governorate: value === "none" ? "" : (value as Governorate),
                  }))
                }
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
              <Label required className="text-[var(--text-primary)]">
                Gender
              </Label>
              <Select
                value={editForm.gender || "none"}
                onValueChange={(value) => {
                  setEditForm((prev) => ({
                    ...prev,
                    gender: value === "none" ? "" : (value as SchoolGender),
                  }));
                  setError("");
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select gender
                  </SelectItem>
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
              <Label required className="text-[var(--text-primary)]">
                School Type
              </Label>
              <Select
                value={editForm.schoolType || "none"}
                onValueChange={(value) => {
                  setEditForm((prev) => ({
                    ...prev,
                    schoolType: value === "none" ? "" : (value as SchoolType),
                  }));
                  setError("");
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select type
                  </SelectItem>
                  {SCHOOL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label} - {t.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-50" />
                Sets the education type automatically on every lead from this
                school
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="edit_location"
                  className="text-[var(--text-primary)]"
                >
                  Location
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">
                  Optional
                </span>
              </div>
              <Input
                id="edit_location"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g. Block 3, Salmiya"
                variant="filled"
              />
            </div>

            {/* Principal */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="edit_principal_name"
                  className="text-[var(--text-primary)]"
                >
                  Principal / Manager
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">
                  Optional
                </span>
              </div>
              <Input
                id="edit_principal_name"
                value={editForm.principalName}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    principalName: e.target.value,
                  }))
                }
                placeholder="e.g. Ahmad Al-Sabah"
                variant="filled"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="edit_phone_number"
                  className="text-[var(--text-primary)]"
                >
                  Phone Number
                </Label>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">
                  Optional
                </span>
              </div>
              <Input
                id="edit_phone_number"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                }
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
                setShowEditModal(false);
                setEditingSchool(null);
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSchool}
              disabled={
                saving ||
                !editForm.nameAr.trim() ||
                !editForm.gender ||
                !editForm.schoolType
              }
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
  );
}
