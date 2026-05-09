"use client";

import { useState } from "react";
import {
  GitBranch,
  GitMerge,
  Plus,
  User,
  Clock,
  Trash2,
  Eye,
  Check,
  MessageSquare,
  RotateCcw,
  Tag,
} from "lucide-react";

export default function WorkspacesPage() {
  const [workspaces] = useState([
    {
      id: 1,
      name: "khalifa/holiday-promo-updates",
      changes: 3,
      status: "active",
      description: "Adding holiday promotion handling to order journey",
      created: "2 hours ago",
      author: "khalifa",
    },
    {
      id: 2,
      name: "khalifa/arabic-voice-improvements",
      changes: 1,
      status: "active",
      description: "Improving Kuwaiti dialect recognition",
      created: "1 day ago",
      author: "khalifa",
    },
  ]);

  const [teamWorkspaces] = useState([
    {
      id: 3,
      name: "ahmed/billing-journey",
      status: "ready",
      description: "New billing inquiry journey",
      created: "3 days ago",
      author: "Ahmed S.",
    },
    {
      id: 4,
      name: "fatima/templates-update",
      status: "in-progress",
      description: "Updating message templates",
      created: "1 day ago",
      author: "Fatima H.",
    },
  ]);

  const [snapshots] = useState([
    {
      id: 1,
      version: "v2.4.1",
      current: true,
      deployed: "Jan 15, 2:00 PM",
      changes: "Holiday shipping updates, bug fixes",
    },
    {
      id: 2,
      version: "v2.4.0",
      current: false,
      deployed: "Jan 10, 4:30 PM",
      changes: "New returns journey, voice improvements",
    },
    {
      id: 3,
      version: "v2.3.5",
      current: false,
      deployed: "Jan 3, 11:00 AM",
      changes: "Performance optimizations",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[var(--primary)]";
      case "ready":
        return "bg-[var(--accent)]";
      case "in-progress":
        return "bg-[var(--warning)]";
      default:
        return "bg-[var(--text-muted)]";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "ready":
        return "Ready to merge";
      case "in-progress":
        return "In progress";
      default:
        return status;
    }
  };

  return (
    <div className="px-3 py-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Workspaces</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Manage and collaborate on AI agent changes
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-colors">
          <Plus className="w-4 h-4" />
          New Workspace
        </button>
      </div>

      {/* Your Workspaces */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Your Workspaces
        </h2>
        <div className="space-y-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--border)] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {workspace.name}
                    </h3>
                    <span className="flex items-center gap-1.5 text-sm text-[var(--success)] bg-[var(--success-bg)] px-2 py-1 rounded">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(workspace.status)}`} />
                      {workspace.changes} {workspace.changes === 1 ? "change" : "changes"}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] mb-3">{workspace.description}</p>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Created {workspace.created}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium">
                    Open
                  </button>
                  <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium flex items-center gap-1.5">
                    <GitMerge className="w-4 h-4" />
                    Merge to Main
                  </button>
                  <button className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Workspaces */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Team Workspaces
        </h2>
        <div className="space-y-4">
          {teamWorkspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--border)] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {workspace.name}
                    </h3>
                    <span className="flex items-center gap-1.5 text-sm px-2 py-1 rounded bg-[var(--bg-sunken)]">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(workspace.status)}`} />
                      {getStatusText(workspace.status)}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] mb-3">{workspace.description}</p>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Created {workspace.created}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      by {workspace.author}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm font-medium flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                  <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button className="px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm font-medium flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    Request Changes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Production Snapshots */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Production Snapshots
        </h2>
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className={`bg-[var(--bg-surface)] border rounded-lg p-5 ${
                snapshot.current
                  ? "border-[var(--accent)] bg-[var(--info-bg)]"
                  : "border-[var(--border)] hover:border-[var(--border)]"
              } transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {snapshot.version}
                      {snapshot.current && (
                        <span className="ml-2 text-sm font-medium text-[var(--info)] bg-[var(--info-bg)] px-2 py-0.5 rounded">
                          Current Production
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Deployed: {snapshot.deployed}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)]">
                    <span className="font-medium">Changes:</span> {snapshot.changes}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm font-medium flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    View Changes
                  </button>
                  {snapshot.current ? (
                    <button className="px-4 py-2 border border-[var(--error)] text-[var(--error)] rounded-lg hover:bg-[var(--error-bg)] transition-colors text-sm font-medium flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" />
                      Rollback
                    </button>
                  ) : (
                    <button className="px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm font-medium flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
