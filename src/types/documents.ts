export type DocumentStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "NEEDS_REVIEW"
  | "NEEDS_INFO"
  | "APPROVED"
  | "REJECTED"
  | "FAILED"
  | "EXPORTED"

export type DocumentType = "INVOICE" | "CONTRACT" | "HR" | "GENERAL"
export type RiskSeverity = "low" | "medium" | "high"

export interface RiskFlag {
  id: string
  riskType: string
  severity: RiskSeverity
  description: string
  suggestedAction: string
}

export interface ValidationIssue {
  id: string
  field: string
  message: string
  severity: "error" | "warning"
}

export interface AuditEvent {
  id: string
  eventType: string
  title: string
  detail?: string | null
  actor: string
  createdAt: string
}

export interface DocumentRecord {
  id: string
  originalName: string
  documentType: DocumentType
  status: DocumentStatus
  extractedText?: string | null
  extractedData?: Record<string, unknown> | null
  confidence: number
  extractionMethod?: string | null
  extractionError?: string | null
  processingTimeMs?: number | null
  vendorName?: string | null
  invoiceNumber?: string | null
  reviewerNotes?: string | null
  uploadedAt: string
  updatedAt: string
  risks: RiskFlag[]
  validationIssues?: ValidationIssue[]
  auditEvents?: AuditEvent[]
}

export interface DashboardData {
  metrics: {
    total: number
    pending: number
    approved: number
    rejected: number
    failed: number
    averageProcessingMs: number
  }
  recent: DocumentRecord[]
  reviewQueue: DocumentRecord[]
}

