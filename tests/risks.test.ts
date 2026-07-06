import { describe, expect, it } from "vitest"
import { detectRisks } from "../server/domain/risks.js"

describe("risk detection", () => {
  it("flags high-value invoices, missing bank details and duplicates", () => {
    const risks = detectRisks({
      documentType: "INVOICE",
      confidence: 0.91,
      duplicateInvoice: true,
      extractedText: "Tax invoice",
      data: {
        vendorName: "Acme",
        invoiceNumber: "INV-42",
        invoiceDate: "2026-01-01",
        dueDate: "2026-02-01",
        totalAmount: 125_000,
        vatAmount: 15_000,
        currency: "ZAR",
        purchaseOrderNumber: null,
        paymentTerms: "Net 30",
        bankDetails: null,
        lineItems: [],
      },
    })
    expect(risks.map((risk) => risk.riskType)).toEqual(
      expect.arrayContaining(["DUPLICATE_INVOICE_NUMBER", "HIGH_VALUE_PAYMENT", "MISSING_BANK_DETAILS"]),
    )
  })

  it("flags low-confidence contract extraction and missing signatures", () => {
    const risks = detectRisks({
      documentType: "CONTRACT",
      confidence: 0.32,
      extractedText: "Service agreement between Alpha and Beta",
      data: {
        parties: ["Alpha", "Beta"],
        effectiveDate: "2026-01-01",
        expiryDate: "2027-01-01",
        renewalTerms: null,
        paymentTerms: null,
        obligations: [],
        risks: [],
        terminationClause: null,
        governingLaw: null,
      },
    })
    expect(risks.map((risk) => risk.riskType)).toEqual(
      expect.arrayContaining(["LOW_EXTRACTION_CONFIDENCE", "MISSING_SIGNATURE"]),
    )
  })
})

