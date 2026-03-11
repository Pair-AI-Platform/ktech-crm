"use client";

import { useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Globe,
  FileText,
  Pencil,
  Eye,
  Settings,
  Trash2,
  MoreVertical,
} from "lucide-react";

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const sources = [
    {
      id: 1,
      name: "Help Center",
      status: "Connected",
      syncStatus: "Synced",
      url: "https://help.pairai.com",
      count: 156,
      countLabel: "articles",
      lastSynced: "2 hours ago",
      icon: Globe,
      color: "blue",
    },
    {
      id: 2,
      name: "Product Documentation",
      status: "Connected",
      syncStatus: "Synced",
      url: "Google Drive folder",
      count: 42,
      countLabel: "documents",
      lastSynced: "1 day ago",
      icon: FileText,
      color: "purple",
    },
    {
      id: 3,
      name: "Custom Articles",
      status: "Active",
      syncStatus: null,
      url: "Manually created",
      count: 28,
      countLabel: "articles",
      lastSynced: null,
      icon: Pencil,
      color: "green",
    },
  ];

  const knowledgeGaps = [
    {
      id: 1,
      topic: "Holiday shipping cutoff dates",
      mentions: 12,
    },
    {
      id: 2,
      topic: "Gift wrapping options",
      mentions: 8,
    },
    {
      id: 3,
      topic: "International return policy",
      mentions: 5,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Connected":
        return "bg-[var(--success-bg)] text-[var(--success)]";
      case "Active":
        return "bg-[var(--info-bg)] text-[var(--info)]";
      default:
        return "bg-[var(--bg-hover)] text-[var(--text-secondary)]";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-[var(--info-bg)] text-[var(--info)]";
      case "purple":
        return "bg-[var(--accent)] text-[var(--accent)]";
      case "green":
        return "bg-[var(--success-bg)] text-[var(--success)]";
      default:
        return "bg-[var(--bg-hover)] text-[var(--text-secondary)]";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-sunken)] px-3 py-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Knowledge</h1>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Sync All</span>
              </button>
              <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Source</span>
              </button>
            </div>
          </div>
          <p className="text-[var(--text-secondary)]">
            Manage your knowledge base and training sources
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-[var(--bg-surface)] rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search knowledge sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4" />
              <span>Sort</span>
            </button>
          </div>
        </div>

        {/* Sources Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Sources</h2>
          <div className="grid grid-cols-1 gap-4">
            {sources.map((source) => {
              const IconComponent = source.icon;
              return (
                <div
                  key={source.id}
                  className="bg-[var(--bg-surface)] rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-lg ${getIconColor(
                          source.color
                        )} flex items-center justify-center`}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            {source.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              source.status
                            )}`}
                          >
                            {source.status}
                          </span>
                          {source.syncStatus && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                              {source.syncStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-2">
                          {source.url}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-[var(--text-muted)]">
                          <span>
                            {source.count} {source.countLabel}
                          </span>
                          {source.lastSynced && (
                            <span>Last synced: {source.lastSynced}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <button className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Articles</span>
                    </button>
                    {source.syncStatus && (
                      <button className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] flex items-center space-x-1">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sync Now</span>
                      </button>
                    )}
                    <button className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] flex items-center space-x-1">
                      <Settings className="w-3.5 h-3.5" />
                      <span>Settings</span>
                    </button>
                    <button className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--error)] rounded-lg text-xs font-medium text-[var(--error)] hover:bg-[var(--error-bg)] flex items-center space-x-1">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Knowledge Gaps Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Knowledge Gaps
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">AI Detected</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {knowledgeGaps.map((gap) => (
              <div
                key={gap.id}
                className="bg-[var(--bg-surface)] rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-[var(--text-primary)] mb-1">
                      {gap.topic}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {gap.mentions} mentions in conversations
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:opacity-90">
                      Create Article
                    </button>
                    <button className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
