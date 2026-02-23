"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { TeamManagement } from "@/components/settings/team-management"
import { SMSTemplatesManager } from "@/components/settings/sms-templates-manager"
import { LeadAssignmentRules } from "@/components/settings/lead-assignment-rules"
import { StageSettings } from "@/components/settings/stage-settings"
import { TargetSettings } from "@/components/settings/target-settings"
import { SchoolManagement } from "@/components/settings/school-management"
import { AutomationRulesManager } from "@/components/settings/automation-rules-manager"
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
  Globe,
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
  MessageSquare,
  Clock,
  Zap,
  ExternalLink,
  GitBranch,
  Target,
  School
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"

type SettingsTab = "profile" | "notifications" | "appearance" | "security" | "team" | "sms" | "pipeline" | "targets" | "schools" | "automations"

const TABS: { id: SettingsTab; label: string; icon: typeof User; adminOnly?: boolean }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
  { id: "pipeline", label: "Pipeline", icon: GitBranch, adminOnly: true },
  { id: "targets", label: "Targets", icon: Target, adminOnly: true },
  { id: "schools", label: "Schools", icon: School, adminOnly: true },
  { id: "sms", label: "SMS", icon: MessageSquare, adminOnly: true },
  { id: "automations", label: "Automations", icon: Zap, adminOnly: true },
  { id: "team", label: "Team", icon: Users, adminOnly: true },
]

export default function SettingsPage() {
  const { profile, isAdmin } = useUser()
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Profile state
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [appointmentReminders, setAppointmentReminders] = useState(true)
  const [leadAssignments, setLeadAssignments] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)
  const [notificationsSaved, setNotificationsSaved] = useState(false)

  // Appearance state
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system")
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("asia-kuwait")

  // Sync theme with localStorage and DOM
  useEffect(() => {
    const stored = localStorage.getItem("ktech-theme") as "light" | "dark" | "system" | null
    if (stored) {
      setThemeState(stored)
    }
  }, [])

  // Load notification settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("ktech-notification-settings")
    if (stored) {
      try {
        const settings = JSON.parse(stored)
        setEmailNotifications(settings.emailNotifications ?? true)
        setAppointmentReminders(settings.appointmentReminders ?? true)
        setLeadAssignments(settings.leadAssignments ?? true)
        setWeeklyReport(settings.weeklyReport ?? false)
      } catch (e) {
        console.error("Failed to parse notification settings:", e)
      }
    }
  }, [])

  const handleSaveNotifications = () => {
    const settings = {
      emailNotifications,
      appointmentReminders,
      leadAssignments,
      weeklyReport,
    }
    localStorage.setItem("ktech-notification-settings", JSON.stringify(settings))
    setNotificationsSaved(true)
    setTimeout(() => setNotificationsSaved(false), 2000)
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

  const visibleTabs = TABS.filter(tab => !tab.adminOnly || isAdmin)

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="p-6 page-enter">
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
                  <nav className="space-y-1">
                    {visibleTabs.map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <motion.button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          whileHover={{ x: 4 }}
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
                          <div className="relative group">
                            <Avatar className="w-24 h-24">
                              <AvatarImage src={profile?.avatar_url} />
                              <AvatarFallback className="text-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
                                {profile?.full_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                              <Camera className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <Button variant="outline" size="sm">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Photo
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
                        <div className="space-y-4">
                          <NotificationToggle
                            title="Email Notifications"
                            description="Receive email updates for new leads and activities"
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                          />
                          <NotificationToggle
                            title="Appointment Reminders"
                            description="Get reminded 1 hour before appointments"
                            checked={appointmentReminders}
                            onCheckedChange={setAppointmentReminders}
                          />
                          <NotificationToggle
                            title="Lead Assignments"
                            description="Notify when leads are assigned to you"
                            checked={leadAssignments}
                            onCheckedChange={setLeadAssignments}
                          />
                          <NotificationToggle
                            title="Weekly Performance Report"
                            description="Receive a weekly summary of your performance"
                            checked={weeklyReport}
                            onCheckedChange={setWeeklyReport}
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                          <Button onClick={handleSaveNotifications}>
                            {notificationsSaved ? (
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

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-[var(--accent)]" />
                          Language & Region
                        </CardTitle>
                        <CardDescription>
                          Set your preferred language and timezone
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                              Language
                            </label>
                            <Select value={language} onValueChange={setLanguage}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                              Timezone
                            </label>
                            <Select value={timezone} onValueChange={setTimezone}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="asia-kuwait">Asia/Kuwait (GMT+3)</SelectItem>
                                <SelectItem value="asia-riyadh">Asia/Riyadh (GMT+3)</SelectItem>
                                <SelectItem value="asia-dubai">Asia/Dubai (GMT+4)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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

                        <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#8992c8]/15 flex items-center justify-center">
                              <Settings className="w-6 h-6 text-[#8992c8]" />
                            </div>
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">
                                Active Sessions
                              </p>
                              <p className="text-sm text-[var(--text-muted)]">
                                Manage devices where you&apos;re signed in
                              </p>
                            </div>
                          </div>
                          <Button variant="outline">Manage</Button>
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

                {/* SMS Tab */}
                {activeTab === "sms" && isAdmin && (
                  <motion.div
                    key="sms"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Twilio Configuration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
                          SMS Provider (Twilio)
                        </CardTitle>
                        <CardDescription>
                          Configure Twilio credentials for SMS messaging
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-[var(--info-bg)] border border-[var(--info)]/30">
                          <p className="text-sm text-[var(--info)]">
                            SMS credentials are configured via environment variables for security.
                            Contact your administrator to update Twilio settings.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                                  <Check className="w-5 h-5 text-[var(--success)]" />
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--text-primary)]">Account SID</p>
                                  <p className="text-xs text-[var(--text-muted)]">Configured</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                                <Check className="w-5 h-5 text-[var(--success)]" />
                              </div>
                              <div>
                                <p className="font-medium text-[var(--text-primary)]">Auth Token</p>
                                <p className="text-xs text-[var(--text-muted)]">Configured</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                                <Phone className="w-5 h-5 text-[var(--success)]" />
                              </div>
                              <div>
                                <p className="font-medium text-[var(--text-primary)]">Sender Number</p>
                                <p className="text-xs text-[var(--text-muted)]">+965 XXXX XXXX</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[var(--warning)]/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-[var(--warning)]" />
                              </div>
                              <div>
                                <p className="font-medium text-[var(--text-primary)]">Demo Mode</p>
                                <p className="text-xs text-[var(--text-muted)]">No API calls made</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button variant="outline" className="mt-4" asChild>
                          <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer">
                            Open Twilio Console
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Auto Reminders */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-amber-500" />
                          Automatic Reminders
                        </CardTitle>
                        <CardDescription>
                          Configure automatic SMS reminders for appointments
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <NotificationToggle
                            title="24-Hour Reminder"
                            description="Send reminder SMS 24 hours before appointment"
                            checked={true}
                            onCheckedChange={() => {}}
                          />
                          <NotificationToggle
                            title="2-Hour Reminder"
                            description="Send reminder SMS 2 hours before appointment"
                            checked={true}
                            onCheckedChange={() => {}}
                          />
                        </div>

                        <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
                          <p className="text-sm text-[var(--text-secondary)] mb-3">
                            Reminders are sent automatically via scheduled jobs. Set up a cron job to call:
                          </p>
                          <code className="block p-3 rounded-lg bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-primary)]">
                            POST /api/sms/reminders {"{"} type: &quot;24h&quot; | &quot;2h&quot; {"}"}
                          </code>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SMS Templates Manager */}
                    <SMSTemplatesManager />
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
                {activeTab === "targets" && isAdmin && (
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

                {/* Automations Tab */}
                {activeTab === "automations" && isAdmin && (
                  <motion.div
                    key="automations"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <AutomationRulesManager />
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
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
      <div>
        <p className="font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-sm text-[var(--text-muted)]">{description}</p>
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
