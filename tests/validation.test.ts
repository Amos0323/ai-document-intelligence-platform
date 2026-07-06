import { describe, expect, it } from "vitest"
import { validateDocument } from "../server/domain/validation.js"
import type { InvoiceData } from "../server/domain/schemas.js"

const invoice = (overrides: Partial<InvoiceData> = {}): InvoiceData => ({
  vendorName: "Acme",
  invoiceNumber: "INV-100",
  invoiceDate: "2026-01-10",
  dueDate: "2026-02-10",
  totalAmount: 1000,
  vatAmount: 150,
  currency: "ZAR",
  purchaseOrderNumber: "PO-1",
  paymentTerms: "Net 30",
  bankDetails: "Verified",
  lineItems: [],
  ...overrides,
})

describe("validation engine", () => {
  it("rejects missing invoice numbers and non-positive totals", () => {
    const issues = validateDocument("INVOICE", invoice({ invoiceNumber: null, totalAmount: 0 }))
    expect(issues.map((issue) => issue.field)).toEqual(expect.arrayContaining(["invoiceNumber", "totalAmount"]))
  })

  it("rejects future invoice dates and due dates before invoice dates", () => {
    const issues = validateDocument(
      "INVOICE",
      invoice({ invoiceDate: "2026-08-10", dueDate: "2026-08-01" }),
      new Date("2026-07-06"),
    )
    expect(issues.map((issue) => issue.field)).toEqual(expect.arrayContaining(["invoiceDate", "dueDate"]))
  })

  it("requires two contract parties", () => {
    const issues = validateDocument("CONTRACT", {
      parties: ["Only one party"],
      effectiveDate: null,
      expiryDate: null,
      renewalTerms: null,
      paymentTerms: null,
      obligations: [],
      risks: [],
      terminationClause: "30 days notice",
      governingLaw: "South Africa",
    })
    expect(issues).toContainEqual(expect.objectContaining({ field: "parties", severity: "error" }))
  })
})

