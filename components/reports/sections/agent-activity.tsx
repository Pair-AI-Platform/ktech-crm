"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress"
import { Phone, PhoneOff } from "lucide-react"
import type { AgentPerformanceData } from "@/lib/hooks/use-reports"

interface AgentActivityProps {
  data: AgentPerformanceData['activity']
}

export function AgentActivity({ data }: AgentActivityProps) {
  const maxAvg = Math.max(...data.map(d => d.avgContactsPerLead), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-[var(--info)]" />
            Contact Activity
          </CardTitle>
          <CardDescription>
            Average contacts per lead and uncontacted lead rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-3 text-sm font-medium text-[var(--text-muted)]">Agent</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-[var(--text-muted)]">Total Contacts</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-[var(--text-muted)] w-48">Avg / Lead</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-[var(--text-muted)]">Never Contacted</th>
                </tr>
              </thead>
              <tbody>
                {data.map((agent) => (
                  <tr
                    key={agent.agentId}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg-sunken)] transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
                          <AvatarFallback>
                            {agent.agentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[var(--text-primary)] whitespace-nowrap">
                          {agent.agentName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {agent.totalContacts}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <ProgressBar
                            value={agent.avgContactsPerLead}
                            max={maxAvg}
                            size="sm"
                            variant="gradient"
                          />
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {agent.avgContactsPerLead}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {agent.leadsNeverContacted > 0 ? (
                        <div className="flex items-center gap-2">
                          <PhoneOff className="w-3.5 h-3.5 text-[var(--error)]" />
                          <span className="text-sm text-[var(--text-primary)]">
                            {agent.leadsNeverContacted}
                          </span>
                          <Badge
                            variant={agent.leadsNeverContactedPercent > 50 ? 'destructive' : agent.leadsNeverContactedPercent > 25 ? 'warning' : 'secondary'}
                            size="sm"
                          >
                            {agent.leadsNeverContactedPercent}%
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="success" size="sm">All contacted</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
