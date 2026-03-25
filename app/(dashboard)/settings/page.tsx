"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { TeamManagement } from "@/components/settings/team-management"
import { LeadAssignmentRules } from "@/components/settings/lead-assignment-rules"
import { StageSettings } from "@/components/settings/stage-settings"
import { TargetSettings } from "@/components/settings/targets"
import { SchoolManagement } from "@/components/settings/school-management"
import { DocumentConfigManagement } from "@/components/settings/document-config-management"
import { CycleManagement } from "@/components/settings/cycle-management"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Bell,
  Shield,
  Palette,
  Upload,
  Users,
  Settings,
  Check,
  Moon,
  Sun,
  Monitor,
  Key,
  Mail,
  Phone,
  Camera,
  Lock,
  ChevronRight,
  Clock,
  ExternalLink,
  GitBranch,
  Target,
  School,
  FileText,
  MessageSquare,
  Smartphone,
  CalendarClock,
  AlertTriangle,
  BellRing,
  Volume2,
  VolumeX
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { usePreferences } from "@/lib/hooks/use-preferences"
import { createClient } from "@/lib/supabase/client"

type SettingsTab = "profile" | "notifications" | "appearance" | "security" | "team" | "pipeline" | "targets" | "schools" | "documents" | "enrollment"

const TABS: { id: SettingsTab; label: string; icon: typeof User; adminOnly?: boolean; roles?: ("admin" | "agent")[] }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell, adminOnly: true },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
  { id: "pipeline", label: "Stages", icon: GitBranch, adminOnly: true },
  { id: "targets", label: "Targets", icon: Target, adminOnly: true },
  { id: "enrollment", label: "Enrollment Cycles", icon: CalendarClock, adminOnly: true },
  { id: "schools", label: "Schools", icon: School, adminOnly: true },
  { id: "documents", label: "Documents", icon: FileText, adminOnly: true },
  { id: "team", label: "Team", icon: Users, adminOnly: true },
]

export default function SettingsPage() {
  const { profile, isAdmin } = useUser()
  const { preferences, loading: prefsLoading, updatePreferences, saving: prefsSaving } = usePreferences()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get("tab") as SettingsTab) || "profile"
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Profile state
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  // Notification state (synced from backend preferences)
  const [notificationsSaved, setNotificationsSaved] = useState(false)

  // Appearance state
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system")

  // Sync theme with localStorage and DOM
  useEffect(() => {
    const stored = localStorage.getItem("ktech-theme") as "light" | "dark" | "system" | null
    if (stored) {
      setThemeState(stored)
    }
  }, [])

  const handleSaveNotifications = async () => {
    try {
      await updatePreferences({
        email_notifications: preferences.email_notifications,
        sms_notifications: preferences.sms_notifications,
        push_notifications: preferences.push_notifications,
        appointment_reminders: preferences.appointment_reminders,
        lead_updates: preferences.lead_updates,
        system_alerts: preferences.system_alerts,
      })
      setNotificationsSaved(true)
      setTimeout(() => setNotificationsSaved(false), 2000)
    } catch (e) {
      console.error("Failed to save notification preferences:", e)
    }
  }

  const setTheme = (newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme)
    localStorage.setItem("ktech-theme", newTheme)

    const getResolvedTheme = (): "light" | "dark" => {
      if (newTheme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      }
      return newTheme
    }

    const resolved = getResolvedTheme()
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(resolved)
    document.documentElement.style.colorScheme = resolved

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { theme: newTheme, resolved } }))
  }

  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "")
      setPhone(profile.phone || "")
    }
  }, [profile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("File too large. Max 2MB.")
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to upload photo")
        return
      }

      // Reload to reflect new avatar everywhere
      window.location.reload()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        alert("Upload timed out. Please try again.")
      } else {
        alert("Failed to upload photo")
      }
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ""
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq("id", profile.id)

      if (!error) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const userRole = profile?.role || "agent"
  const visibleTabs = TABS.filter(tab => {
    if (tab.adminOnly && !isAdmin) return false
    if (tab.roles && !tab.roles.includes(userRole as "admin" | "agent")) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="px-3 py-4 sm:p-6 page-enter">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <Card className="sticky top-6">
                <CardContent className="p-2">
                  <nav className="space-y-1" role="tablist">
                    {visibleTabs.map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <motion.button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          whileHover={{ x: 4 }}
                          role="tab"
                          aria-selected={activeTab === tab.id}
                          aria-controls={`panel-${tab.id}`}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                            isActive
                              ? "bg-[var(--primary)] text-white"
                              : "hover:bg-[var(--bg-sunken)] text-[var(--text-secondary)]"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{tab.label}</span>
                          {isActive && (
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          )}
                        </motion.button>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>
            </motion.div>

            {/* Content Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3"
              role="tabpanel"
              id={`panel-${activeTab}`}
            >
              <AnimatePresence mode="wait">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Avatar Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="w-5 h-5 text-[var(--primary)]" />
                          Profile Photo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-6">
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                          <div
                            className="relative group cursor-pointer"
                            onClick={() => avatarInputRef.current?.click()}
                          >
                            <Avatar className="w-24 h-24">
                              <AvatarImage src={profile?.avatar_url} />
                              <AvatarFallback className="text-3xl bg-[#2D347D] text-white">
                                {profile?.full_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={uploadingAvatar}
                              onClick={() => avatarInputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                            </Button>
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                              JPG, PNG or GIF. Max 2MB.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Personal Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5 text-[var(--primary)]" />
                          Personal Information
                        </CardTitle>
                        <CardDescription>Update your personal details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                              Full Name
                            </label>
                            <Input
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                              Email
                            </label>
                            <div className="relative">
                              <Input
                                value={profile?.email || ""}
                                disabled
                                className="pl-10"
                              />
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">
                              Email cannot be changed
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                              Phone
                            </label>
                            <div className="relative">
                              <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="5XXX XXXX"
                                className="pl-10"
                              />
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                              Role
                            </label>
                            <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border)]">
                              <Badge variant={isAdmin ? "info" : "secondary"}>
                                {profile?.role || "agent"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                          <Button onClick={handleSaveProfile} disabled={isSaving}>
                            {isSaving ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            ) : saveSuccess ? (
                              <Check className="w-4 h-4 mr-2" />
                            ) : null}
                            {saveSuccess ? "Saved!" : "Save Changes"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="w-5 h-5 text-amber-500" />
                          Notification Preferences
                        </CardTitle>
                        <CardDescription>
                          Choose how you want to be notified
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {prefsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
                          </div>
                        ) : (
                          <>
                            {/* Delivery Channels */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Volume2 className="w-4 h-4 text-[var(--text-muted)]" />
                                <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Delivery Channels</h3>
                              </div>
                              <NotificationToggle
                                icon={Smartphone}
                                title="Push Notifications"
                                description="Browser push notifications for real-time alerts"
                                checked={preferences.push_notifications}
                                onCheckedChange={(val) => updatePreferences({ push_notifications: val })}
                              />
                            </div>

                            {/* Notification Types */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-1">
                                <BellRing className="w-4 h-4 text-[var(--text-muted)]" />
                                <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Notification Types</h3>
                              </div>
                              <NotificationToggle
                                icon={CalendarClock}
                                title="Appointment Reminders"
                                description="Get reminded 1 hour before scheduled appointments"
                                checked={preferences.appointment_reminders}
                                onCheckedChange={(val) => updatePreferences({ appointment_reminders: val })}
                              />
                              <NotificationToggle
                                icon={Users}
                                title="Lead Updates"
                                description="Notify when leads are assigned, updated, or change stage"
                                checked={preferences.lead_updates}
                                onCheckedChange={(val) => updatePreferences({ lead_updates: val })}
                              />
                              <NotificationToggle
                                icon={AlertTriangle}
                                title="System Alerts"
                                description="Important system notifications, errors, and security alerts"
                                checked={preferences.system_alerts}
                                onCheckedChange={(val) => updatePreferences({ system_alerts: val })}
                              />
                            </div>
                          </>
                        )}

                        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                          <Button onClick={handleSaveNotifications} disabled={prefsSaving}>
                            {prefsSaving ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            ) : notificationsSaved ? (
                              <Check className="w-4 h-4 mr-2" />
                            ) : null}
                            {notificationsSaved ? "Saved!" : "Save Preferences"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Appearance Tab */}
                {activeTab === "appearance" && (
                  <motion.div
                    key="appearance"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Palette className="w-5 h-5 text-[#445eb7]" />
                          Theme
                        </CardTitle>
                        <CardDescription>
                          Customize the look and feel
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                          <ThemeOption
                            icon={Sun}
                            label="Light"
                            value="light"
                            selected={theme === "light"}
                            onClick={() => setTheme("light")}
                          />
                          <ThemeOption
                            icon={Moon}
                            label="Dark"
                            value="dark"
                            selected={theme === "dark"}
                            onClick={() => setTheme("dark")}
                          />
                          <ThemeOption
                            icon={Monitor}
                            label="System"
                            value="system"
                            selected={theme === "system"}
                            onClick={() => setTheme("system")}
                          />
                        </div>
                      </CardContent>
                    </Card>

                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-rose-500" />
                          Security Settings
                        </CardTitle>
                        <CardDescription>
                          Manage your account security
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                              <Key className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">
                                Change Password
                              </p>
                              <p className="text-sm text-[var(--text-muted)]">
                                Last changed 30 days ago
                              </p>
                            </div>
                          </div>
                          <Button variant="outline">Update</Button>
                        </div>

                        <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#5a71c4]/15 flex items-center justify-center">
                              <Lock className="w-6 h-6 text-[#5a71c4]" />
                            </div>
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">
                                Two-Factor Authentication
                              </p>
                              <p className="text-sm text-[var(--text-muted)]">
                                Add an extra layer of security
                              </p>
                            </div>
                          </div>
                          <Button variant="outline">Enable</Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-rose-500/30 bg-rose-500/5">
                      <CardHeader>
                        <CardTitle className="text-rose-500">Danger Zone</CardTitle>
                        <CardDescription>
                          Irreversible and destructive actions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="destructive">Delete Account</Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Pipeline Tab */}
                {activeTab === "pipeline" && isAdmin && (
                  <motion.div
                    key="pipeline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <StageSettings />
                  </motion.div>
                )}

                {/* Targets Tab */}
                {activeTab === "targets" && (
                  <motion.div
                    key="targets"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <TargetSettings />
                  </motion.div>
                )}

                {/* Enrollment Cycles Tab */}
                {activeTab === "enrollment" && isAdmin && (
                  <motion.div
                    key="enrollment"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <CycleManagement />
                  </motion.div>
                )}

                {/* Schools Tab */}
                {activeTab === "schools" && isAdmin && (
                  <motion.div
                    key="schools"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <SchoolManagement />
                  </motion.div>
                )}

                {/* Documents Tab */}
                {activeTab === "documents" && isAdmin && (
                  <motion.div
                    key="documents"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <DocumentConfigManagement />
                  </motion.div>
                )}

                {/* Team Tab */}
                {activeTab === "team" && isAdmin && (
                  <motion.div
                    key="team"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <TeamManagement currentUser={profile} />
                    <LeadAssignmentRules currentUser={profile} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function NotificationToggle({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  icon?: typeof Bell
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] transition-colors hover:border-[var(--border-hover)]">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
            checked ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--bg-sunken)] text-[var(--text-muted)]"
          )}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
        <div>
          <p className="font-medium text-[var(--text-primary)]">{title}</p>
          <p className="text-sm text-[var(--text-muted)]">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function ThemeOption({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: typeof Sun
  label: string
  value?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "p-4 rounded-xl border-2 transition-all",
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/5"
          : "border-[var(--border)] hover:border-[var(--primary)]/50"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            selected ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-sunken)]"
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            selected ? "text-[var(--primary)]" : "text-[var(--text-secondary)]"
          )}
        >
          {label}
        </span>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>
    </motion.button>
  )
}
