import "../server/lib/env.js"
import { db } from "../server/lib/db.js"

const statements = [
  `PRAGMA foreign_keys = ON`,
  `CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "extractedText" TEXT,
    "extractedData" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0,
    "extractionMethod" TEXT,
    "extractionError" TEXT,
    "processingTimeMs" INTEGER,
    "vendorName" TEXT,
    "invoiceNumber" TEXT,
    "reviewerNotes" TEXT,
    "reviewDecisionAt" DATETIME,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "RiskFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskFlag_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ValidationIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'error',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationIssue_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "actor" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Document_status_idx" ON "Document"("status")`,
  `CREATE INDEX IF NOT EXISTS "Document_documentType_idx" ON "Document"("documentType")`,
  `CREATE INDEX IF NOT EXISTS "Document_invoiceNumber_idx" ON "Document"("invoiceNumber")`,
  `CREATE INDEX IF NOT EXISTS "Document_uploadedAt_idx" ON "Document"("uploadedAt")`,
  `CREATE INDEX IF NOT EXISTS "RiskFlag_documentId_idx" ON "RiskFlag"("documentId")`,
  `CREATE INDEX IF NOT EXISTS "RiskFlag_severity_idx" ON "RiskFlag"("severity")`,
  `CREATE INDEX IF NOT EXISTS "ValidationIssue_documentId_idx" ON "ValidationIssue"("documentId")`,
  `CREATE INDEX IF NOT EXISTS "AuditEvent_documentId_idx" ON "AuditEvent"("documentId")`,
  `CREATE INDEX IF NOT EXISTS "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt")`,
]

async function main() {
  for (const statement of statements) {
    await db.$executeRawUnsafe(statement)
  }
  console.log("SQLite schema is ready.")
}

main().finally(() => db.$disconnect())

