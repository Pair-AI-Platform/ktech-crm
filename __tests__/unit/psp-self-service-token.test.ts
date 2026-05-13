import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"

// The phone matcher is the security-critical core of the PSP self-service
// flow. The previous implementation accepted ANY input whose last 8
// digits matched the stored lead phone, which made the per-request
// "phone password" brute-forceable in ~10^7 attempts. P1-4 in the
// security audit. These tests pin down the new behaviour:
//
//   1. Full-digit equality after stripping non-digit noise.
//   2. Kuwaiti `965` country code normalised away when present so the
//      common shapes (`+965 5000 1234`, `+96550001234`, `50001234`,
//      `0096550001234`) all map to the same canonical value.
//   3. A trailing 8-digit suffix is NOT enough — that was the bug.
//   4. Empty / missing inputs never match.
//   5. Comparison must not short-circuit on the first mismatched
//      character (timing side-channel). We assert this by reading the
//      source and confirming it does not use `===` to compare the
//      normalised digit strings.

import { phoneMatches } from "@/lib/auth/psp-self-service-token"

describe("phoneMatches — full-digit Kuwaiti phone match", () => {
  describe("happy path: equivalent representations of the same number", () => {
    it("matches identical E.164 strings", () => {
      expect(phoneMatches("+96550001234", "+96550001234")).toBe(true)
    })

    it("matches E.164 with spaces against bare E.164", () => {
      expect(phoneMatches("+965 5000 1234", "+96550001234")).toBe(true)
    })

    it("matches local 8-digit input against E.164 stored value", () => {
      expect(phoneMatches("50001234", "+965 5000 1234")).toBe(true)
    })

    it("matches local 8-digit input against digits-only country-coded value", () => {
      expect(phoneMatches("50001234", "96550001234")).toBe(true)
    })

    it("matches international dial-out form (00965…)", () => {
      expect(phoneMatches("0096550001234", "+96550001234")).toBe(true)
    })

    it("ignores dashes, brackets, and spaces in supplied phone", () => {
      expect(phoneMatches("(+965) 5000-1234", "+96550001234")).toBe(true)
    })

    it("matches when stored value has odd punctuation too", () => {
      expect(phoneMatches("+96550001234", "+965-5000-1234")).toBe(true)
    })
  })

  describe("security: rejects suffix-only matches (the P1-4 fix)", () => {
    it("rejects a different number that shares the same last 8 digits", () => {
      // Old implementation: last 8 digits of "+44 7000 1234" and
      // "+965 7000 1234" both end in `70001234`, so it would have
      // returned true. New implementation: the UK number canonicalises
      // to `447xxxxxxxx` (no `965` to strip), the Kuwaiti to
      // `70001234`, so they no longer collide.
      expect(phoneMatches("+447000123470001234", "+965 7000 1234")).toBe(false)
    })

    it("rejects the bare last 8 digits when stored is a foreign country code", () => {
      // Stored row was someone's UK number, attacker only knows the
      // last 8 digits. Must NOT authenticate.
      expect(phoneMatches("12345678", "+447123412345678")).toBe(false)
    })

    it("rejects a partial prefix of the correct number", () => {
      expect(phoneMatches("5000", "+96550001234")).toBe(false)
    })

    it("rejects a number that shares the trailing 7 digits but differs in the 8th", () => {
      expect(phoneMatches("50001234", "+96560001234")).toBe(false)
    })
  })

  describe("edge cases", () => {
    it("rejects empty candidate", () => {
      expect(phoneMatches("", "+96550001234")).toBe(false)
    })

    it("rejects empty expected", () => {
      expect(phoneMatches("+96550001234", "")).toBe(false)
    })

    it("rejects null candidate", () => {
      expect(phoneMatches(null, "+96550001234")).toBe(false)
    })

    it("rejects undefined candidate", () => {
      expect(phoneMatches(undefined, "+96550001234")).toBe(false)
    })

    it("rejects null expected", () => {
      expect(phoneMatches("+96550001234", null)).toBe(false)
    })

    it("rejects when both are empty", () => {
      expect(phoneMatches("", "")).toBe(false)
    })

    it("rejects a candidate that is only punctuation", () => {
      expect(phoneMatches("+-() ", "+96550001234")).toBe(false)
    })

    it("rejects a completely different Kuwaiti number", () => {
      expect(phoneMatches("+96599999999", "+96550001234")).toBe(false)
    })

    it("does not strip 965 from a string that is not 11 digits total", () => {
      // A 14-digit string beginning with 965 must NOT be treated as
      // Kuwaiti+local; otherwise we re-introduce a suffix-match risk.
      expect(phoneMatches("96512345678901", "+96512345678")).toBe(false)
    })
  })

  describe("constant-time comparison guard", () => {
    // We can't reliably assert timing in unit tests (flaky on CI), but
    // we CAN assert that the implementation doesn't fall into the
    // obvious `===` trap on the normalised digit strings. This guard
    // catches regressions where someone "simplifies" the matcher back
    // to short-circuit equality.
    it("does not compare normalised digit strings with === in the source", () => {
      const sourcePath = path.resolve(
        __dirname,
        "..",
        "..",
        "lib",
        "auth",
        "psp-self-service-token.ts",
      )
      const source = readFileSync(sourcePath, "utf8")

      // Pull out the phoneMatches function body. Lazy regex grab —
      // good enough to fail loud if the function is rewritten.
      const fn = source.match(/export function phoneMatches[\s\S]+?^}/m)
      expect(fn, "phoneMatches function not found in source").toBeTruthy()
      const body = fn![0]

      // Forbid `a === b` or `b === a` style comparisons of the
      // canonicalised digit strings inside phoneMatches itself.
      expect(body).not.toMatch(/\ba\s*===\s*b\b/)
      expect(body).not.toMatch(/\bb\s*===\s*a\b/)

      // And the file should reference a constant-time helper so we
      // know the safe path is wired up.
      expect(source).toMatch(/constantTimeEqual/)
    })
  })
})

describe("validatePspTokenWithPhone — integration with phone gate", () => {
  // We mock the supabase service-role client so we can drive the
  // token + lead lookup deterministically. We're specifically
  // exercising the phone gate, not the token plumbing (covered by
  // the phoneMatches block above plus the route-level tests).

  const tokenRow = {
    id: "tok-1",
    lead_id: "lead-1",
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    submitted_at: null,
  }

  function buildMockClient(leadPhone: string | null) {
    // Each `.from(table)` call returns a chainable object whose
    // terminal method (`.maybeSingle` / `.single`) returns a Promise
    // of `{ data, error }`. We don't care about the update call —
    // make it a no-op that resolves.
    const tokenChain = {
      select: () => tokenChain,
      eq: () => tokenChain,
      maybeSingle: () => Promise.resolve({ data: tokenRow, error: null }),
    }
    const tokenUpdateChain = {
      update: () => tokenUpdateChain,
      eq: () => Promise.resolve({ data: null, error: null }),
    }
    const leadChain = {
      select: () => leadChain,
      eq: () => leadChain,
      single: () =>
        Promise.resolve({
          data: leadPhone === null ? null : { phone: leadPhone },
          error: leadPhone === null ? { message: "not found" } : null,
        }),
    }

    let tokenCalls = 0
    return {
      from: (table: string) => {
        if (table === "psp_self_service_tokens") {
          tokenCalls += 1
          // First call is the SELECT (chain with maybeSingle), second
          // is the UPDATE (chain with eq returning a Promise).
          return tokenCalls === 1 ? tokenChain : tokenUpdateChain
        }
        if (table === "leads") {
          return leadChain
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }
  }

  beforeEach(() => {
    vi.resetModules()
  })

  async function loadWithMock(leadPhone: string | null) {
    const mockClient = buildMockClient(leadPhone)
    vi.doMock("@/lib/supabase/server", () => ({
      createServiceRoleClient: () => mockClient,
    }))
    return await import("@/lib/auth/psp-self-service-token")
  }

  it("accepts a matching full E.164 phone", async () => {
    const { validatePspTokenWithPhone } = await loadWithMock("+965 5000 1234")
    const res = await validatePspTokenWithPhone(
      "this-is-a-long-token-string-abcdef",
      "+96550001234",
    )
    expect(res.ok).toBe(true)
  })

  it("accepts a local 8-digit phone against a stored E.164 row", async () => {
    const { validatePspTokenWithPhone } = await loadWithMock("+965 5000 1234")
    const res = await validatePspTokenWithPhone(
      "this-is-a-long-token-string-abcdef",
      "50001234",
    )
    expect(res.ok).toBe(true)
  })

  it("rejects when only the last 8 digits of a foreign number are supplied (P1-4 regression)", async () => {
    const { validatePspTokenWithPhone } = await loadWithMock("+447123412345678")
    const res = await validatePspTokenWithPhone(
      "this-is-a-long-token-string-abcdef",
      "12345678",
    )
    expect(res).toEqual({ ok: false, reason: "phone_mismatch" })
  })

  it("rejects a wrong number", async () => {
    const { validatePspTokenWithPhone } = await loadWithMock("+96550001234")
    const res = await validatePspTokenWithPhone(
      "this-is-a-long-token-string-abcdef",
      "+96599999999",
    )
    expect(res).toEqual({ ok: false, reason: "phone_mismatch" })
  })

  it("rejects an empty phone", async () => {
    const { validatePspTokenWithPhone } = await loadWithMock("+96550001234")
    const res = await validatePspTokenWithPhone(
      "this-is-a-long-token-string-abcdef",
      "",
    )
    expect(res).toEqual({ ok: false, reason: "phone_mismatch" })
  })

  it("rejects null phone supplied by the caller", async () => {
    const { validatePspTokenWithPhone } = await loadWithMock("+96550001234")
    const res = await validatePspTokenWithPhone(
      "this-is-a-long-token-string-abcdef",
      null,
    )
    expect(res).toEqual({ ok: false, reason: "phone_mismatch" })
  })
})
