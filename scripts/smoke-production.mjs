#!/usr/bin/env node

const baseUrl = (process.env.SMOKE_BASE_URL || process.argv[2] || "https://ktech-adl.vercel.app").replace(/\/$/, "")
const failures = []

async function check(name, fn) {
  try {
    await fn()
    console.log(`ok ${name}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push(`${name}: ${message}`)
    console.error(`fail ${name}: ${message}`)
  }
}

await check("health endpoint", async () => {
  const res = await fetch(`${baseUrl}/api/health`, { cache: "no-store" })
  if (!res.ok) throw new Error(`expected 2xx, got ${res.status}`)
  const body = await res.json()
  if (body.status !== "ok") throw new Error(`unexpected health payload: ${JSON.stringify(body)}`)
})

await check("unauthenticated API is protected", async () => {
  const res = await fetch(`${baseUrl}/api/campaigns`, { cache: "no-store" })
  if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`)
})

await check("root route responds", async () => {
  const res = await fetch(baseUrl, { cache: "no-store", redirect: "manual" })
  if (![200, 307, 308].includes(res.status)) throw new Error(`expected 200/307/308, got ${res.status}`)
})

await check("login route responds", async () => {
  const res = await fetch(`${baseUrl}/login`, { cache: "no-store" })
  if (!res.ok) throw new Error(`expected 2xx, got ${res.status}`)
  const text = await res.text()
  if (!text.includes("KTECH") && !text.includes("ktech")) {
    throw new Error("login HTML did not contain expected app marker")
  }
})

if (failures.length > 0) {
  console.error("\nProduction smoke failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Production smoke OK: ${baseUrl}`)
