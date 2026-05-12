"use client"

import { useMemo, useState } from "react"
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
  CreditCard,
  RefreshCw,
} from "lucide-react"
import { cn, getRelativeTime } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { useAuditLogs } from "@/lib/hooks/use-audit-logs"
import { getMockAuditLogs, filterMockAuditLogs } from "@/lib/demo-activity-logs"

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
  payments: { label: "Payment", icon: CreditCard },
  profiles: { label: "User", icon: User },
}

export default function ActivityPage() {
  const { profile, isAdmin } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTable, setFilterTable] = useState<string>("all")
  const [filterAction, setFilterAction] = useState<string>("all")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { logs: realLogs, total: realTotal, loading, refetch } = useAuditLogs({
    isAdmin,
    userId: profile?.id,
    page,
    pageSize,
    search: searchQuery || undefined,
    filterTable,
    filterAction,
  })

  // Demo fallback: when the audit_logs table has no records (e.g. fresh prod / demo env),
  // render a curated set of mock activities so the page stays useful for client demos.
  // Filters and search apply to the mock dataset too. Pagination is in-memory only here.
  const usingMockData = !loading && realTotal === 0
  const mockFiltered = useMemo(() => {
    if (!usingMockData) return [] as ReturnType<typeof getMockAuditLogs>
    return filterMockAuditLogs(getMockAuditLogs(), {
      search: searchQuery,
      filterTable,
      filterAction,
    })
  }, [usingMockData, searchQuery, filterTable, filterAction])

  const logs = usingMockData
    ? mockFiltered.slice((page - 1) * pageSize, page * pageSize)
    : realLogs
  const total = usingMockData ? mockFiltered.length : realTotal

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, typeof logs>)

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title="Activity Log"
        subtitle={isAdmin ? "Track all changes and actions in the system" : "Track changes on your assigned leads"}
        action={{
          label: "Refresh",
          onClick: () => refetch(),
          icon: <RefreshCw className="w-4 h-4" />,
        }}
      />

      <div className="px-3 py-4 sm:p-6 space-y-4 sm:space-y-6 page-enter">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{total}</p>
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
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
                    </p>
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
                    <FileEdit className="w-5 h-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{logs.length}</p>
                    <p className="text-xs text-[var(--text-muted)]">This Page</p>
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={filterTable} onValueChange={(v) => { setFilterTable(v); setPage(1) }}>
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
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1) }}>
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
              Showing {logs.length} of {total} activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  No activities found
                </h3>
                <p className="text-[var(--text-muted)]">
                  {searchQuery || filterTable !== "all" || filterAction !== "all"
                    ? "Try adjusting your filters"
                    : "No activity has been recorded yet"}
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
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center">
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
                                  "absolute -left-[29px] w-4 h-4 rounded-full border-2 border-[var(--bg-elevated)]",
                                  actionConfig.bg
                                )}
                              />

                              <div className="p-4 rounded-lg bg-[var(--bg-sunken)] hover:bg-[var(--bg-elevated)] transition-colors">
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
