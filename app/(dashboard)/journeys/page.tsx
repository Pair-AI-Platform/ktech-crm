"use client";

import { useState } from "react";
import {
  Plus,
  Upload,
  Search,
  Filter,
  Package,
  RotateCcw,
  CreditCard,
  Receipt,
  HelpCircle,
  MoreHorizontal,
  Edit,
  FlaskConical,
  Copy,
  Play,
} from "lucide-react";

type JourneyStatus = "active" | "draft" | "paused";

interface Journey {
  id: string;
  name: string;
  status: JourneyStatus;
  description: string;
  lastEdited: string;
  conversationsToday?: number;
  icon: "package" | "rotate" | "card" | "receipt" | "help";
}

const demoJourneys: Journey[] = [
  {
    id: "1",
    name: "Order Tracking",
    status: "active",
    description: "Help customers track their orders and provide delivery updates",
    lastEdited: "2 hours ago",
    conversationsToday: 1234,
    icon: "package",
  },
  {
    id: "2",
    name: "Returns & Exchanges",
    status: "active",
    description: "Process return requests and manage exchange workflows",
    lastEdited: "1 day ago",
    conversationsToday: 856,
    icon: "rotate",
  },
  {
    id: "3",
    name: "Subscription Management",
    status: "draft",
    description: "Handle subscription changes, upgrades, and cancellations",
    lastEdited: "3 days ago",
    icon: "card",
  },
  {
    id: "4",
    name: "Billing Support",
    status: "active",
    description: "Answer billing questions and process payments",
    lastEdited: "5 hours ago",
    conversationsToday: 543,
    icon: "receipt",
  },
  {
    id: "5",
    name: "FAQ Handler",
    status: "paused",
    description: "Route common questions to knowledge base",
    lastEdited: "1 week ago",
    icon: "help",
  },
];

export default function JourneysPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusBadge = (status: JourneyStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-bg,var(--bg-hover))] px-2.5 py-0.5 text-xs font-medium text-[var(--success)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            Active
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-sunken)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
            Draft
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--warning)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
            Paused
          </span>
        );
    }
  };

  const getJourneyIcon = (iconType: Journey["icon"]) => {
    const iconClass = "h-5 w-5 text-[var(--text-secondary)]";
    switch (iconType) {
      case "package":
        return <Package className={iconClass} />;
      case "rotate":
        return <RotateCcw className={iconClass} />;
      case "card":
        return <CreditCard className={iconClass} />;
      case "receipt":
        return <Receipt className={iconClass} />;
      case "help":
        return <HelpCircle className={iconClass} />;
    }
  };

  const getActionButtons = (journey: Journey) => {
    if (journey.status === "draft") {
      return (
        <>
          <button className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <FlaskConical className="h-4 w-4" />
            Test
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--primary)] transition-colors">
            <Play className="h-4 w-4" />
            Publish
          </button>
          <button className="rounded-lg bg-[var(--bg-hover)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </>
      );
    } else if (journey.status === "paused") {
      return (
        <>
          <button className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--primary)] transition-colors">
            <Play className="h-4 w-4" />
            Resume
          </button>
          <button className="rounded-lg bg-[var(--bg-hover)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </>
      );
    } else {
      return (
        <>
          <button className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <FlaskConical className="h-4 w-4" />
            Test
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          <button className="rounded-lg bg-[var(--bg-hover)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </>
      );
    }
  };

  const filteredJourneys = demoJourneys.filter((journey) =>
    journey.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg-sunken)] px-3 py-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] pl-16 lg:pl-0">Journeys</h1>
        <div className="flex gap-3 flex-wrap">
          <button className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-hover)] border border-[var(--border)]">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--primary)]">
            <Plus className="h-4 w-4" />
            New Journey
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search journeys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-2 pl-10 pr-4 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-hover)] border border-[var(--border)]">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Journey Cards */}
      <div className="space-y-4">
        {filteredJourneys.map((journey) => (
          <div
            key={journey.id}
            className="rounded-lg bg-[var(--bg-surface)] p-6 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* Left Section */}
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 rounded-lg bg-gray-100 p-3">
                  {getJourneyIcon(journey.icon)}
                </div>

                {/* Content */}
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {journey.name}
                    </h3>
                    {getStatusBadge(journey.status)}
                  </div>
                  <p className="mb-3 text-sm text-gray-600">
                    {journey.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Last edited: {journey.lastEdited}</span>
                    {journey.conversationsToday !== undefined ? (
                      <>
                        <span>•</span>
                        <span className="font-medium text-gray-700">
                          {journey.conversationsToday.toLocaleString()}{" "}
                          conversations today
                        </span>
                      </>
                    ) : (
                      <>
                        <span>•</span>
                        <span className="text-gray-500">Not published</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-shrink-0 gap-2">
                {getActionButtons(journey)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredJourneys.length === 0 && (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-lg font-medium text-gray-900">
            No journeys found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or create a new journey.
          </p>
        </div>
      )}
    </div>
  );
}
