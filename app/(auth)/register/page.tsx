"use client"


import { useState, useSyncExternalStore, type HTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, ArrowRight, Sparkles, Shield, Zap, Users, Play, ShieldCheck } from "lucide-react"
import Link from "next/link"

const emptySubscribe = () => () => {}

type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
  animate?: unknown
  initial?: unknown
  transition?: unknown
  whileHover?: unknown
}

function MotionDiv({ animate, initial, transition, whileHover, ...props }: MotionDivProps) {
  return <div {...props} />
}

const motion = { div: MotionDiv }

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const { register } = useAuth();
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
await register({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        {mounted && (
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-[var(--bg-surface)] rounded-xl p-8 border border-[var(--border)]">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Create an account</h2>
                <p className="text-[var(--text-secondary)]">Enter your details to get started</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
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
                  <Label htmlFor="password" className="text-[var(--text-secondary)]">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
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
                      Create account
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
