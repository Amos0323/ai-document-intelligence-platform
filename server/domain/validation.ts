import type { DocumentType, ExtractedData } from "./schemas.js"

export interface ValidationIssueInput {
  field: string
  message: string
  severity: "error" | "warning"
}

const isFuture = (value: unknown, now: Date) => {
  if (typeof value !== "string" || !value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() > now.getTime()
}

export function validateDocument(
  documentType: DocumentType,
  data: ExtractedData,
  now = new Date(),
): ValidationIssueInput[] {
  const issues: ValidationIssueInput[] = []
  const value = data as Record<string, unknown>

  if (documentType === "INVOICE") {
    if (!value.invoiceNumber) {
      issues.push({ field: "invoiceNumber", message: "Invoice number is required", severity: "error" })
    }
    if (typeof value.totalAmount !== "number" || value.totalAmount <= 0) {
      issues.push({ field: "totalAmount", message: "Total amount must be greater than 0", severity: "error" })
    }
    if (isFuture(value.invoiceDate, now)) {
      issues.push({ field: "invoiceDate", message: "Invoice date cannot be in the future", severity: "error" })
    }
    if (typeof value.vatAmount === "number" && value.vatAmount < 0) {
      issues.push({ field: "vatAmount", message: "VAT amount cannot be negative", severity: "error" })
    }
    if (typeof value.invoiceDate === "string" && typeof value.dueDate === "string") {
      const invoiceDate = new Date(value.invoiceDate)
      const dueDate = new Date(value.dueDate)
      if (!Number.isNaN(invoiceDate.getTime()) && !Number.isNaN(dueDate.getTime()) && dueDate < invoiceDate) {
        issues.push({ field: "dueDate", message: "Due date cannot be before invoice date", severity: "error" })
      }
    }
    if (!value.purchaseOrderNumber) {
      issues.push({
        field: "purchaseOrderNumber",
        message: "Purchase order number is missing; confirm whether it is required",
        severity: "warning",
      })
    }
  }

  if (documentType === "CONTRACT") {
    const parties = Array.isArray(value.parties) ? value.parties : []
    if (parties.filter(Boolean).length < 2) {
      issues.push({ field: "parties", message: "Contract must include at least two parties", severity: "error" })
    }
    if (!value.terminationClause) {
      issues.push({ field: "terminationClause", message: "Termination clause was not found", severity: "warning" })
    }
  }

  if (documentType === "HR" && !value.employeeName && !value.employeeNumber) {
    issues.push({
      field: "employeeIdentifier",
      message: "Employee name or employee number is required",
      severity: "error",
    })
  }

  const actions = value.requiredActions
  const actionBased = documentType === "HR" || (documentType === "GENERAL" && /action|request|approval/i.test(String(value.documentType)))
  if (actionBased && (!Array.isArray(actions) || actions.length === 0)) {
    issues.push({
      field: "requiredActions",
      message: "Required actions must not be empty for action-based documents",
      severity: "warning",
    })
  }

  return issues
}

