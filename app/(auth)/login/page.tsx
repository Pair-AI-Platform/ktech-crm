"use client"

export const dynamic = "force-dynamic"

import { useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, ArrowRight, Sparkles, Shield, Zap, Users, Play, ShieldCheck } from "lucide-react"

const emptySubscribe = () => () => {}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<"admin" | "agent" | null>(null)
  const [error, setError] = useState("")
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Check role for redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .single()
      if (profile?.role === "marketing") {
        router.push("/marketing")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    }
  }

  const isDemoAllowed = true

  const handleDemoMode = (role: "admin" | "agent") => {
    setDemoLoading(role)
    setError("")

    // Demo mode is fully client-side: no Supabase auth required. The proxy
    // checks the ktech-demo-mode cookie to allow access; useUser() and the
    // data hooks read localStorage to serve mock profiles + demo data.
    localStorage.setItem("ktech-demo-mode", "true")
    localStorage.setItem("ktech-demo-role", role)
    document.cookie = "ktech-demo-mode=true; path=/; max-age=86400; samesite=lax"
    document.cookie = `ktech-demo-role=${role}; path=/; max-age=86400; samesite=lax`

    window.location.href = "/dashboard"
  }

  const features = [
    { icon: Users, label: "Lead Management", description: "Track every prospect" },
    { icon: Zap, label: "Fast Enrollment", description: "Streamlined process" },
    { icon: Shield, label: "Secure Data", description: "Enterprise security" },
  ]

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.008]"
          style={{
            backgroundImage: `linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Animated Lines */}
        {mounted && (
          <>
            <motion.div
              className="absolute top-0 left-1/3 w-px h-full bg-[var(--primary)]/[0.03]"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            <motion.div
              className="absolute top-0 right-1/4 w-px h-full bg-[var(--accent)]/[0.02]"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 1.5, delay: 0.8 }}
            />
          </>
        )}
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10">
        <div className="flex flex-col justify-center p-16 xl:p-20">
          {mounted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo */}
              <div className="flex items-center gap-4 mb-16">
                <div className="relative">
                  <img
                    src="/ktech-logo.jpeg"
                    alt="ktech"
                    className="w-14 h-14 rounded-xl shadow-md"
                  />
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-[var(--warning)]" />
                  </motion.div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">ADL</h1>
                  <p className="text-[var(--text-secondary)] text-sm">Kuwait Technical College</p>
                </div>
              </div>

              {/* Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
                  <span className="text-[var(--text-primary)]">Enrollment</span>
                  <br />
                  <span className="text-gradient-cyan">CRM Platform</span>
                </h2>
                <p className="text-[var(--text-secondary)] text-lg mb-12 max-w-lg leading-relaxed">
                  Transform your enrollment process with our comprehensive CRM.
                  Track leads, manage students, and boost conversions — all in one place.
                </p>
              </motion.div>

              {/* Feature Cards */}
              <motion.div
                className="grid grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    className="glass-card rounded-xl p-4 group hover:border-[var(--primary)]/30 transition-all"
                    whileHover={{ y: -4, scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center mb-3 group-hover:bg-[var(--primary)] transition-colors">
                      <feature.icon className="w-5 h-5 text-[var(--primary)] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1">{feature.label}</h3>
                    <p className="text-[var(--text-muted)] text-xs">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats */}
              <motion.div
                className="flex gap-8 mt-12 pt-8 border-t border-[var(--border)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <div>
                  <div className="text-3xl font-bold text-[var(--primary)] stat-value">15+</div>
                  <div className="text-[var(--text-secondary)] text-sm">Lead Sources</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[var(--success)] stat-value">50%</div>
                  <div className="text-[var(--text-secondary)] text-sm">Conversion Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[var(--accent)] stat-value">&lt;5m</div>
                  <div className="text-[var(--text-secondary)] text-sm">Response Time</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        {mounted && (
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
              <img
                src="/ktech-logo.jpeg"
                alt="ktech"
                className="w-12 h-12 rounded-xl shadow-sm"
              />
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">ADL</h1>
                <p className="text-[var(--text-muted)] text-xs">Kuwait Technical College</p>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-[var(--bg-surface)] rounded-xl p-8 border border-[var(--border)]">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome back</h2>
                <p className="text-[var(--text-secondary)]">Sign in to access your dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <motion.div
                    className="bg-[var(--error-bg)] text-[var(--error)] px-4 py-3 rounded-xl text-sm border border-[var(--error)]/20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[var(--text-secondary)]">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@ktech.edu.kw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[var(--text-secondary)]">Password</Label>
                    <a href="#" className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    required
                    className="h-12"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold group"
                  loading={loading}
                >
                  {!loading && (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Demo Mode — hidden in production unless NEXT_PUBLIC_ENABLE_DEMO=true */}
              {isDemoAllowed && (
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] mb-3 text-center">Try the CRM without signing in</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 text-sm group"
                      disabled={demoLoading !== null}
                      onClick={() => handleDemoMode("admin")}
                    >
                      {demoLoading === "admin" ? (
                        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 mr-2" />
                      )}
                      Admin Demo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 text-sm group"
                      disabled={demoLoading !== null}
                      onClick={() => handleDemoMode("agent")}
                    >
                      {demoLoading === "agent" ? (
                        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Users className="w-4 h-4 mr-2" />
                      )}
                      Agent Demo
                    </Button>
                  </div>
                </div>
              )}

              {/* Help Link */}
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Need help?{" "}
                  <a href="mailto:it@ktech.edu.kw" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                    Contact IT Support
                  </a>
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-[var(--text-muted)] mt-8">
              &copy; {new Date().getFullYear()} Kuwait Technical College. All rights reserved.
            </p>
          </motion.div>
        )}
      </div>

      {/* Floating Elements */}
    </div>
  )
}
