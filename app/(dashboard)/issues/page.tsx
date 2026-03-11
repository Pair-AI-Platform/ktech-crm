"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Flag,
  Download,
} from "lucide-react";

type Severity = "critical" | "warning" | "info" | "resolved";

interface Issue {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  conversationId: string;
  customerName: string;
  timestamp: string;
  actions: {
    label: string;
    variant: "primary" | "secondary" | "danger";
  }[];
}

const demoIssues: Issue[] = [
  // Critical
  {
    id: "1",
    severity: "critical",
    title: "Policy Violation",
    description: "Agent provided incorrect refund information",
    conversationId: "conv_12345",
    customerName: "John D.",
    timestamp: "Jan 15, 3:22 PM",
    actions: [
      { label: "View Conversation", variant: "primary" },
      { label: "Mark Resolved", variant: "secondary" },
      { label: "Assign", variant: "secondary" },
    ],
  },
  {
    id: "2",
    severity: "critical",
    title: "Data Leak Risk",
    description: "Customer PII exposed in transcript",
    conversationId: "conv_12350",
    customerName: "Sarah K.",
    timestamp: "Jan 15, 2:10 PM",
    actions: [
      { label: "View Conversation", variant: "primary" },
      { label: "Escalate", variant: "danger" },
      { label: "Assign", variant: "secondary" },
    ],
  },
  {
    id: "3",
    severity: "critical",
    title: "Unauthorized Discount",
    description: "Agent applied 50% discount without approval",
    conversationId: "conv_12355",
    customerName: "Mike L.",
    timestamp: "Jan 15, 1:45 PM",
    actions: [
      { label: "View Conversation", variant: "primary" },
      { label: "Mark Resolved", variant: "secondary" },
      { label: "Assign", variant: "secondary" },
    ],
  },
  // Warning
  {
    id: "4",
    severity: "warning",
    title: "Low Confidence Response",
    description: "Agent confidence below threshold (42%)",
    conversationId: "conv_12346",
    customerName: "Sarah M.",
    timestamp: "Jan 15, 2:45 PM",
    actions: [
      { label: "View Conversation", variant: "primary" },
      { label: "Add to Knowledge", variant: "secondary" },
      { label: "Dismiss", variant: "secondary" },
    ],
  },
  {
    id: "5",
    severity: "warning",
    title: "Escalation Requested",
    description: "Customer requested human agent",
    conversationId: "conv_12347",
    customerName: "Mike R.",
    timestamp: "Jan 15, 1:30 PM",
    actions: [
      { label: "View Conversation", variant: "primary" },
      { label: "Add to Knowledge", variant: "secondary" },
      { label: "Dismiss", variant: "secondary" },
    ],
  },
  {
    id: "6",
    severity: "warning",
    title: "Long Resolution Time",
    description: "Conversation exceeded 15 minute threshold",
    conversationId: "conv_12348",
    customerName: "Lisa K.",
    timestamp: "Jan 15, 12:15 PM",
    actions: [
      { label: "View Conversation", variant: "primary" },
      { label: "Add to Knowledge", variant: "secondary" },
      { label: "Dismiss", variant: "secondary" },
    ],
  },
];

const tabs = [
  { key: "critical" as Severity, label: "Critical", count: 3, color: "red" },
  { key: "warning" as Severity, label: "Warning", count: 12, color: "yellow" },
  { key: "info" as Severity, label: "Info", count: 28, color: "blue" },
  { key: "resolved" as Severity, label: "Resolved", count: 0, color: "green" },
];

export default function IssuesPage() {
  const [activeTab, setActiveTab] = useState<Severity>("critical");

  const filteredIssues = demoIssues.filter(
    (issue) => issue.severity === activeTab
  );

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return "bg-[var(--error)]";
      case "warning":
        return "bg-[var(--warning)]";
      case "info":
        return "bg-[var(--accent)]";
      case "resolved":
        return "bg-[var(--success)]";
      default:
        return "bg-[var(--text-muted)]";
    }
  };

  const getButtonStyles = (variant: "primary" | "secondary" | "danger") => {
    switch (variant) {
      case "primary":
        return "bg-[var(--primary)] hover:bg-[var(--primary)] text-white";
      case "secondary":
        return "bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-secondary)]";
      case "danger":
        return "bg-[var(--error)] hover:bg-[var(--error)] text-white";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-sunken)] px-3 py-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Issues</h1>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-hover)] border border-[var(--border)]">
            <Flag className="h-4 w-4" />
            Create Rule
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-hover)] border border-[var(--border)]">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="mb-6 flex gap-2 border-b border-[var(--border)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const dotColor =
            tab.color === "red"
              ? "bg-[var(--error)]"
              : tab.color === "yellow"
              ? "bg-[var(--warning)]"
              : tab.color === "blue"
              ? "bg-[var(--accent)]"
              : "bg-[var(--success)]";

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${dotColor}`} />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-[var(--success-bg,var(--bg-hover))] text-[var(--primary)]"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="rounded-lg bg-[var(--bg-surface)] p-12 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
            <p className="mt-4 text-lg font-medium text-[var(--text-primary)]">
              No {activeTab} issues
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              All issues in this category have been resolved.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="rounded-lg bg-[var(--bg-surface)] p-6 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Severity Indicator */}
                <div className="flex-shrink-0 pt-1">
                  <span
                    className={`h-3 w-3 rounded-full ${getSeverityColor(
                      issue.severity
                    )}`}
                  />
                </div>

                {/* Issue Content */}
                <div className="flex-1">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {issue.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {issue.description}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      Conv{" "}
                      <span className="font-mono text-[var(--text-secondary)]">
                        #{issue.conversationId}
                      </span>
                    </span>
                    <span>•</span>
                    <span>{issue.customerName}</span>
                    <span>•</span>
                    <span>{issue.timestamp}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {issue.actions.map((action, index) => (
                      <button
                        key={index}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${getButtonStyles(
                          action.variant
                        )}`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
