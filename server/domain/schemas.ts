import { z } from "zod"

const nullableText = z.string().nullable()
const nullableDate = z.string().nullable()
const nullableNumber = z.number().nullable()

export const lineItemSchema = z.object({
  description: z.string(),
  quantity: nullableNumber,
  unitPrice: nullableNumber,
  amount: nullableNumber,
})

export const invoiceSchema = z.object({
  vendorName: nullableText,
  invoiceNumber: nullableText,
  invoiceDate: nullableDate,
  dueDate: nullableDate,
  totalAmount: nullableNumber,
  vatAmount: nullableNumber,
  currency: nullableText,
  purchaseOrderNumber: nullableText,
  paymentTerms: nullableText,
  bankDetails: nullableText,
  lineItems: z.array(lineItemSchema),
})

export const contractSchema = z.object({
  parties: z.array(z.string()),
  effectiveDate: nullableDate,
  expiryDate: nullableDate,
  renewalTerms: nullableText,
  paymentTerms: nullableText,
  obligations: z.array(z.string()),
  risks: z.array(z.string()),
  terminationClause: nullableText,
  governingLaw: nullableText,
})

export const hrDocumentSchema = z.object({
  employeeName: nullableText,
  employeeNumber: nullableText,
  department: nullableText,
  documentType: nullableText,
  effectiveDate: nullableDate,
  requiredActions: z.array(z.string()),
  missingInformation: z.array(z.string()),
})

export const generalDocumentSchema = z.object({
  documentType: nullableText,
  summary: nullableText,
  keyEntities: z.array(z.string()),
  importantDates: z.array(z.string()),
  requiredActions: z.array(z.string()),
  risks: z.array(z.string()),
  missingInformation: z.array(z.string()),
})

export const extractionSchemas = {
  INVOICE: invoiceSchema,
  CONTRACT: contractSchema,
  HR: hrDocumentSchema,
  GENERAL: generalDocumentSchema,
} as const

export const documentTypes = ["INVOICE", "CONTRACT", "HR", "GENERAL"] as const
export type DocumentType = (typeof documentTypes)[number]
export type InvoiceData = z.infer<typeof invoiceSchema>
export type ContractData = z.infer<typeof contractSchema>
export type HrDocumentData = z.infer<typeof hrDocumentSchema>
export type GeneralDocumentData = z.infer<typeof generalDocumentSchema>
export type ExtractedData = InvoiceData | ContractData | HrDocumentData | GeneralDocumentData

export const extractionEnvelopeSchema = z.object({
  confidence: z.number().min(0).max(1),
  data: z.record(z.string(), z.unknown()),
})

