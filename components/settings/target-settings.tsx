"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Target,
  Users,
  Check,
  Save,
  User,
  GraduationCap,
  Wallet,
  Calendar,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import type { Profile, TargetMode } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function TargetSettings() {
  const [targetMode, setTargetMode] = useState<TargetMode>("simple")
  const [agents, setAgents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [agentTargets, setAgentTargets] = useState<Record<string, {
    monthly_target: number
    target_male: number
    target_female: number
    target_puc: number
    target_sf: number
  }>>({})
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch target mode from database
      const { data: settingsData } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "target_mode")
        .single()

      if (settingsData?.value) {
        const mode = typeof settingsData.value === 'string'
          ? settingsData.value as TargetMode
          : 'simple'
        setTargetMode(mode)
        // Keep localStorage in sync for backwards compatibility
        localStorage.setItem("ktech-target-mode", mode)
      }

      // Fetch agents
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("full_name")

      if (profilesData) {
        setAgents(profilesData)

        // Initialize agent targets
        const targets: Record<string, { monthly_target: number; target_male: number; target_female: number; target_puc: number; target_sf: number }> = {}
        profilesData.forEach(agent => {
          targets[agent.id] = {
            monthly_target: agent.monthly_target || 0,
            target_male: agent.target_male || 0,
            target_female: agent.target_female || 0,
            target_puc: agent.target_puc || 0,
            target_sf: agent.target_sf || 0,
          }
        })
        setAgentTargets(targets)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleModeChange = async (mode: TargetMode) => {
    setTargetMode(mode)
    // Save to database
    await supabase
      .from("system_settings")
      .update({ value: mode })
      .eq("key", "target_mode")
    // Keep localStorage in sync for backwards compatibility
    localStorage.setItem("ktech-target-mode", mode)
  }

  const handleTargetChange = (agentId: string, field: string, value: string) => {
    setAgentTargets(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        [field]: parseInt(value) || 0
      }
    }))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // Save target mode to database
      await supabase
        .from("system_settings")
        .update({ value: targetMode })
        .eq("key", "target_mode")
      // Keep localStorage in sync
      localStorage.setItem("ktech-target-mode", targetMode)

      // Save agent targets
      for (const agentId of Object.keys(agentTargets)) {
        const targets = agentTargets[agentId]
        await supabase
          .from("profiles")
          .update({
            monthly_target: targets.monthly_target,
            target_male: targets.target_male,
            target_female: targets.target_female,
            target_puc: targets.target_puc,
            target_sf: targets.target_sf,
          })
          .eq("id", agentId)
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const toggleAgentExpanded = (agentId: string) => {
    setExpandedAgents(prev => ({ ...prev, [agentId]: !prev[agentId] }))
  }

  // Compute weekly breakdown from a monthly target
  const getWeeklyBreakdown = (monthlyTarget: number) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const monthName = firstDay.toLocaleDateString('en-US', { month: 'short' })

    const weeks: { label: string; target: number; isCurrent: boolean }[] = []
    let weekStart = new Date(firstDay)
    let weekNum = 1

    while (weekStart <= lastDay) {
      const weekEnd = new Date(weekStart)
      const daysUntilSat = (6 - weekStart.getDay() + 7) % 7
      weekEnd.setDate(weekStart.getDate() + daysUntilSat)
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime())

      const isCurrent = now >= weekStart && now <= new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59)
      weeks.push({
        label: `Week ${weekNum} (${monthName} ${weekStart.getDate()}-${weekEnd.getDate()})`,
        target: 0,
        isCurrent,
      })

      weekStart = new Date(weekEnd)
      weekStart.setDate(weekStart.getDate() + 1)
      weekNum++
    }

    // Distribute target
    const basePerWeek = Math.floor(monthlyTarget / weeks.length)
    const remainder = monthlyTarget - basePerWeek * weeks.length
    weeks.forEach((w, i) => {
      w.target = basePerWeek + (i === weeks.length - 1 ? remainder : 0)
    })

    return weeks
  }

  const getModeDescription = (mode: TargetMode) => {
    switch (mode) {
      case "simple":
        return "Single target number per agent"
      case "gender":
        return "Separate targets for Male and Female students"
      case "funding":
        return "Separate targets for PUC and Self-Funded students"
    }
  }

  const getTotalTarget = (agentId: string) => {
    const targets = agentTargets[agentId]
    if (!targets) return 0

    switch (targetMode) {
      case "simple":
        return targets.monthly_target
      case "gender":
        return targets.target_male + targets.target_female
      case "funding":
        return targets.target_puc + targets.target_sf
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Target Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--primary)]" />
            Target Configuration Mode
          </CardTitle>
          <CardDescription>
            Choose how application targets are categorized for agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TargetModeOption
              icon={User}
              label="Simple"
              description="Single target"
              selected={targetMode === "simple"}
              onClick={() => handleModeChange("simple")}
            />
            <TargetModeOption
              icon={Users}
              label="By Gender"
              description="Male / Female"
              selected={targetMode === "gender"}
              onClick={() => handleModeChange("gender")}
            />
            <TargetModeOption
              icon={Wallet}
              label="By Funding"
              description="PUC / Self-Funded"
              selected={targetMode === "funding"}
              onClick={() => handleModeChange("funding")}
            />
          </div>

          <div className="mt-4 p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)]">
              <strong>Current Mode:</strong> {getModeDescription(targetMode)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Agent Targets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[var(--accent)]" />
                Agent Targets
              </CardTitle>
              <CardDescription>
                Set monthly application targets for each agent
              </CardDescription>
            </div>
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saveSuccess ? "Saved!" : "Save All Targets"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-sunken)]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={agent.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 text-[var(--primary)] text-sm">
                      {agent.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">{agent.full_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{agent.email}</p>
                  </div>
                  <Badge variant="secondary">
                    Total: {getTotalTarget(agent.id)}
                  </Badge>
                </div>

                {targetMode === "simple" && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Monthly Target
                      </label>
                      <Input
                        type="number"
                        value={agentTargets[agent.id]?.monthly_target || 0}
                        onChange={(e) => handleTargetChange(agent.id, "monthly_target", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {targetMode === "gender" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        Male Target
                      </label>
                      <Input
                        type="number"
                        value={agentTargets[agent.id]?.target_male || 0}
                        onChange={(e) => handleTargetChange(agent.id, "target_male", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        Female Target
                      </label>
                      <Input
                        type="number"
                        value={agentTargets[agent.id]?.target_female || 0}
                        onChange={(e) => handleTargetChange(agent.id, "target_female", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {targetMode === "funding" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        PUC Target
                      </label>
                      <Input
                        type="number"
                        value={agentTargets[agent.id]?.target_puc || 0}
                        onChange={(e) => handleTargetChange(agent.id, "target_puc", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        Self-Funded Target
                      </label>
                      <Input
                        type="number"
                        value={agentTargets[agent.id]?.target_sf || 0}
                        onChange={(e) => handleTargetChange(agent.id, "target_sf", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Weekly Breakdown */}
                {getTotalTarget(agent.id) > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleAgentExpanded(agent.id)}
                      className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Weekly Breakdown
                      {expandedAgents[agent.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {expandedAgents[agent.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2"
                      >
                        {getWeeklyBreakdown(getTotalTarget(agent.id)).map((week) => (
                          <div
                            key={week.label}
                            className={cn(
                              "p-3 rounded-lg border text-center",
                              week.isCurrent
                                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                : "border-[var(--border)] bg-[var(--bg-elevated)]"
                            )}
                          >
                            <p className={cn(
                              "text-xs font-medium mb-1",
                              week.isCurrent ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                            )}>
                              {week.label.split(' (')[0]}
                            </p>
                            <p className="text-lg font-bold text-[var(--text-primary)]">
                              {week.target}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {week.label.match(/\((.+)\)/)?.[1]}
                            </p>
                            {week.isCurrent && (
                              <Badge variant="default" className="mt-1 text-[10px] px-1.5 py-0">
                                Current
                              </Badge>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TargetModeOption({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: typeof Target
  label: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "p-4 rounded-xl border-2 transition-all text-left",
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/5"
          : "border-[var(--border)] hover:border-[var(--primary)]/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            selected ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-sunken)]"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-semibold",
              selected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
            )}
          >
            {label}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{description}</p>
        </div>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0"
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>
    </motion.button>
  )
}
