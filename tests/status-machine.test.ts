import { describe, expect, it } from "vitest"
import { assertTransition, canTransition } from "../server/domain/status-machine.js"

describe("document status transitions", () => {
  it("allows a review decision after processing", () => {
    expect(canTransition("PROCESSING", "NEEDS_REVIEW")).toBe(true)
    expect(canTransition("NEEDS_REVIEW", "APPROVED")).toBe(true)
  })

  it("blocks terminal or invalid transitions", () => {
    expect(canTransition("REJECTED", "APPROVED")).toBe(false)
    expect(() => assertTransition("APPROVED", "REJECTED")).toThrow(/Invalid document status transition/)
  })
})

