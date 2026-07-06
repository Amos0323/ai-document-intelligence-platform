import type { DocumentType, ExtractedData, InvoiceData } from "./schemas.js"

const match = (text: string, pattern: RegExp) => text.match(pattern)?.[1]?.trim() ?? null
const parseMoney = (value: string | null) =>
  value ? Number(value.replace(/[^\d.-]/g, "").replace(/,(?=\d{3}\b)/g, "")) || null : null

export function classifyDocument(text: string): DocumentType {
  if (/\b(invoice|tax invoice|vat|amount due)\b/i.test(text)) return "INVOICE"
  if (/\b(agreement|contract|governing law|termination)\b/i.test(text)) return "CONTRACT"
  if (/\b(employee|employment|department|human resources|leave)\b/i.test(text)) return "HR"
  return "GENERAL"
}

export function fallbackExtract(text: string, documentType: DocumentType): {
  data: ExtractedData
  confidence: number
  method: "fallback"
} {
  if (documentType === "INVOICE") {
    const data: InvoiceData = {
      vendorName: match(text, /(?:vendor|supplier|from)\s*:?\s*([^\n]+)/i) ?? text.split("\n").find(Boolean)?.trim() ?? null,
      invoiceNumber: match(text, /invoice\s*(?:number|no\.?|#)\s*:?\s*([A-Z0-9/-]+)/i),
      invoiceDate: match(text, /invoice\s*date\s*:?\s*([^\n]+)/i),
      dueDate: match(text, /due\s*date\s*:?\s*([^\n]+)/i),
      totalAmount: parseMoney(match(text, /(?:total|amount due)\s*:?\s*(?:ZAR|R|USD|\$|EUR|€)?\s*([\d,.]+)/i)),
      vatAmount: parseMoney(match(text, /(?:vat|tax)\s*:?\s*(?:ZAR|R|USD|\$|EUR|€)?\s*([\d,.]+)/i)),
      currency: /\bZAR\b|\bR\s?[\d,.]+/i.test(text) ? "ZAR" : /\bUSD\b|\$/i.test(text) ? "USD" : null,
      purchaseOrderNumber: match(text, /(?:purchase order|po)\s*(?:number|no\.?|#)?\s*:?\s*([A-Z0-9/-]+)/i),
      paymentTerms: match(text, /payment\s*terms?\s*:?\s*([^\n]+)/i),
      bankDetails: match(text, /bank\s*(?:details)?\s*:?\s*([^\n]+)/i),
      lineItems: [],
    }
    return { data, confidence: 0.38, method: "fallback" }
  }

  if (documentType === "CONTRACT") {
    return {
      confidence: 0.34,
      method: "fallback",
      data: {
        parties: [...text.matchAll(/between\s+(.+?)\s+and\s+(.+?)(?:\.|\n)/gi)].flatMap((entry) => [entry[1], entry[2]]),
        effectiveDate: match(text, /effective\s*date\s*:?\s*([^\n]+)/i),
        expiryDate: match(text, /expir(?:y|es?)\s*(?:date)?\s*:?\s*([^\n]+)/i),
        renewalTerms: match(text, /renewal\s*:?\s*([^\n]+)/i),
        paymentTerms: match(text, /payment\s*terms?\s*:?\s*([^\n]+)/i),
        obligations: [],
        risks: [],
        terminationClause: match(text, /termination\s*:?\s*([^\n]+)/i),
        governingLaw: match(text, /governing\s*law\s*:?\s*([^\n]+)/i),
      },
    }
  }

  if (documentType === "HR") {
    return {
      confidence: 0.36,
      method: "fallback",
      data: {
        employeeName: match(text, /employee\s*name\s*:?\s*([^\n]+)/i),
        employeeNumber: match(text, /employee\s*(?:number|no\.?|id)\s*:?\s*([A-Z0-9/-]+)/i),
        department: match(text, /department\s*:?\s*([^\n]+)/i),
        documentType: match(text, /document\s*type\s*:?\s*([^\n]+)/i),
        effectiveDate: match(text, /effective\s*date\s*:?\s*([^\n]+)/i),
        requiredActions: [],
        missingInformation: [],
      },
    }
  }

  return {
    confidence: 0.3,
    method: "fallback",
    data: {
      documentType: null,
      summary: text.slice(0, 500).trim() || null,
      keyEntities: [],
      importantDates: [],
      requiredActions: [],
      risks: [],
      missingInformation: [],
    },
  }
}

