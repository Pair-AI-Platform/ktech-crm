import { describe, expect, it } from "vitest"
import {
  assertArabicLeadNameFields,
  getArabicLeadDisplayName,
  splitArabicFullName,
} from "@/lib/lead-name-policy"

describe("lead name policy", () => {
  it("transliterates an English name to Arabic for display", () => {
    expect(getArabicLeadDisplayName({
      first_name: "Noor",
      last_name: "Al-Mutairi",
      phone: "55030000",
    })).toBe("نور المطيري")
  })

  it("normalizes Arabic alternate names into primary names", () => {
    expect(assertArabicLeadNameFields({
      first_name: "Noor",
      last_name: "Al-Mutairi",
      first_name_ar: "نور",
      last_name_ar: "المطيري",
    })).toMatchObject({
      first_name: "نور",
      last_name: "المطيري",
    })
  })

  it("rejects English-only names", () => {
    expect(() => assertArabicLeadNameFields({
      first_name: "Noor",
      last_name: "Al-Mutairi",
    })).toThrow("First name must be in Arabic")
  })

  it("splits Arabic full names for imports", () => {
    expect(splitArabicFullName("نور المطيري")).toEqual({
      first_name: "نور",
      last_name: "المطيري",
    })
  })
})
