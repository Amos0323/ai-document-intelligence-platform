import type { DocumentType, ExtractedData } from "./schemas.js"

export type RiskSeverity = "low" | "medium" | "high"

export interface RiskFlagInput {
  riskType: string
  severity: RiskSeverity
  description: string
  suggestedAction: string
}

interface RiskContext {
  documentType: DocumentType
  data: ExtractedData
  extractedText: string
  confidence: number
  duplicateInvoice?: boolean
  now?: Date
}

export function detectRisks({
  documentType,
  data,
  extractedText,
  confidence,
  duplicateInvoice = false,
  now = new Date(),
}: RiskContext): RiskFlagInput[] {
  const risks: RiskFlagInput[] = []
  const value = data as Record<string, unknown>

  const add = (risk: RiskFlagInput) => risks.push(risk)

  if (confidence < 0.65) {
    add({
      riskType: "LOW_EXTRACTION_CONFIDENCE",
      severity: confidence < 0.4 ? "high" : "medium",
      description: `Extraction confidence is ${Math.round(confidence * 100)}%.`,
      suggestedAction: "Compare the extracted fields with the source document before approval.",
    })
  }

  const primaryDate = value.invoiceDate ?? value.effectiveDate
  if (typeof primaryDate === "string" && new Date(primaryDate).getTime() > now.getTime()) {
    add({
      riskType: "FUTURE_DATED_DOCUMENT",
      severity: "high",
      description: "The document date is in the future.",
      suggestedAction: "Confirm the date with the document owner.",
    })
  }

  if (documentType === "INVOICE") {
    if (!value.invoiceNumber) {
      add({
        riskType: "MISSING_INVOICE_NUMBER",
        severity: "high",
        description: "No invoice number was extracted.",
        suggestedAction: "Request a corrected invoice before payment.",
      })
    }
    if (duplicateInvoice) {
      add({
        riskType: "DUPLICATE_INVOICE_NUMBER",
        severity: "high",
        description: "This invoice number already exists for the same vendor.",
        suggestedAction: "Hold payment and compare against the existing invoice.",
      })
    }
    if (typeof value.totalAmount === "number" && value.totalAmount >= 20_000) {
      add({
        riskType: "HIGH_VALUE_PAYMENT",
        severity: value.totalAmount >= 100_000 ? "high" : "medium",
        description: "The total amount exceeds the high-value review threshold.",
        suggestedAction: "Obtain a second approval and verify the purchase order.",
      })
    }
    if (!value.bankDetails) {
      add({
        riskType: "MISSING_BANK_DETAILS",
        severity: "high",
        description: "Bank details are missing or incomplete.",
        suggestedAction: "Verify payment details through an approved channel.",
      })
    }
  }

  if (documentType === "CONTRACT") {
    const expiry = typeof value.expiryDate === "string" ? new Date(value.expiryDate) : null
    if (expiry && !Number.isNaN(expiry.getTime()) && expiry < now) {
      add({
        riskType: "EXPIRED_CONTRACT",
        severity: "high",
        description: "The contract expiry date has passed.",
        suggestedAction: "Pause related activity and confirm renewal status.",
      })
    }
    if (!/\b(signature|signed by|electronically signed)\b/i.test(extractedText)) {
      add({
        riskType: "MISSING_SIGNATURE",
        severity: "high",
        description: "No signature marker was found in the extracted text.",
        suggestedAction: "Confirm that all parties signed the final agreement.",
      })
    }
  }

  if (documentType === "HR" && !value.employeeName && !value.employeeNumber) {
    add({
      riskType: "MISSING_EMPLOYEE_IDENTIFIER",
      severity: "high",
      description: "The document cannot be linked to an employee.",
      suggestedAction: "Request an employee name or employee number.",
    })
  }

  return risks
}

