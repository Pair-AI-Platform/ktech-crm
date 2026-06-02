import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"

// The Civil ID matcher is the security-critical core of the PSP self-service
// flow. It gates every public endpoint: the token alone is not enough — the
// student must also prove knowledge of the registered 12-digit Civil ID.
// These tests pin down its behaviour:
//
//   1. Full-digit equality after stripping non-digit noise (spaces, dashes).
//   2. A trailing-suffix match is NOT enough — the whole number must match.
//   3. Empty / missing inputs never match.
//   4. Comparison must not short-circuit on the first mismatched character
//      (timing side-channel). We assert this by reading the source and
//      confirming it does not use `===` to compare the normalised strings.

import { civilIdMatches } from "@/lib/auth/psp-self-service-token"

describe("civilIdMatches — full-digit Civil ID match", () => {
  describe("happy path: equivalent representations of the same Civil ID", () => {
    it("matches identical 12-digit strings", () => {
      expect(civilIdMatches("300010100123", "300010100123")).toBe(true)
    })

    it("ignores spaces in the supplied Civil ID", () => {
      expect(civilIdMatches("3000 1010 0123", "300010100123")).toBe(true)
    })

    it("ignores dashes in the supplied Civil ID", () => {
      expect(civilIdMatches("3-0001-0100-123", "300010100123")).toBe(true)
    })

    it("matches when the stored value has odd punctuation too", () => {
      expect(civilIdMatches("300010100123", "300-010-100-123")).toBe(true)
    })
  })

  describe("security: rejects partial / suffix-only matches", () => {
    it("rejects a Civil ID that shares the same last 8 digits", () => {
      expect(civilIdMatches("399910100123", "300010100123")).toBe(false)
    })

    it("rejects the bare last 8 digits of the correct Civil ID", () => {
      expect(civilIdMatches("10100123", "300010100123")).toBe(false)
    })

    it("rejects a prefix of the correct Civil ID", () => {
      expect(civilIdMatches("3000", "300010100123")).toBe(false)
    })

    it("rejects a Civil ID differing in a single digit", () => {
      expect(civilIdMatches("300010100124", "300010100123")).toBe(false)
    })
  })

  describe("edge cases", () => {
    it("rejects empty candidate", () => {
      expect(civilIdMatches("", "300010100123")).toBe(false)
    })

    it("rejects empty expected", () => {
      expect(civilIdMatches("300010100123", "")).toBe(false)
    })

    it("rejects null candidate", () => {
      expect(civilIdMatches(null, "300010100123")).toBe(false)
    })

    it("rejects undefined candidate", () => {
      expect(civilIdMatches(undefined, "300010100123")).toBe(false)
    })

    it("rejects null expected", () => {
      expect(civilIdMatches("300010100123", null)).toBe(false)
    })

    it("rejects when both are empty", () => {
      expect(civilIdMatches("", "")).toBe(false)
    })

    it("rejects a candidate that is only punctuation", () => {
      expect(civilIdMatches("-- ()", "300010100123")).toBe(false)
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

      // Pull out the civilIdMatches function body. Lazy regex grab —
      // good enough to fail loud if the function is rewritten.
      const fn = source.match(/export function civilIdMatches[\s\S]+?^}/m)
      expect(fn, "civilIdMatches function not found in source").toBeTruthy()
      const body = fn![0]

      // Forbid `a === b` or `b === a` style comparisons of the
      // normalised digit strings inside civilIdMatches itself.
      expect(body).not.toMatch(/\ba\s*===\s*b\b/)
      expect(body).not.toMatch(/\bb\s*===\s*a\b/)

      // And the file should reference a constant-time helper so we
      // know the safe path is wired up.
      expect(source).toMatch(/constantTimeEqual/)
    })
  })
})

describe("validatePspTokenWithCivilId — integration with Civil ID gate", () => {
  // We mock the supabase service-role client so we can drive the
  // token + lead lookup deterministically. We're specifically
  // exercising the Civil ID gate, not the token plumbing (covered by
  // the civilIdMatches block above plus the route-level tests).

  const tokenRow = {
    id: "tok-1",
    lead_id: "lead-1",
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    submitted_at: null,
  }

  function buildMockClient(leadCivilId: string | null) {
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
          data: leadCivilId === null ? null : { civil_id: leadCivilId },
          error: leadCivilId === null ? { message: "not found" } : null,
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

  async function loadWithMock(leadCivilId: string | null) {
    const mockClient = buildMockClient(leadCivilId)
    vi.doMock("@/lib/supabase/server", () => ({
      createServiceRoleClient: () => mockClient,
    }))
    return await import("@/lib/auth/psp-self-service-token")
  }

  it("accepts a matching Civil ID", async () => {
    const { validatePspTokenWithCivilId } = await loadWithMock("300010100123")
    const res = await validatePspTokenWithCivilId(
      "this-is-a-long-token-string-abcdef",
      "300010100123",
    )
    expect(res.ok).toBe(true)
  })

  it("accepts a Civil ID with punctuation against a clean stored row", async () => {
    const { validatePspTokenWithCivilId } = await loadWithMock("300010100123")
    const res = await validatePspTokenWithCivilId(
      "this-is-a-long-token-string-abcdef",
      "3000 1010 0123",
    )
    expect(res.ok).toBe(true)
  })

  it("rejects when only the last 8 digits are supplied", async () => {
    const { validatePspTokenWithCivilId } = await loadWithMock("300010100123")
    const res = await validatePspTokenWithCivilId(
      "this-is-a-long-token-string-abcdef",
      "10100123",
    )
    expect(res).toEqual({ ok: false, reason: "civil_id_mismatch" })
  })

  it("rejects a wrong Civil ID", async () => {
    const { validatePspTokenWithCivilId } = await loadWithMock("300010100123")
    const res = await validatePspTokenWithCivilId(
      "this-is-a-long-token-string-abcdef",
      "299999999999",
    )
    expect(res).toEqual({ ok: false, reason: "civil_id_mismatch" })
  })

  it("rejects an empty Civil ID", async () => {
    const { validatePspTokenWithCivilId } = await loadWithMock("300010100123")
    const res = await validatePspTokenWithCivilId(
      "this-is-a-long-token-string-abcdef",
      "",
    )
    expect(res).toEqual({ ok: false, reason: "civil_id_mismatch" })
  })

  it("rejects null Civil ID supplied by the caller", async () => {
    const { validatePspTokenWithCivilId } = await loadWithMock("300010100123")
    const res = await validatePspTokenWithCivilId(
      "this-is-a-long-token-string-abcdef",
      null,
    )
    expect(res).toEqual({ ok: false, reason: "civil_id_mismatch" })
  })
})
