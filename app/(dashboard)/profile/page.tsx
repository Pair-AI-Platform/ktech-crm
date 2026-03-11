"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProgressBar, ProgressRing } from "@/components/ui/progress"
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Target,
  TrendingUp,
  Edit,
  Save,
  Loader2,
  CheckCircle2,
  Users,
  GraduationCap,
} from "lucide-react"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"

export default function ProfilePage() {
  const { profile, loading: userLoading } = useUser()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  })

  // Stats (would come from API)
  const [stats, setStats] = useState({
    leadsAssigned: 45,
    studentsEnrolled: 12,
    appointmentsThisMonth: 28,
    conversionRate: 27,
    monthlyTarget: 20,
    currentProgress: 12,
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      })
      setStats((prev) => ({
        ...prev,
        monthlyTarget: profile.monthly_target || 20,
      }))
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (!error) {
        setSaveSuccess(true)
        setEditing(false)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSaving(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <p className="text-[var(--text-muted)]">Please sign in to view your profile</p>
      </div>
    )
  }

  const progressPercent = stats.monthlyTarget > 0 ? Math.round((stats.currentProgress / stats.monthlyTarget) * 100) : 0

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title="My Profile"
        subtitle="View and manage your profile"
      />

      <div className="px-3 py-4 sm:p-6 space-y-4 sm:space-y-6 page-enter">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            {/* Gradient Header */}
            <div className="h-32 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] opacity-20" />

            <CardContent className="p-6 -mt-16">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                {/* Profile Info */}
                <div className="flex items-end gap-4">
                  <Avatar size="xl" className="ring-4 ring-[var(--bg-surface)] w-24 h-24">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    ) : (
                      <AvatarFallback className="text-2xl">
                        {profile.full_name?.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="pb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        {profile.full_name}
                      </h1>
                      <Badge variant={profile.role === "admin" ? "accent" : "default"}>
                        {profile.role === "admin" ? "Admin" : "Agent"}
                      </Badge>
                      {profile.is_active && (
                        <Badge variant="success">Active</Badge>
                      )}
                    </div>
                    <p className="text-[var(--text-secondary)] mt-1">{profile.email}</p>
                  </div>
                </div>

                {/* Target Progress */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-sunken)]">
                  <ProgressRing value={progressPercent} size={60}>
                    <span className="text-sm font-bold">{progressPercent}%</span>
                  </ProgressRing>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Monthly Target</p>
                    <p className="font-medium text-[var(--text-primary)]">
                      {stats.currentProgress} / {stats.monthlyTarget} enrolled
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
                        <User className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your profile details</CardDescription>
                      </div>
                    </div>
                    {!editing ? (
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {saveSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--success-bg)] text-[var(--success)] text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Profile updated successfully
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      {editing ? (
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                        />
                      ) : (
                        <p className="px-3 py-2 rounded-lg bg-[var(--bg-sunken)] text-[var(--text-primary)]">
                          {profile.full_name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-sunken)]">
                        <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-[var(--text-primary)]">{profile.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      {editing ? (
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="+965 XXXX XXXX"
                        />
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-sunken)]">
                          <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                          <span className="text-[var(--text-primary)]">
                            {profile.phone || "Not set"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Role</Label>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-sunken)]">
                        <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-[var(--text-primary)] capitalize">{profile.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border)]">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[var(--text-muted)]">Member since</p>
                        <p className="font-medium text-[var(--text-primary)]">
                          {formatDate(profile.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)]">Last updated</p>
                        <p className="font-medium text-[var(--text-primary)]">
                          {formatDate(profile.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                    </div>
                    <div>
                      <CardTitle>Performance Stats</CardTitle>
                      <CardDescription>Your activity this month</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-sunken)] text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-[var(--primary-muted)] flex items-center justify-center mb-2">
                        <Users className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.leadsAssigned}</p>
                      <p className="text-xs text-[var(--text-muted)]">Leads Assigned</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-sunken)] text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-[var(--success)]/10 flex items-center justify-center mb-2">
                        <GraduationCap className="w-5 h-5 text-[var(--success)]" />
                      </div>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.studentsEnrolled}</p>
                      <p className="text-xs text-[var(--text-muted)]">Enrolled</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-sunken)] text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-[var(--accent)]/10 flex items-center justify-center mb-2">
                        <Calendar className="w-5 h-5 text-[var(--accent)]" />
                      </div>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.appointmentsThisMonth}</p>
                      <p className="text-xs text-[var(--text-muted)]">Appointments</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-sunken)] text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-[var(--warning)]/10 flex items-center justify-center mb-2">
                        <TrendingUp className="w-5 h-5 text-[var(--warning)]" />
                      </div>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.conversionRate}%</p>
                      <p className="text-xs text-[var(--text-muted)]">Conversion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/settings">
                      <Shield className="w-4 h-4 mr-2" />
                      Account Settings
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/leads">
                      <Users className="w-4 h-4 mr-2" />
                      My Leads
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/calendar">
                      <Calendar className="w-4 h-4 mr-2" />
                      My Appointments
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Target */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-[var(--warning)]" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Monthly Target</CardTitle>
                      <CardDescription>{formatDate(new Date().toISOString())}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-[var(--text-primary)]">
                      {stats.currentProgress}
                      <span className="text-lg text-[var(--text-muted)]"> / {stats.monthlyTarget}</span>
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Students enrolled</p>
                  </div>
                  <ProgressBar
                    value={progressPercent}
                    variant={progressPercent >= 100 ? "success" : progressPercent >= 50 ? "default" : "warning"}
                  />
                  <p className="text-xs text-center text-[var(--text-muted)]">
                    {stats.monthlyTarget - stats.currentProgress > 0
                      ? `${stats.monthlyTarget - stats.currentProgress} more to reach target`
                      : "Target achieved! 🎉"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
