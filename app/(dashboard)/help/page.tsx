"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  HelpCircle,
  Search,
  Book,
  Users,
  GraduationCap,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Mail,
  Phone,
  Headphones,
  Keyboard,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"

interface FAQ {
  question: string
  answer: string
  category: string
}

interface Guide {
  title: string
  description: string
  icon: typeof Users
  href: string
  badge?: string
}

const GUIDES: Guide[] = [
  {
    title: "Getting Started",
    description: "Learn the basics of the ktech CRM system",
    icon: Zap,
    href: "#getting-started",
    badge: "Essential",
  },
  {
    title: "Managing Leads",
    description: "How to create, track, and convert leads",
    icon: Users,
    href: "#leads",
  },
  {
    title: "Student Records",
    description: "Complete guide to student management",
    icon: GraduationCap,
    href: "#students",
  },
  {
    title: "Appointments",
    description: "Scheduling and managing appointments",
    icon: Calendar,
    href: "#appointments",
  },
  {
    title: "SMS & Communications",
    description: "Sending messages and using templates",
    icon: MessageSquare,
    href: "#sms",
  },
  {
    title: "Reports & Analytics",
    description: "Understanding your performance data",
    icon: BarChart3,
    href: "#reports",
  },
  {
    title: "System Settings",
    description: "Customize your preferences",
    icon: Settings,
    href: "#settings",
  },
  {
    title: "Security & Privacy",
    description: "Keeping your data safe",
    icon: Shield,
    href: "#security",
  },
]

const FAQS: FAQ[] = [
  {
    category: "Leads",
    question: "How do I create a new lead?",
    answer: "Navigate to the Leads page and click the 'Add Lead' button in the top right corner. Fill in the required information including name, phone number, and source. The lead will be automatically assigned based on your organization's assignment rules.",
  },
  {
    category: "Leads",
    question: "What do the pipeline stages mean?",
    answer: "Pipeline stages track a lead's journey: New (just added), Contacted (first contact made), Appointed (meeting scheduled), Visited (campus visit done), Applied (application submitted), Tested (placement test taken), Application (under review), Payment (payment pending), Enrolled (fully registered), Lost (not proceeding).",
  },
  {
    category: "Leads",
    question: "How do I convert a lead to a student?",
    answer: "When a lead reaches the 'Enrolled' stage and has completed payment, click on the lead's profile and use the 'Convert to Student' action. This will create a student record with all the lead's information transferred.",
  },
  {
    category: "Students",
    question: "What documents are required for student enrollment?",
    answer: "Required documents include: Civil ID (both sides), Passport, High School Transcript, Personal Photo (white background), and Bank Statement (for self-funded students). PUC students may also need their PUC approval letter.",
  },
  {
    category: "Students",
    question: "How do I track PUC application status?",
    answer: "For PUC students, the PUC Status section shows the current stage: ktech Application, PACI Verification, PUC Submission, PUC Decision, and Enrolled. You can update this status as the application progresses.",
  },
  {
    category: "Appointments",
    question: "How do I schedule a campus visit?",
    answer: "Go to the Calendar page or click 'Book Appointment' from a lead's profile. Select the appointment type, date, time, and add any notes. The system will check for conflicts and send confirmation.",
  },
  {
    category: "SMS",
    question: "Can I use templates for SMS messages?",
    answer: "Yes! Navigate to Settings > SMS to manage templates. You can use variables like {{first_name}} and {{appointment_date}} that will be automatically replaced with actual values when sending.",
  },
  {
    category: "SMS",
    question: "What is the SMS character limit?",
    answer: "Standard SMS messages are 160 characters. Messages longer than this will be split into multiple parts. Arabic messages may have a lower limit due to character encoding.",
  },
  {
    category: "Reports",
    question: "How is my conversion rate calculated?",
    answer: "Conversion rate = (Number of enrolled students / Total leads assigned to you) x 100. This is calculated monthly and compared against your target for performance tracking.",
  },
  {
    category: "Settings",
    question: "How do I change my notification preferences?",
    answer: "Go to Settings > Notifications to customize which alerts you receive. You can toggle email notifications, appointment reminders, lead assignment alerts, and weekly reports.",
  },
]

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "Quick search" },
  { keys: ["Ctrl", "N"], description: "New lead" },
  { keys: ["Ctrl", "S"], description: "Save changes" },
  { keys: ["Esc"], description: "Close modal" },
  { keys: ["?"], description: "Open help" },
]

export default function HelpPage() {
  const { profile } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = ["all", ...new Set(FAQS.map((faq) => faq.category))]

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title="Help Center"
        subtitle="Find answers and learn how to use ktech CRM"
      />

      <div className="px-3 py-4 sm:p-6 space-y-6 sm:space-y-8 page-enter">
        {/* Hero Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--primary)] flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            How can we help you?
          </h1>
          <p className="text-[var(--text-muted)] mb-6">
            Search our documentation or browse the guides below
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg rounded-xl"
            />
          </div>
        </motion.div>

        {/* Quick Guides */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Book className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Quick Guides</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GUIDES.map((guide, index) => (
              <motion.a
                key={guide.title}
                href={guide.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <Card className="h-full hover:border-[var(--primary)]/50 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)] transition-colors">
                        <guide.icon className="w-5 h-5 text-[var(--primary)] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {guide.title}
                          </h3>
                          {guide.badge && (
                            <Badge variant="accent" size="sm">
                              {guide.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          {guide.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.a>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="flex gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              <AnimatePresence>
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                      No results found
                    </h3>
                    <p className="text-[var(--text-muted)]">
                      Try a different search term or category
                    </p>
                  </div>
                ) : (
                  filteredFaqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <button
                        className="w-full p-4 text-left hover:bg-[var(--bg-sunken)] transition-colors"
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" size="sm">
                                {faq.category}
                              </Badge>
                            </div>
                            <h3 className="font-medium text-[var(--text-primary)]">
                              {faq.question}
                            </h3>
                          </div>
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 text-[var(--text-muted)] transition-transform shrink-0",
                              expandedFaq === index && "rotate-180"
                            )}
                          />
                        </div>
                        <AnimatePresence>
                          {expandedFaq === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="text-[var(--text-secondary)] mt-3 pr-10">
                                {faq.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Keyboard Shortcuts & Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-[var(--primary)]" />
                Keyboard Shortcuts
              </CardTitle>
              <CardDescription>Speed up your workflow with shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {SHORTCUTS.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-sunken)]"
                  >
                    <span className="text-[var(--text-secondary)]">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="px-2 py-1 bg-[var(--bg-sunken)] rounded text-xs font-mono">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-[var(--text-muted)] mx-1">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-[var(--primary)]" />
                Contact Support
              </CardTitle>
              <CardDescription>Need more help? Reach out to our team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href="mailto:support@ktech.edu.kw"
                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-sunken)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Email Support</p>
                  <p className="text-sm text-[var(--text-muted)]">support@ktech.edu.kw</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
              </a>

              <a
                href="tel:+96522222222"
                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-sunken)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--success)]/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[var(--success)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Phone Support</p>
                  <p className="text-sm text-[var(--text-muted)]">+965 2222-2222</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
              </a>

              <div className="p-4 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[var(--warning)]" />
                  <p className="font-medium text-[var(--text-primary)]">Support Hours</p>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Sunday - Thursday: 8:00 AM - 5:00 PM (Kuwait Time)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--warning)]" />
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-sunken)]">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text-primary)] mb-1">
                    Update lead status daily
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Keep pipeline stages current for accurate reporting
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-sunken)]">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text-primary)] mb-1">
                    Use SMS templates
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Save time with pre-written message templates
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-sunken)]">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text-primary)] mb-1">
                    Set follow-up reminders
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Never miss a callback with scheduled reminders
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
