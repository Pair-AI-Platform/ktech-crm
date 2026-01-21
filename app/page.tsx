"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"

const emptySubscribe = () => () => {}

export default function Hello() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-base)] px-6">
      {/* Logo */}
      <img
        src="/ktech-logo.jpeg"
        alt="ktech"
        className={`
          w-20 h-20 rounded-2xl mb-8
          transition-all duration-700 ease-out
          ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"}
        `}
      />

      {/* The Hello */}
      <h1
        className={`
          text-[clamp(4rem,15vw,12rem)] font-medium tracking-tight
          text-[var(--text-primary)]
          transition-all duration-1000 ease-out
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        Hello.
      </h1>

      {/* Tagline */}
      <p
        className={`
          mt-6 text-xl md:text-2xl text-[var(--text-secondary)] text-center max-w-md
          transition-all duration-1000 delay-300 ease-out
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
      >
        Welcome to ktech CRM.
      </p>

      {/* CTA */}
      <Link
        href="/dashboard"
        className={`
          mt-12 px-8 py-4 rounded-full
          bg-[var(--primary)] text-white font-medium text-lg
          hover:bg-[var(--primary-hover)]
          transition-all duration-500 delay-500 ease-out
          hover:scale-105 active:scale-95
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
      >
        Get Started
      </Link>
    </div>
  )
}
