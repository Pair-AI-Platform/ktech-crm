"use client";

import { useState } from "react";
import {
  Headphones,
  Phone,
  Clock,
  User,
  Copy,
  Send,
  Edit,
  Package,
  DollarSign,
  ArrowUpRight,
  Link,
  BookOpen,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export default function LiveAssistPage() {
  const [transcript] = useState([
    {
      id: 1,
      speaker: "customer",
      message: "I've been waiting for my order for two weeks now...",
      timestamp: "4:12",
    },
    {
      id: 2,
      speaker: "agent",
      message: "I'm so sorry to hear that. Let me look into this...",
      timestamp: "4:15",
    },
    {
      id: 3,
      speaker: "customer",
      message: "This is the third time I'm calling about this!",
      timestamp: "4:18",
    },
    {
      id: 4,
      speaker: "agent",
      message:
        "I completely understand your frustration. Let me check the latest status...",
      timestamp: "4:22",
    },
    {
      id: 5,
      speaker: "customer",
      message: "I just want to know when it's arriving",
      timestamp: "4:28",
    },
    {
      id: 6,
      speaker: "agent",
      message:
        "I can see your order #45678 is currently at the distribution center...",
      timestamp: "4:30",
    },
  ]);

  const [agentNotes, setAgentNotes] = useState("");

  const suggestedResponse =
    "I understand you're frustrated with the delayed shipment. Let me check the latest status for order #45678. I can see it's currently at our distribution center and should be delivered within the next 2 business days. Would you like me to arrange priority shipping at no extra cost?";

  const customerContext = {
    previousOrders: 12,
    customerSince: "2022",
    lastContact: "Jan 10 (shipping issue)",
    loyaltyTier: "Gold",
  };

  const quickActions = [
    { label: "Check Order Status", icon: Package },
    { label: "Issue Refund", icon: DollarSign },
    { label: "Escalate to Manager", icon: ArrowUpRight },
    { label: "Send Tracking Link", icon: Link },
  ];

  const relevantKnowledge = [
    "Shipping delay policy",
    "Compensation guidelines",
    "Escalation procedures",
  ];

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Headphones className="w-8 h-8" />
          Live Assist
        </h1>
        <p className="text-gray-600 mt-1">
          AI-powered agent copilot for customer conversations
        </p>
      </div>

      {/* Two Panel Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Panel - Active Conversation */}
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-[calc(100vh-220px)]">
          {/* Conversation Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Active Conversation
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Duration: 4:32</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>Customer: Sarah M.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span>Channel: Phone</span>
              </div>
            </div>
          </div>

          {/* Live Transcript */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                Live Transcript
              </span>
            </div>
            {transcript.map((item) => (
              <div
                key={item.id}
                className={`flex gap-3 ${
                  item.speaker === "customer" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] ${
                    item.speaker === "customer" ? "order-2" : "order-1"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium ${
                        item.speaker === "customer"
                          ? "text-blue-700"
                          : "text-green-700"
                      }`}
                    >
                      {item.speaker === "customer" ? "Customer" : "Agent"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.timestamp}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      item.speaker === "customer"
                        ? "bg-blue-50 text-blue-900"
                        : "bg-green-50 text-green-900"
                    }`}
                  >
                    {item.message}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Agent Notes */}
          <div className="border-t border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Notes
            </label>
            <textarea
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              placeholder="Add notes about this conversation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Right Panel - AI Assist */}
        <div className="space-y-4 h-[calc(100vh-220px)] overflow-y-auto">
          {/* AI Assist Panel Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Assist Panel
            </h2>
          </div>

          {/* Suggested Response */}
          <div className="bg-white border-2 border-purple-300 rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">
                Suggested Response
              </h3>
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                AI Generated
              </span>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed">
              {suggestedResponse}
            </p>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <Send className="w-4 h-4" />
                Send
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>

          {/* Customer Context */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Customer Context</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Previous orders:</span>
                <span className="text-sm font-medium text-gray-900">
                  {customerContext.previousOrders}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Customer since:</span>
                <span className="text-sm font-medium text-gray-900">
                  {customerContext.customerSince}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Last contact:</span>
                <span className="text-sm font-medium text-gray-900">
                  {customerContext.lastContact}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Loyalty tier:</span>
                <span className="text-sm font-semibold text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                  {customerContext.loyaltyTier}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Relevant Knowledge */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">
                Relevant Knowledge
              </h3>
            </div>
            <div className="space-y-2">
              {relevantKnowledge.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className="block px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
