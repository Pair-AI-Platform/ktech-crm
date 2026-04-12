"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/utils"
import { ProgressBar } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Calendar,
  Phone,
  CheckCircle,
  XCircle,
  PhoneMissed,
  Users,
  Monitor,
  Building2,
  TrendingUp,
  Clock,
} from "lucide-react"
import type { CalendarReportData } from "@/lib/hooks/use-reports"

interface CalendarReportsProps {
  data: CalendarReportData
  isAgent?: boolean
}

const emptySubscribe = () => () => {}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#6366f1',
  no_answer: '#f59e0b',
  confirmed: '#22c55e',
  on_the_way: '#3b82f6',
  postponed: '#8b5cf6',
  cant_reach: '#ef4444',
  will_see: '#06b6d4',
  completed: '#10b981',
  cancelled: '#f43f5e',
}

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#f43f5e', '#10b981']

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-[var(--text-primary)] mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-sm font-medium text-[var(--text-primary)]">{payload[0].name}</p>
        <p className="text-sm text-[var(--text-secondary)]">{payload[0].value} ({payload[0].payload.percent}%)</p>
      </div>
    )
  }
  return null
}

export function CalendarReports({ data, isAgent }: CalendarReportsProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false)
  if (!isClient) return null

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard
          title="Appointments"
          value={data.totalAppointments}
          icon={<Calendar className="w-4 h-4" />}
          color="var(--color-primary)"
        />
        <KPICard
          title="Callbacks"
          value={data.totalCallbacks}
          icon={<Phone className="w-4 h-4" />}
          color="var(--color-accent)"
        />
        <KPICard
          title="Completed"
          value={data.completedAppointments + data.completedCallbacks}
          icon={<CheckCircle className="w-4 h-4" />}
          color="#22c55e"
        />
        <KPICard
          title="Cancelled"
          value={data.cancelledAppointments + data.cancelledCallbacks}
          icon={<XCircle className="w-4 h-4" />}
          color="#ef4444"
        />
        <KPICard
          title="Appt. Attendance"
          value={`${data.appointmentAttendanceRate}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="#10b981"
        />
        <KPICard
          title="No Answer"
          value={data.noAnswerAppointments + data.noAnswerCallbacks}
          icon={<PhoneMissed className="w-4 h-4" />}
          color="#f59e0b"
        />
      </div>

      {/* Agent role: only show KPI boxes */}
      {isAgent ? null : <>

      {/* Daily Volume Chart */}
      {data.appointmentsByDay.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--color-primary)]" />
              Daily Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.appointmentsByDay.map(d => ({ ...d, date: formatDate(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="appointments" name="Appointments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="callbacks" name="Callbacks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two columns: Appointments | Callbacks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
            Appointments
            <Badge variant="secondary" size="sm">{data.totalAppointments}</Badge>
          </h3>

          {/* Appointment Status Pie */}
          {data.appointmentsByStatus.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.appointmentsByStatus}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {data.appointmentsByStatus.map((entry, index) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {data.appointmentsByStatus.map((s, i) => (
                    <div key={s.status} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] || PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[var(--text-secondary)]">{s.label} ({s.count})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modality */}
          {data.appointmentsByModality.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By Modality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.appointmentsByModality.map(m => (
                  <div key={m.modality} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {m.modality === 'online' ? <Monitor className="w-3.5 h-3.5 text-blue-500" /> : <Building2 className="w-3.5 h-3.5 text-violet-500" />}
                      <span className="text-[var(--text-primary)]">{m.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{m.count}</span>
                      <Badge variant="secondary" size="sm">{m.percent}%</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Agent Breakdown - New Appointments (admin only) */}
          {!isAgent && data.newAppointmentsByAgent.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--color-primary)]" />
                  Agent Performance (New Appointments)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.newAppointmentsByAgent.map(a => (
                  <div key={a.agentId} className="flex items-center gap-3">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={a.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px] bg-[var(--bg-secondary)]">{getInitials(a.agentName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[var(--text-primary)] truncate">{a.agentName}</span>
                        <span className="text-xs text-[var(--text-secondary)]">{a.completed}/{a.total}</span>
                      </div>
                      <ProgressBar value={a.completionRate} size="sm" color={a.completionRate >= 70 ? 'success' : a.completionRate >= 40 ? 'warning' : 'error'} />
                    </div>
                    <Badge variant={a.completionRate >= 70 ? 'success' : a.completionRate >= 40 ? 'warning' : 'error'} size="sm">
                      {a.completionRate}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Callbacks Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-500" />
            Callbacks
            <Badge variant="secondary" size="sm">{data.totalCallbacks}</Badge>
          </h3>

          {/* Callback Status Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {data.callbacksByStatus.some(s => s.count > 0) ? (
                <>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.callbacksByStatus.filter(s => s.count > 0)}
                          dataKey="count"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {data.callbacksByStatus.filter(s => s.count > 0).map((entry, index) => (
                            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {data.callbacksByStatus.map((s, i) => (
                      <div key={s.status} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] || PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className={`${s.count > 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'}`}>{s.label} ({s.count})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Phone className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-tertiary)]">No callbacks in this period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Callback Summary Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Callback Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-center">
                  <p className="text-lg font-bold text-emerald-500">{data.completedCallbacks}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Completed</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-center">
                  <p className="text-lg font-bold text-rose-500">{data.cancelledCallbacks}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Cancelled</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-center">
                  <p className="text-lg font-bold text-amber-500">{data.noAnswerCallbacks}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">No Answer</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-center">
                  <p className="text-lg font-bold text-[var(--text-primary)]">{data.callbackCompletionRate}%</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Completion Rate</p>
                </div>
              </div>
              {data.totalCallbacks > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5">
                    <span>Completion Progress</span>
                    <span>{data.completedCallbacks}/{data.totalCallbacks}</span>
                  </div>
                  <ProgressBar
                    value={data.callbackCompletionRate}
                    size="sm"
                    color={data.callbackCompletionRate >= 70 ? 'success' : data.callbackCompletionRate >= 40 ? 'warning' : 'error'}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Callback Attendance Rate */}
          {data.totalCallbacks > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={data.callbackAttendanceRate >= 70 ? '#10b981' : data.callbackAttendanceRate >= 40 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${data.callbackAttendanceRate}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{data.callbackAttendanceRate}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">Answered</span>
                      <span className="font-medium text-[var(--text-primary)]">{data.totalCallbacks - data.noAnswerCallbacks}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">No Answer</span>
                      <span className="font-medium text-amber-500">{data.noAnswerCallbacks}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">Total</span>
                      <span className="font-medium text-[var(--text-primary)]">{data.totalCallbacks}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Breakdown - Callbacks (admin only) */}
          {!isAgent && data.callbacksByAgent.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  Agent Performance (Callbacks)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.callbacksByAgent.map(a => (
                  <div key={a.agentId} className="flex items-center gap-3">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={a.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px] bg-[var(--bg-secondary)]">{getInitials(a.agentName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[var(--text-primary)] truncate">{a.agentName}</span>
                        <span className="text-xs text-[var(--text-secondary)]">{a.completed}/{a.total}</span>
                      </div>
                      <ProgressBar value={a.completionRate} size="sm" color={a.completionRate >= 70 ? 'success' : a.completionRate >= 40 ? 'warning' : 'error'} />
                    </div>
                    <Badge variant={a.completionRate >= 70 ? 'success' : a.completionRate >= 40 ? 'warning' : 'error'} size="sm">
                      {a.completionRate}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>


      </>}
    </div>
  )
}

function KPICard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card hover>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
              <div style={{ color }}>{icon}</div>
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{title}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
