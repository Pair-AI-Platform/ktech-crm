"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, Check, X, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentPerformanceData } from "@/lib/hooks/use-reports"

interface AgentAppointmentRatesProps {
  data: AgentPerformanceData['appointmentRates']
}

export function AgentAppointmentRates({ data }: AgentAppointmentRatesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[var(--success)]" />
            Appointment Completion
          </CardTitle>
          <CardDescription>
            Completion rates, cancellations, and no-shows per agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((agent) => (
              <div
                key={agent.agentId}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar size="sm">
                    {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
                    <AvatarFallback>
                      {agent.agentName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {agent.agentName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {agent.total} appointments
                    </p>
                  </div>
                  <Badge
                    variant={agent.completionRate >= 70 ? 'success' : agent.completionRate >= 40 ? 'warning' : 'destructive'}
                    size="sm"
                  >
                    {agent.completionRate}%
                  </Badge>
                </div>

                {/* Stacked bar */}
                {agent.total > 0 ? (
                  <>
                    <div className="h-3 rounded-full overflow-hidden flex bg-[var(--bg-sunken)]">
                      {agent.completed > 0 && (
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${(agent.completed / agent.total) * 100}%` }}
                        />
                      )}
                      {agent.cancelled > 0 && (
                        <div
                          className="bg-orange-400 h-full"
                          style={{ width: `${(agent.cancelled / agent.total) * 100}%` }}
                        />
                      )}
                      {agent.noShow > 0 && (
                        <div
                          className="bg-red-400 h-full"
                          style={{ width: `${(agent.noShow / agent.total) * 100}%` }}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        {agent.completed}
                      </span>
                      <span className="flex items-center gap-1">
                        <X className="w-3 h-3 text-orange-400" />
                        {agent.cancelled}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserX className="w-3 h-3 text-red-400" />
                        {agent.noShow}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] text-center py-2">No appointments</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
