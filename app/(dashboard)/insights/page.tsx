"use client";

import React from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Tag,
  BarChart2,
  Flag,
  Mic,
  Send,
  ChevronDown,
} from "lucide-react";

// Demo data for the area chart
const conversationsData = [
  { day: "Mon", value: 12420 },
  { day: "Tue", value: 11580 },
  { day: "Wed", value: 13200 },
  { day: "Thu", value: 12890 },
  { day: "Fri", value: 14320 },
  { day: "Sat", value: 11890 },
  { day: "Sun", value: 12112 },
];

// Demo data for top topics
const topTopics = [
  {
    topic: "New return policy",
    count: 5560,
    trend: 19,
    sparklineData: [30, 40, 35, 50, 49, 60, 70],
  },
  {
    topic: "Shipping delays",
    count: 8728,
    trend: -15,
    sparklineData: [80, 75, 70, 65, 60, 58, 55],
  },
  {
    topic: "Price matching",
    count: 6579,
    trend: 11,
    sparklineData: [40, 42, 38, 45, 48, 50, 52],
  },
  {
    topic: "Restock alerts",
    count: 5999,
    trend: 22,
    sparklineData: [25, 30, 35, 40, 48, 55, 62],
  },
  {
    topic: "Loyalty program",
    count: 2255,
    trend: 12,
    sparklineData: [20, 22, 25, 28, 30, 32, 35],
  },
];

// Sparkline component — with hover tooltip
const Sparkline = ({ data }: { data: number[] }) => {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 20;

  const coords = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y, value };
  });
  const points = coords.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="relative inline-block" style={{ width, height: height + 4 }}>
      <svg
        width={width}
        height={height}
        className="inline-block"
        onMouseLeave={() => setHovered(null)}
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-[var(--text-muted)]"
        />
        {coords.map((p, i) => (
          <rect
            key={i}
            x={i === 0 ? 0 : (coords[i - 1].x + p.x) / 2}
            y={0}
            width={
              i === 0 || i === coords.length - 1
                ? width / Math.max(data.length - 1, 1) / 2 + 4
                : (coords[Math.min(i + 1, coords.length - 1)].x -
                    coords[Math.max(i - 1, 0)].x) /
                  2
            }
            height={height}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
          />
        ))}
        {hovered !== null && (
          <circle
            cx={coords[hovered].x}
            cy={coords[hovered].y}
            r={2.5}
            fill="currentColor"
            stroke="white"
            strokeWidth={1.5}
            className="text-[var(--text-muted)]"
          />
        )}
      </svg>
      {hovered !== null && (
        <div
          className="absolute z-50 pointer-events-none px-1.5 py-0.5 rounded text-[9px] font-bold shadow-lg whitespace-nowrap"
          style={{
            left: coords[hovered].x,
            bottom: height - coords[hovered].y + 6,
            transform: "translateX(-50%)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          {coords[hovered].value.toLocaleString()}
        </div>
      )}
    </div>
  );
};

// Circular Progress Ring
const CircularProgress = ({ percentage }: { percentage: number }) => {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--gray-200))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-semibold">{percentage}%</span>
      </div>
    </div>
  );
};

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-sunken)] pb-32">
      {/* AI Query Header */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border)] py-6 pr-6 pl-16 lg:px-6 text-[18px] font-medium">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-[var(--text-primary)]">
            What are the main reasons for higher customer satisfaction scores?
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Generated at {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
        {/* Summary Section */}
        <div className="mb-8">
          <h2
            className="text-[var(--text-primary)] mb-3"
            style={{ fontSize: "14px", fontWeight: 600 }}
          >
            Summary
          </h2>
          <p
            className="text-[var(--text-muted)]"
            style={{ fontSize: "14px", lineHeight: 1.6 }}
          >
            Customer satisfaction is rising this week, mainly due to a new
            return policy and a decrease in shipping delays.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Total Conversations Card */}
          <div
            className="bg-[var(--bg-surface)] rounded-xl p-6"
            style={{
              border: "1px solid rgb(var(--gray-200))",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <div className="mb-4">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                Total Conversations
              </h3>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-[var(--text-primary)]">
                  88,412
                </span>
                <span className="flex items-center text-[var(--success)] text-sm font-medium">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +138%
                </span>
              </div>
            </div>
            <div style={{ height: "150px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={conversationsData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="rgb(var(--primary))"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="rgb(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid rgb(var(--gray-200))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="rgb(var(--primary))"
                    fill="url(#colorValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Topics Card */}
          <div
            className="bg-[var(--bg-surface)] rounded-xl p-6"
            style={{
              border: "1px solid rgb(var(--gray-200))",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">Top Topics</h3>
              <button className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Last 24h
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {topTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {topic.topic}
                      </span>
                      <span
                        className={`flex items-center text-xs font-medium ${
                          topic.trend > 0 ? "text-[var(--success)]" : "text-[var(--error)]"
                        }`}
                      >
                        {topic.trend > 0 ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        )}
                        {Math.abs(topic.trend)}%
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {topic.count.toLocaleString()} mentions
                    </span>
                  </div>
                  <Sparkline data={topic.sparklineData} />
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Rate Card */}
          <div
            className="bg-[var(--bg-surface)] rounded-xl p-6"
            style={{
              border: "1px solid rgb(var(--gray-200))",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-6">
              Resolution Rate
            </h3>
            <div className="flex flex-col items-center">
              <CircularProgress percentage={76.4} />
              <div className="mt-4 flex items-center gap-2">
                <span className="flex items-center text-[var(--success)] text-sm font-medium">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +8.2%
                </span>
                <span className="text-sm text-[var(--text-muted)]">from last week</span>
              </div>
            </div>
          </div>

          {/* Sentiment Card */}
          <div
            className="bg-[var(--bg-surface)] rounded-xl p-6"
            style={{
              border: "1px solid rgb(var(--gray-200))",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-6">
              Sentiment Distribution
            </h3>
            <div className="space-y-6">
              {/* Stacked Bar */}
              <div className="relative h-12 flex rounded-lg overflow-hidden">
                <div
                  className="bg-[var(--primary)] flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: "68%" }}
                >
                  68%
                </div>
                <div
                  className="bg-[var(--text-muted)] flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: "24%" }}
                >
                  24%
                </div>
                <div
                  className="bg-[var(--error)] flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: "8%" }}
                >
                  8%
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--primary)]"></div>
                    <span className="text-sm text-[var(--text-secondary)]">
                      Positive
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--text-muted)]"></div>
                    <span className="text-sm text-[var(--text-secondary)]">Neutral</span>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">24%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--error)]"></div>
                    <span className="text-sm text-[var(--text-secondary)]">
                      Negative
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Follow-Up Input Bar — sits above the mobile bottom nav on phones */}
      <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 z-30 bg-[var(--bg-surface)] border-t border-[var(--border)] px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[var(--bg-surface)] rounded-xl flex items-center gap-2 sm:gap-3 border border-[var(--border)] px-3 py-2 sm:py-3">
            <input
              type="text"
              placeholder="Ask a follow-up question..."
              className="flex-1 min-w-0 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-transparent"
            />
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                <Clock className="w-4 h-4" />
                <span>7d</span>
              </button>
              <button className="hidden sm:block p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                <Tag className="w-4 h-4" />
              </button>
              <button className="hidden sm:block p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                <BarChart2 className="w-4 h-4" />
              </button>
              <button className="hidden sm:block p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                <Flag className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                <Mic className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors shrink-0">
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
