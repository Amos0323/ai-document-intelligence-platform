import { describe, expect, it } from "vitest"
import { classifyDocument, fallbackExtract } from "../server/domain/fallback.js"

describe("fallback extraction", () => {
  it("classifies and extracts common invoice fields deterministically", () => {
    const text = `Supplier: Sello Office Co
Invoice No: INV-2026-009
Invoice Date: 2026-06-20
Due Date: 2026-07-20
Total: ZAR 12,450.00
VAT: R1,623.91`
    expect(classifyDocument(text)).toBe("INVOICE")
    const result = fallbackExtract(text, "INVOICE")
    expect(result.method).toBe("fallback")
    expect(result.confidence).toBeLessThan(0.5)
    expect(result.data).toEqual(expect.objectContaining({ invoiceNumber: "INV-2026-009", totalAmount: 12450 }))
  })
})

