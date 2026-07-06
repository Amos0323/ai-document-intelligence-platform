import { describe, expect, it } from "vitest"
import { toCsv, toJson } from "../server/domain/export.js"

describe("export formatting", () => {
  const payload = { invoiceNumber: "INV-1", vendorName: 'Acme "Office"', totalAmount: 1200 }

  it("formats readable JSON", () => {
    expect(toJson(payload)).toContain('"invoiceNumber": "INV-1"')
  })

  it("escapes CSV values safely", () => {
    const csv = toCsv(payload)
    expect(csv).toContain('"invoiceNumber","vendorName","totalAmount"')
    expect(csv).toContain('"Acme ""Office"""')
  })
})

