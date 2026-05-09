"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  MessageSquare,
  Phone,
  Mail,
  Smartphone,
  Star,
  ChevronDown,
  Flag,
  Download,
  Share2,
  Clock,
  CircleDot,
} from "lucide-react";

type Channel = "Chat" | "Voice" | "Email" | "WhatsApp" | "SMS";
type Status = "Resolved" | "In Progress" | "Escalated" | "Pending";
type Sentiment = "Positive" | "Neutral" | "Negative";

interface Message {
  id: string;
  sender: "customer" | "agent";
  content: string;
  timestamp: string;
  showReasoning?: boolean;
  reasoning?: string;
}

interface Conversation {
  id: string;
  customerName: string;
  topic: string;
  time: string;
  channel: Channel;
  status: Status;
  sentiment: Sentiment;
  startedAt: string;
  duration: string;
  csat: number;
  messages: Message[];
}

const demoConversations: Conversation[] = [
  {
    id: "1",
    customerName: "John D.",
    topic: "Order tracking",
    time: "2:34 PM",
    channel: "WhatsApp",
    status: "Resolved",
    sentiment: "Positive",
    startedAt: "2:30 PM",
    duration: "4 min",
    csat: 5,
    messages: [
      {
        id: "m1",
        sender: "customer",
        content: "Hi, I need help tracking my order #12345",
        timestamp: "2:30 PM",
      },
      {
        id: "m2",
        sender: "agent",
        content:
          "Of course! Let me look that up for you. Your order #12345 is currently in transit and expected to arrive tomorrow by 5 PM.",
        timestamp: "2:31 PM",
        showReasoning: false,
        reasoning:
          "I searched the order database for order #12345 and found the current shipping status. The tracking information shows it's out for delivery with an estimated arrival time.",
      },
      {
        id: "m3",
        sender: "customer",
        content: "That's great, thanks! Can I change the delivery address?",
        timestamp: "2:32 PM",
      },
      {
        id: "m4",
        sender: "agent",
        content:
          "I can help with that! I've updated your delivery address. You'll receive a confirmation email shortly.",
        timestamp: "2:33 PM",
        showReasoning: false,
        reasoning:
          "I verified the order is still eligible for address changes (not yet out for final delivery), updated the shipping address in the system, and triggered a confirmation email to the customer.",
      },
      {
        id: "m5",
        sender: "customer",
        content: "Perfect, thank you!",
        timestamp: "2:34 PM",
      },
    ],
  },
  {
    id: "2",
    customerName: "Sarah M.",
    topic: "Return request",
    time: "1:22 PM",
    channel: "Chat",
    status: "In Progress",
    sentiment: "Neutral",
    startedAt: "1:15 PM",
    duration: "7 min",
    csat: 4,
    messages: [
      {
        id: "m1",
        sender: "customer",
        content: "I'd like to return the shoes I purchased last week.",
        timestamp: "1:15 PM",
      },
      {
        id: "m2",
        sender: "agent",
        content:
          "I can help you with that return. May I have your order number?",
        timestamp: "1:16 PM",
        showReasoning: false,
        reasoning:
          "Standard return procedure requires order number verification to proceed with the return process.",
      },
      {
        id: "m3",
        sender: "customer",
        content: "It's order #67890",
        timestamp: "1:18 PM",
      },
      {
        id: "m4",
        sender: "agent",
        content:
          "Thank you! I've initiated your return. You'll receive a return shipping label via email within the next hour.",
        timestamp: "1:22 PM",
        showReasoning: false,
        reasoning:
          "Verified the order is within the 30-day return window, created a return authorization, and queued the shipping label generation.",
      },
    ],
  },
  {
    id: "3",
    customerName: "Mike R.",
    topic: "Billing question",
    time: "12:45 PM",
    channel: "Voice",
    status: "Escalated",
    sentiment: "Negative",
    startedAt: "12:40 PM",
    duration: "5 min",
    csat: 2,
    messages: [
      {
        id: "m1",
        sender: "customer",
        content: "I was charged twice for my subscription this month!",
        timestamp: "12:40 PM",
      },
      {
        id: "m2",
        sender: "agent",
        content:
          "I sincerely apologize for the inconvenience. Let me check your billing history right away.",
        timestamp: "12:41 PM",
        showReasoning: false,
        reasoning:
          "Customer is frustrated about duplicate charges. Priority is to acknowledge the issue and investigate immediately.",
      },
      {
        id: "m3",
        sender: "agent",
        content:
          "I can see the duplicate charge. I'm escalating this to our billing team to process an immediate refund. You should see it within 3-5 business days.",
        timestamp: "12:45 PM",
        showReasoning: false,
        reasoning:
          "Confirmed duplicate transaction in the system. This requires billing team approval for refunds, so escalating with high priority flag.",
      },
    ],
  },
  {
    id: "4",
    customerName: "Lisa K.",
    topic: "Product inquiry",
    time: "11:30 AM",
    channel: "Email",
    status: "Resolved",
    sentiment: "Positive",
    startedAt: "11:25 AM",
    duration: "5 min",
    csat: 5,
    messages: [
      {
        id: "m1",
        sender: "customer",
        content:
          "Do you have the blue running shoes in size 8 available in stock?",
        timestamp: "11:25 AM",
      },
      {
        id: "m2",
        sender: "agent",
        content:
          "Yes! We have the blue running shoes in size 8 in stock. Would you like me to reserve a pair for you?",
        timestamp: "11:28 PM",
        showReasoning: false,
        reasoning:
          "Checked inventory system for product SKU matching blue running shoes, size 8. Current stock level is 15 units.",
      },
      {
        id: "m3",
        sender: "customer",
        content: "Yes please, that would be great!",
        timestamp: "11:30 AM",
      },
    ],
  },
  {
    id: "5",
    customerName: "Ahmad S.",
    topic: "Shipping delay",
    time: "10:15 AM",
    channel: "WhatsApp",
    status: "Pending",
    sentiment: "Negative",
    startedAt: "10:10 AM",
    duration: "5 min",
    csat: 3,
    messages: [
      {
        id: "m1",
        sender: "customer",
        content: "My order was supposed to arrive yesterday. Where is it?",
        timestamp: "10:10 AM",
      },
      {
        id: "m2",
        sender: "agent",
        content:
          "I apologize for the delay. Let me check the status of your shipment for you.",
        timestamp: "10:12 AM",
        showReasoning: false,
        reasoning:
          "Customer is concerned about delayed delivery. Need to check tracking information and provide accurate update.",
      },
      {
        id: "m3",
        sender: "agent",
        content:
          "I see there was a weather delay in your area. Your package is now scheduled to arrive today by 8 PM. I've also applied a 10% discount to your next order for the inconvenience.",
        timestamp: "10:15 AM",
        showReasoning: false,
        reasoning:
          "Tracking shows weather-related carrier delay. Applied service recovery discount to maintain customer satisfaction.",
      },
    ],
  },
  {
    id: "6",
    customerName: "Fatima H.",
    topic: "Account help",
    time: "9:00 AM",
    channel: "WhatsApp",
    status: "Resolved",
    sentiment: "Positive",
    startedAt: "8:55 AM",
    duration: "5 min",
    csat: 5,
    messages: [
      {
        id: "m1",
        sender: "customer",
        content: "I can't log into my account. Can you help?",
        timestamp: "8:55 AM",
      },
      {
        id: "m2",
        sender: "agent",
        content:
          "Of course! I can send you a password reset link. Is this the correct email: f***@email.com?",
        timestamp: "8:57 AM",
        showReasoning: false,
        reasoning:
          "Retrieved account information and masked email address for privacy. Preparing to send password reset link.",
      },
      {
        id: "m3",
        sender: "customer",
        content: "Yes, that's correct!",
        timestamp: "8:58 AM",
      },
      {
        id: "m4",
        sender: "agent",
        content:
          "Reset link sent! You should receive it within a few minutes. Let me know if you need anything else.",
        timestamp: "9:00 AM",
        showReasoning: false,
        reasoning:
          "Triggered password reset email through the authentication system. Email should arrive within 2-3 minutes.",
      },
    ],
  },
];

const getChannelIcon = (channel: Channel) => {
  switch (channel) {
    case "Chat":
      return <MessageSquare className="w-4 h-4" />;
    case "Voice":
      return <Phone className="w-4 h-4" />;
    case "Email":
      return <Mail className="w-4 h-4" />;
    case "WhatsApp":
      return <Smartphone className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
};

const getStatusColor = (status: Status) => {
  switch (status) {
    case "Resolved":
      return "bg-green-100 text-green-700 border-green-200";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Escalated":
      return "bg-red-100 text-red-700 border-red-200";
    case "Pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getSentimentColor = (sentiment: Sentiment) => {
  switch (sentiment) {
    case "Positive":
      return "text-green-500";
    case "Neutral":
      return "text-yellow-500";
    case "Negative":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState<
    Conversation
  >(demoConversations[0]);
  const [expandedReasoning, setExpandedReasoning] = useState<
    Record<string, boolean>
  >({});

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Left Panel - Conversation List */}
      <div className="w-full sm:w-[320px] md:w-[380px] border-r border-gray-200 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Conversations
            </h1>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>All Status</option>
              <option>Resolved</option>
              <option>In Progress</option>
              <option>Escalated</option>
              <option>Pending</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>All Channels</option>
              <option>Chat</option>
              <option>Voice</option>
              <option>Email</option>
              <option>WhatsApp</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>Last 7 days</option>
              <option>Last 24 hours</option>
              <option>Last 30 days</option>
              <option>All time</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>All Sentiment</option>
              <option>Positive</option>
              <option>Neutral</option>
              <option>Negative</option>
            </select>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {demoConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                selectedConversation.id === conversation.id
                  ? "bg-primary-50 border-l-4 border-l-primary-600"
                  : "border-l-4 border-l-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedConversation.id === conversation.id
                      ? "bg-primary-100"
                      : "bg-gray-100"
                  }`}
                >
                  {getChannelIcon(conversation.channel)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.customerName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.topic}
                      </p>
                    </div>
                    <CircleDot
                      className={`w-3 h-3 mt-1 flex-shrink-0 ${getSentimentColor(
                        conversation.sentiment
                      )}`}
                      fill="currentColor"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {conversation.time}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">
                      {conversation.channel}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(
                        conversation.status
                      )}`}
                    >
                      {conversation.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Conversation Details */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {selectedConversation.customerName}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  {getChannelIcon(selectedConversation.channel)}
                  <span>{selectedConversation.channel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Started {selectedConversation.startedAt}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Duration: {selectedConversation.duration}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1.5 rounded-full text-sm border ${getStatusColor(
                  selectedConversation.status
                )}`}
              >
                {selectedConversation.status}
              </span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < selectedConversation.csat
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {selectedConversation.messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${
                  message.sender === "customer"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] ${
                    message.sender === "customer" ? "items-end" : "items-start"
                  } flex flex-col gap-1`}
                >
                  <div
                    className={`px-4 py-3 ${
                      message.sender === "customer"
                        ? "bg-primary-600 text-white rounded-[18px_18px_4px_18px]"
                        : "bg-gray-100 text-gray-900 rounded-[18px_18px_18px_4px]"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-500 px-2">
                    {message.timestamp}
                  </span>
                </div>
              </div>

              {/* Reasoning Section */}
              {message.sender === "agent" && message.reasoning && (
                <div className="ml-0 mt-2 max-w-[70%]">
                  <button
                    onClick={() => toggleReasoning(message.id)}
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        expandedReasoning[message.id] ? "rotate-180" : ""
                      }`}
                    />
                    <span>Show reasoning</span>
                  </button>
                  {expandedReasoning[message.id] && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {message.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Flag className="w-4 h-4" />
              Flag
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
