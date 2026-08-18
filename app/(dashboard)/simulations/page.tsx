"use client";


import {
  Plus,
  Play,
  FlaskConical,
  Eye,
  Edit,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Mic,
} from "lucide-react";

export default function SimulationsPage() {
  const testSuites = [
    {
      id: 1,
      name: "Order Journey Tests",
      passed: 45,
      total: 47,
      description: "Tests for order tracking",
      lastRun: "2 hours ago",
      icon: FlaskConical,
      color: "blue",
    },
    {
      id: 2,
      name: "Returns Journey Tests",
      passed: 32,
      total: 32,
      description: "All passing",
      lastRun: "3 hours ago",
      icon: FlaskConical,
      color: "green",
    },
    {
      id: 3,
      name: "Edge Cases & Guardrails",
      passed: 18,
      total: 23,
      description: "5 failures",
      lastRun: "1 hour ago",
      icon: FlaskConical,
      color: "yellow",
    },
    {
      id: 4,
      name: "Billing Support Tests",
      passed: 28,
      total: 30,
      description: "2 minor failures",
      lastRun: "5 hours ago",
      icon: FlaskConical,
      color: "blue",
    },
  ];

  const voiceSimulations = [
    {
      id: 1,
      name: "Voice Quality Tests",
      passed: 15,
      total: 15,
      description: "All audio quality checks passing",
      lastRun: "4 hours ago",
      icon: Mic,
      color: "purple",
    },
    {
      id: 2,
      name: "Dialect Recognition",
      passed: 12,
      total: 14,
      description: "2 dialect edge cases",
      lastRun: "6 hours ago",
      icon: Mic,
      color: "purple",
    },
  ];

  const getStatusIcon = (passed: number, total: number) => {
    const percentage = (passed / total) * 100;
    if (percentage === 100) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const getProgressBarColor = (passed: number, total: number) => {
    const percentage = (passed / total) * 100;
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "green":
        return "bg-green-100 text-green-600";
      case "yellow":
        return "bg-yellow-100 text-yellow-600";
      case "purple":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const renderTestSuiteCard = (suite: typeof testSuites[number]) => {
    const IconComponent = suite.icon;
    const percentage = (suite.passed / suite.total) * 100;

    return (
      <div
        key={suite.id}
        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            <div
              className={`w-12 h-12 rounded-lg ${getIconColor(
                suite.color
              )} flex items-center justify-center`}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {suite.name}
                </h3>
                {getStatusIcon(suite.passed, suite.total)}
              </div>
              <p className="text-sm text-gray-600 mb-2">{suite.description}</p>
              <p className="text-xs text-gray-500">Last run: {suite.lastRun}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {suite.passed}/{suite.total} Passed
            </span>
            <span className="text-sm font-medium text-gray-700">
              {percentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor(
                suite.passed,
                suite.total
              )} transition-all`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 flex items-center space-x-1">
            <Play className="w-3.5 h-3.5" />
            <span>Run Tests</span>
          </button>
          <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-1">
            <Eye className="w-3.5 h-3.5" />
            <span>View Results</span>
          </button>
          <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-1">
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 pl-16 lg:pl-0">
            <h1 className="text-3xl font-bold text-gray-900">Simulations</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Run All</span>
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Simulation</span>
              </button>
            </div>
          </div>
          <p className="text-gray-600">
            Test and validate your AI assistant&apos;s performance
          </p>
        </div>

        {/* Test Suites Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Test Suites
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {testSuites.map((suite) => renderTestSuiteCard(suite))}
          </div>
        </div>

        {/* Voice Simulations Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Voice Simulations
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {voiceSimulations.map((suite) => renderTestSuiteCard(suite))}
          </div>
        </div>
      </div>
    </div>
  );
}
