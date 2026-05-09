"use client";

import { useState } from "react";
import {
  ShoppingBag,
  MessageCircle,
  Headphones,
  Building2,
  Landmark,
  CreditCard,
  Phone,
  Hash,
  Users2,
  Calendar,
  Webhook,
  Plus,
  Settings,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function IntegrationsPage() {
  const [connectedIntegrations] = useState([
    {
      id: 1,
      name: "Shopify",
      category: "E-commerce",
      description: "Orders, products, customers",
      status: "connected",
      lastSync: "5 min ago",
      icon: ShoppingBag,
      iconColor: "bg-green-500",
    },
    {
      id: 2,
      name: "WhatsApp Business",
      category: "Messaging",
      description: "Messaging channel",
      status: "connected",
      activeConversations: 234,
      icon: MessageCircle,
      iconColor: "bg-green-600",
    },
    {
      id: 3,
      name: "Zendesk",
      category: "Support",
      description: "Ticket management, escalations",
      status: "connected",
      openTickets: 12,
      icon: Headphones,
      iconColor: "bg-red-500",
    },
  ]);

  const [availableIntegrations] = useState([
    {
      id: 4,
      name: "Salesforce",
      category: "CRM",
      icon: Building2,
      iconColor: "bg-blue-500",
    },
    {
      id: 5,
      name: "HubSpot",
      category: "CRM",
      icon: Landmark,
      iconColor: "bg-orange-500",
    },
    {
      id: 6,
      name: "Stripe",
      category: "Payments",
      icon: CreditCard,
      iconColor: "bg-purple-500",
    },
    {
      id: 7,
      name: "Twilio",
      category: "WhatsApp/Voice",
      icon: Phone,
      iconColor: "bg-red-600",
    },
    {
      id: 8,
      name: "Slack",
      category: "Messaging",
      icon: Hash,
      iconColor: "bg-purple-600",
    },
    {
      id: 9,
      name: "Microsoft Teams",
      category: "Messaging",
      icon: Users2,
      iconColor: "bg-blue-600",
    },
    {
      id: 10,
      name: "Google Calendar",
      category: "Scheduling",
      icon: Calendar,
      iconColor: "bg-blue-400",
    },
    {
      id: 11,
      name: "Custom Webhook",
      category: "Developer",
      icon: Webhook,
      iconColor: "bg-gray-600",
    },
  ]);

  return (
    <div className="px-3 py-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">
            Connect your tools and expand AI capabilities
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Browse Marketplace
        </button>
      </div>

      {/* Connected Integrations */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Connected
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {connectedIntegrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`${integration.iconColor} p-3 rounded-lg text-white`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {integration.name}
                      </h3>
                      <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Connected
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">
                      {integration.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {integration.lastSync && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          Last sync: {integration.lastSync}
                        </span>
                      )}
                      {integration.activeConversations !== undefined && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          Active conversations: {integration.activeConversations}
                        </span>
                      )}
                      {integration.openTickets !== undefined && (
                        <span className="flex items-center gap-1">
                          <Headphones className="w-4 h-4" />
                          Open tickets: {integration.openTickets}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-1.5">
                      <Settings className="w-4 h-4" />
                      Configure
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Test
                    </button>
                    <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Integrations */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available Integrations
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {availableIntegrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.id}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors group cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`${integration.iconColor} p-4 rounded-lg text-white mb-3`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {integration.category}
                  </p>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium group-hover:bg-blue-700">
                    Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
