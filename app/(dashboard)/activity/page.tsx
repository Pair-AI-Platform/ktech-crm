"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Activity,
  Search,
  Filter,
  Clock,
  User,
  FileEdit,
  Trash2,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  GraduationCap,
  Calendar,
  MessageSquare,
  CreditCard,
  RefreshCw,
} from "lucide-react"
import { cn, getRelativeTime } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import type { AuditLog } from "@/types"

// Action icons
const ACTION_CONFIG = {
  INSERT: { label: "Created", icon: Plus, color: "text-[var(--success)]", bg: "bg-[var(--success)]/10" },
  UPDATE: { label: "Updated", icon: FileEdit, color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/10" },
  DELETE: { label: "Deleted", icon: Trash2, color: "text-[var(--error)]", bg: "bg-[var(--error)]/10" },
}

// Table-specific icons
const TABLE_CONFIG: Record<string, { label: string; icon: typeof Users }> = {
  leads: { label: "Lead", icon: Users },
  students: { label: "Student", icon: GraduationCap },
  appointments: { label: "Appointment", icon: Calendar },
  sms_messages: { label: "SMS", icon: MessageSquare },
  payments: { label: "Payment", icon: CreditCard },
  profiles: { label: "User", icon: User },
}

// Demo data for activity log
const generateDemoLogs = (): AuditLog[] => {
  const actions: AuditLog["action"][] = ["INSERT", "UPDATE", "DELETE"]
  const tables = ["leads", "students", "appointments", "sms_messages", "payments"]
  const users = [
    { id: "1", email: "admin@ktech.edu.kw", name: "Ahmad Al-Sabah" },
    { id: "2", email: "agent1@ktech.edu.kw", name: "Sara Al-Mutawa" },
    { id: "3", email: "agent2@ktech.edu.kw", name: "Mohammed Al-Rashid" },
  ]

  const logs: AuditLog[] = []

  for (let i = 0; i < 50; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)]
    const table = tables[Math.floor(Math.random() * tables.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)

    const log: AuditLog = {
      id: `log-${i}`,
      table_name: table,
      record_id: `record-${Math.floor(Math.random() * 1000)}`,
      action,
      user_id: user.id,
      user_email: user.email,
      created_at: date.toISOString(),
    }

    if (action === "UPDATE") {
      log.changed_fields = ["pipeline_stage", "notes", "assigned_to"].slice(0, Math.floor(Math.random() * 3) + 1)
      log.old_values = { pipeline_stage: "new", notes: "Initial contact" }
      log.new_values = { pipeline_stage: "visit", notes: "Campus visit completed" }
    } else if (action === "INSERT") {
      log.new_values = {
        first_name: "New",
        last_name: "Lead",
        phone: "99999999",
        pipeline_stage: "new",
      }
    }

    logs.push(log)
  }

  return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export default function ActivityPage() {
  const { profile } = useUser()
  const [logs, setLogs] = useState<AuditLog[]>(() => generateDemoLogs())
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTable, setFilterTable] = useState<string>("all")
  const [filterAction, setFilterAction] = useState<string>("all")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const refreshLogs = useCallback(async () => {
    setLoading(true)
    // Simulated API call - replace with real endpoint
    await new Promise((resolve) => setTimeout(resolve, 500))
    setLogs(generateDemoLogs())
    setLoading(false)
  }, [])

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.record_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTable = filterTable === "all" || log.table_name === filterTable
    const matchesAction = filterAction === "all" || log.action === filterAction

    return matchesSearch && matchesTable && matchesAction
  })

  // Paginate
  const totalPages = Math.ceil(filteredLogs.length / pageSize)
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize)

  // Group logs by date
  const groupedLogs = paginatedLogs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, AuditLog[]>)

  // Stats
  const stats = {
    total: logs.length,
    today: logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
    creates: logs.filter((l) => l.action === "INSERT").length,
    updates: logs.filter((l) => l.action === "UPDATE").length,
    deletes: logs.filter((l) => l.action === "DELETE").length,
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title="Activity Log"
        subtitle="Track all changes and actions in the system"
        action={{
          label: "Refresh",
          onClick: refreshLogs,
          icon: <RefreshCw className="w-4 h-4" />,
        }}
      />

      <div className="p-6 space-y-6 page-enter">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
                    <p className="text-xs text-[var(--text-muted)]">Total Activities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.today}</p>
                    <p className="text-xs text-[var(--text-muted)]">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.creates}</p>
                    <p className="text-xs text-[var(--text-muted)]">Creates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center">
                    <FileEdit className="w-5 h-5 text-[var(--warning)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.updates}</p>
                    <p className="text-xs text-[var(--text-muted)]">Updates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--error-bg)] flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-[var(--error)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.deletes}</p>
                    <p className="text-xs text-[var(--text-muted)]">Deletes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2 text-[var(--text-muted)]" />
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {Object.entries(TABLE_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(ACTION_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn("w-4 h-4", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--primary)]" />
              Activity Timeline
            </CardTitle>
            <CardDescription>
              Showing {paginatedLogs.length} of {filteredLogs.length} activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  No activities found
                </h3>
                <p className="text-[var(--text-muted)]">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <AnimatePresence>
                  {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Date Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-depth-3)] flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-[var(--text-muted)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            {new Date(date).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {dateLogs.length} activities
                          </p>
                        </div>
                      </div>

                      {/* Logs for this date */}
                      <div className="ml-5 pl-5 border-l-2 border-[var(--border)] space-y-4">
                        {dateLogs.map((log, index) => {
                          const actionConfig = ACTION_CONFIG[log.action]
                          const tableConfig = TABLE_CONFIG[log.table_name] || {
                            label: log.table_name,
                            icon: Activity,
                          }
                          const ActionIcon = actionConfig.icon
                          const TableIcon = tableConfig.icon

                          return (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="relative"
                            >
                              {/* Timeline dot */}
                              <div
                                className={cn(
                                  "absolute -left-[29px] w-4 h-4 rounded-full border-2 border-[var(--bg-depth-2)]",
                                  actionConfig.bg
                                )}
                              />

                              <div className="p-4 rounded-lg bg-[var(--bg-depth-3)] hover:bg-[var(--bg-depth-2)] transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                        actionConfig.bg
                                      )}
                                    >
                                      <ActionIcon className={cn("w-5 h-5", actionConfig.color)} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" size="sm">
                                          <TableIcon className="w-3 h-3 mr-1" />
                                          {tableConfig.label}
                                        </Badge>
                                        <Badge
                                          variant={
                                            log.action === "INSERT"
                                              ? "success"
                                              : log.action === "DELETE"
                                              ? "destructive"
                                              : "warning"
                                          }
                                          size="sm"
                                        >
                                          {actionConfig.label}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-[var(--text-primary)] mt-1">
                                        {log.user_email || "System"}{" "}
                                        <span className="text-[var(--text-muted)]">
                                          {log.action === "INSERT"
                                            ? "created a new"
                                            : log.action === "DELETE"
                                            ? "deleted a"
                                            : "updated a"}{" "}
                                          {tableConfig.label.toLowerCase()}
                                        </span>
                                      </p>

                                      {/* Changed fields for updates */}
                                      {log.action === "UPDATE" && log.changed_fields && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {log.changed_fields.map((field) => (
                                            <Badge
                                              key={field}
                                              variant="secondary"
                                              size="sm"
                                              className="font-mono text-xs"
                                            >
                                              {field}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}

                                      {/* Value changes */}
                                      {log.action === "UPDATE" && log.old_values && log.new_values && (
                                        <div className="mt-2 text-xs text-[var(--text-muted)] space-y-1">
                                          {Object.keys(log.new_values).slice(0, 2).map((key) => (
                                            <div key={key} className="flex items-center gap-1">
                                              <span className="text-[var(--text-secondary)]">{key}:</span>
                                              <span className="line-through opacity-60">
                                                {String(log.old_values?.[key] || "-")}
                                              </span>
                                              <ArrowRight className="w-3 h-3" />
                                              <span className="text-[var(--text-primary)]">
                                                {String(log.new_values?.[key] ?? "-")}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      <p className="text-xs text-[var(--text-muted)] mt-2">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {getRelativeTime(log.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-muted)]">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
