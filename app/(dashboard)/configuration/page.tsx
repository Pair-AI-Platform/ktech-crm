"use client";

import { useState } from "react";
import { Upload, Save, X } from "lucide-react";

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState("brand");
  const [agentName, setAgentName] = useState("Pair Assistant");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi! I'm here to help. How can I assist you today?"
  );
  const [companyDescription, setCompanyDescription] = useState(
    "Pair AI is a Kuwaiti company providing AI-powered solutions for businesses across the GCC region."
  );
  const [personality, setPersonality] = useState("friendly");
  const [formality, setFormality] = useState(60);
  const [emojiUse, setEmojiUse] = useState(30);
  const [verbosity, setVerbosity] = useState(45);
  const [primaryLanguage, setPrimaryLanguage] = useState("Arabic (Kuwaiti)");
  const [primaryColor, setPrimaryColor] = useState("#22C55E");
  const [widgetPosition, setWidgetPosition] = useState("bottom-right");
  const [darkMode, setDarkMode] = useState(false);
  const [customCSS, setCustomCSS] = useState("");

  const tabs = [
    { id: "brand", label: "Brand" },
    { id: "voice", label: "Voice & Tone" },
    { id: "appearance", label: "Appearance" },
    { id: "channels", label: "Channels" },
    { id: "security", label: "Security" },
    { id: "advanced", label: "Advanced" },
  ];

  const businessHours = [
    { day: "Monday", enabled: true },
    { day: "Tuesday", enabled: true },
    { day: "Wednesday", enabled: true },
    { day: "Thursday", enabled: true },
    { day: "Friday", enabled: false },
    { day: "Saturday", enabled: false },
    { day: "Sunday", enabled: true },
  ];

  const supportedLanguages = ["English", "Arabic (MSA)", "Arabic (Kuwaiti)"];

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
          <p className="text-gray-600 mt-2">
            Customize your AI assistant&apos;s behavior and appearance
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Brand Tab */}
            {activeTab === "brand" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Avatar
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Upload Image
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Description
                  </label>
                  <textarea
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Business Hours
                  </label>
                  <div className="space-y-3">
                    {businessHours.map((item) => (
                      <div
                        key={item.day}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700">{item.day}</span>
                        <button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            item.enabled ? "bg-green-500" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Voice & Tone Tab */}
            {activeTab === "voice" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Personality
                  </label>
                  <div className="space-y-2">
                    {["Professional", "Friendly", "Casual", "Custom"].map(
                      (option) => (
                        <label key={option} className="flex items-center">
                          <input
                            type="radio"
                            name="personality"
                            value={option.toLowerCase()}
                            checked={personality === option.toLowerCase()}
                            onChange={(e) => setPersonality(e.target.value)}
                            className="w-4 h-4 text-green-500 focus:ring-green-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {option}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formality: {formality}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formality}
                    onChange={(e) => setFormality(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji Use: {emojiUse}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={emojiUse}
                    onChange={(e) => setEmojiUse(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verbosity: {verbosity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={verbosity}
                    onChange={(e) => setVerbosity(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Language
                  </label>
                  <select
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option>Arabic (Kuwaiti)</option>
                    <option>English</option>
                    <option>Arabic (MSA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supported Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {supportedLanguages.map((lang) => (
                      <span
                        key={lang}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{lang}</span>
                        <X className="w-3 h-3 cursor-pointer" />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Upload Logo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Widget Position
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "bottom-right", label: "Bottom Right" },
                      { value: "bottom-left", label: "Bottom Left" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="widgetPosition"
                          value={option.value}
                          checked={widgetPosition === option.value}
                          onChange={(e) => setWidgetPosition(e.target.value)}
                          className="w-4 h-4 text-green-500 focus:ring-green-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Dark Mode
                    </span>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        darkMode ? "bg-green-500" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          darkMode ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom CSS
                  </label>
                  <textarea
                    value={customCSS}
                    onChange={(e) => setCustomCSS(e.target.value)}
                    rows={6}
                    placeholder="/* Add your custom CSS here */"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Channels Tab */}
            {activeTab === "channels" && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Configure your communication channels and integrations.
                </p>
                <div className="text-center py-12 text-gray-400">
                  Channels configuration coming soon...
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Manage security settings and access controls.
                </p>
                <div className="text-center py-12 text-gray-400">
                  Security settings coming soon...
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === "advanced" && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Advanced configuration options for power users.
                </p>
                <div className="text-center py-12 text-gray-400">
                  Advanced settings coming soon...
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
