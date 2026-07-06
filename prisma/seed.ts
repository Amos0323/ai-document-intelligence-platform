import "../server/lib/env.js"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { db } from "../server/lib/db.js"

const now = new Date()
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000)

const invoiceText = `ACME OFFICE SUPPLIES (PTY) LTD
TAX INVOICE
Invoice Number: INV-2026-1842
Invoice Date: 2026-05-24
Due Date: 2026-06-23
Payment Terms: Net 30 days
HP LaserJet Toner Cartridge 147A  R12,500.00
A4 Copy Paper 80gsm  R8,400.00
Pilot G2 Ballpoint Pens  R2,700.00
Stapler Heavy Duty  R3,150.00
VAT: R3,750.00
TOTAL: ZAR 28,750.00`

const samples = [
  {
    originalName: "acme-office-supplies-inv-2026-1842.pdf",
    documentType: "INVOICE",
    status: "NEEDS_REVIEW",
    confidence: 0.86,
    vendorName: "Acme Office Supplies (Pty) Ltd",
    invoiceNumber: "INV-2026-1842",
    processingTimeMs: 42_000,
    uploadedAt: daysAgo(0),
    text: invoiceText,
    data: {
      vendorName: "Acme Office Supplies (Pty) Ltd",
      invoiceNumber: "INV-2026-1842",
      invoiceDate: "2026-05-24",
      dueDate: "2026-06-23",
      totalAmount: 28750,
      vatAmount: 3750,
      currency: "ZAR",
      purchaseOrderNumber: null,
      paymentTerms: "Net 30 days",
      bankDetails: null,
      lineItems: [
        { description: "HP LaserJet Toner Cartridge 147A", quantity: 10, unitPrice: 1250, amount: 12500 },
        { description: "A4 Copy Paper 80gsm", quantity: 20, unitPrice: 420, amount: 8400 },
        { description: "Pilot G2 Ballpoint Pens", quantity: 15, unitPrice: 180, amount: 2700 },
        { description: "Stapler Heavy Duty", quantity: 5, unitPrice: 630, amount: 3150 },
      ],
    },
    issues: [{ field: "purchaseOrderNumber", message: "Purchase order number is missing; confirm whether it is required", severity: "warning" }],
    risks: [
      { riskType: "HIGH_VALUE_PAYMENT", severity: "medium", description: "The total amount exceeds the high-value review threshold.", suggestedAction: "Obtain a second approval and verify the purchase order." },
      { riskType: "MISSING_BANK_DETAILS", severity: "high", description: "Bank details are missing or incomplete.", suggestedAction: "Verify payment details through an approved channel." },
    ],
  },
  {
    originalName: "mokoena-logistics-service-agreement.pdf",
    documentType: "CONTRACT",
    status: "NEEDS_REVIEW",
    confidence: 0.92,
    processingTimeMs: 58_000,
    uploadedAt: daysAgo(1),
    text: "SERVICE AGREEMENT between Mokoena Logistics (Pty) Ltd and Ubuntu Retail Group. Effective Date: 2025-07-01. Expiry Date: 2026-06-30. Governing Law: Republic of South Africa. Termination: 60 days written notice.",
    data: { parties: ["Mokoena Logistics (Pty) Ltd", "Ubuntu Retail Group"], effectiveDate: "2025-07-01", expiryDate: "2026-06-30", renewalTerms: "Renews annually by written agreement", paymentTerms: "Monthly, net 30", obligations: ["Provide national freight services", "Maintain goods-in-transit insurance"], risks: ["Contract has expired"], terminationClause: "60 days written notice", governingLaw: "Republic of South Africa" },
    issues: [],
    risks: [
      { riskType: "EXPIRED_CONTRACT", severity: "high", description: "The contract expiry date has passed.", suggestedAction: "Pause related activity and confirm renewal status." },
      { riskType: "MISSING_SIGNATURE", severity: "high", description: "No signature marker was found in the extracted text.", suggestedAction: "Confirm that all parties signed the final agreement." },
    ],
  },
  {
    originalName: "thandi-maseko-employment-addendum.docx",
    documentType: "HR",
    status: "APPROVED",
    confidence: 0.95,
    processingTimeMs: 31_000,
    uploadedAt: daysAgo(2),
    text: "EMPLOYMENT ADDENDUM\nEmployee Name: Thandi Maseko\nEmployee Number: EMP-1048\nDepartment: Finance\nEffective Date: 2026-06-01\nRequired Action: Employee acknowledgement.",
    data: { employeeName: "Thandi Maseko", employeeNumber: "EMP-1048", department: "Finance", documentType: "Employment addendum", effectiveDate: "2026-06-01", requiredActions: ["Employee acknowledgement"], missingInformation: [] },
    issues: [],
    risks: [],
  },
  {
    originalName: "ndlovu-engineering-inv-2026-1839.pdf",
    documentType: "INVOICE",
    status: "NEEDS_INFO",
    confidence: 0.61,
    vendorName: "Ndlovu Engineering",
    invoiceNumber: "INV-2026-1839",
    processingTimeMs: 67_000,
    uploadedAt: daysAgo(3),
    text: "NDLOVU ENGINEERING\nInvoice No: INV-2026-1839\nTotal: R146,800.00\nVAT: R19,147.83",
    data: { vendorName: "Ndlovu Engineering", invoiceNumber: "INV-2026-1839", invoiceDate: null, dueDate: null, totalAmount: 146800, vatAmount: 19147.83, currency: "ZAR", purchaseOrderNumber: null, paymentTerms: null, bankDetails: null, lineItems: [] },
    issues: [{ field: "invoiceDate", message: "Invoice date could not be verified", severity: "warning" }],
    risks: [
      { riskType: "LOW_EXTRACTION_CONFIDENCE", severity: "medium", description: "Extraction confidence is 61%.", suggestedAction: "Compare the extracted fields with the source document before approval." },
      { riskType: "HIGH_VALUE_PAYMENT", severity: "high", description: "The total amount exceeds the high-value review threshold.", suggestedAction: "Obtain a second approval and verify the purchase order." },
    ],
  },
  {
    originalName: "q2-procurement-summary.pdf",
    documentType: "GENERAL",
    status: "PROCESSING",
    confidence: 0.72,
    processingTimeMs: null,
    uploadedAt: daysAgo(4),
    text: "Q2 PROCUREMENT SUMMARY. Action required: review supplier consolidation proposal by 15 July 2026.",
    data: { documentType: "Procurement summary", summary: "Quarterly supplier and spend review.", keyEntities: ["Procurement", "Finance"], importantDates: ["2026-07-15"], requiredActions: ["Review supplier consolidation proposal"], risks: [], missingInformation: [] },
    issues: [],
    risks: [],
  },
  {
    originalName: "capetown-facilities-lease.pdf",
    documentType: "CONTRACT",
    status: "REJECTED",
    confidence: 0.88,
    processingTimeMs: 49_000,
    uploadedAt: daysAgo(6),
    text: "COMMERCIAL LEASE between Cape Town Facilities and Meridian Labs. Expiry Date: 2025-12-31.",
    data: { parties: ["Cape Town Facilities", "Meridian Labs"], effectiveDate: "2024-01-01", expiryDate: "2025-12-31", renewalTerms: null, paymentTerms: "Monthly", obligations: [], risks: ["Expired"], terminationClause: null, governingLaw: "South Africa" },
    issues: [{ field: "terminationClause", message: "Termination clause was not found", severity: "warning" }],
    risks: [{ riskType: "EXPIRED_CONTRACT", severity: "high", description: "The contract expiry date has passed.", suggestedAction: "Pause related activity and confirm renewal status." }],
  },
  {
    originalName: "blurred-travel-receipt.jpg",
    documentType: "INVOICE",
    status: "FAILED",
    confidence: 0,
    processingTimeMs: 12_000,
    uploadedAt: daysAgo(7),
    text: "",
    data: null,
    issues: [],
    risks: [],
    extractionError: "OCR could not find readable text in the image.",
  },
  {
    originalName: "ubuntu-retail-credit-note.pdf",
    documentType: "INVOICE",
    status: "APPROVED",
    confidence: 0.94,
    vendorName: "Ubuntu Retail Group",
    invoiceNumber: "CN-2026-044",
    processingTimeMs: 29_000,
    uploadedAt: daysAgo(8),
    text: "UBUNTU RETAIL GROUP CREDIT NOTE CN-2026-044 TOTAL R4,890.00",
    data: { vendorName: "Ubuntu Retail Group", invoiceNumber: "CN-2026-044", invoiceDate: "2026-06-20", dueDate: null, totalAmount: 4890, vatAmount: 637.83, currency: "ZAR", purchaseOrderNumber: "PO-4421", paymentTerms: "Credit applied immediately", bankDetails: "Not applicable", lineItems: [] },
    issues: [],
    risks: [],
  },
]

async function main() {
  await mkdir(path.resolve("uploads"), { recursive: true })
  if (process.argv.includes("--if-empty") && (await db.document.count()) > 0) {
    console.log("Seed data already exists; skipping.")
    return
  }
  await db.auditEvent.deleteMany()
  await db.validationIssue.deleteMany()
  await db.riskFlag.deleteMany()
  await db.document.deleteMany()

  for (const [index, sample] of samples.entries()) {
    const filePath = path.resolve("uploads", `sample-${index + 1}.txt`)
    await writeFile(filePath, sample.text, "utf8")
    await db.document.create({
      data: {
        originalName: sample.originalName,
        storedName: path.basename(filePath),
        mimeType: sample.originalName.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : sample.originalName.endsWith(".jpg") ? "image/jpeg" : "application/pdf",
        filePath,
        documentType: sample.documentType,
        status: sample.status,
        extractedText: sample.text || null,
        extractedData: sample.data ? JSON.stringify(sample.data) : null,
        confidence: sample.confidence,
        extractionMethod: sample.status === "FAILED" ? null : "openai",
        extractionError: sample.extractionError,
        processingTimeMs: sample.processingTimeMs,
        vendorName: sample.vendorName,
        invoiceNumber: sample.invoiceNumber,
        uploadedAt: sample.uploadedAt,
        risks: { create: sample.risks },
        validationIssues: { create: sample.issues },
        auditEvents: {
          create: [
            { eventType: "UPLOADED", title: "Document uploaded", createdAt: sample.uploadedAt, actor: "Demo user" },
            ...(sample.status !== "FAILED" ? [
              { eventType: "TEXT_EXTRACTED", title: "Text extracted", createdAt: new Date(sample.uploadedAt.getTime() + 8_000) },
              { eventType: "AI_EXTRACTION_COMPLETED", title: "AI extraction completed", createdAt: new Date(sample.uploadedAt.getTime() + 20_000) },
              { eventType: "VALIDATION_COMPLETED", title: "Validation completed", createdAt: new Date(sample.uploadedAt.getTime() + 27_000) },
              { eventType: "RISK_ANALYSIS_COMPLETED", title: "Risk analysis completed", createdAt: new Date(sample.uploadedAt.getTime() + 31_000) },
              { eventType: "HUMAN_REVIEW_REQUIRED", title: "Awaiting human review", createdAt: new Date(sample.uploadedAt.getTime() + 35_000) },
            ] : [{ eventType: "EXTRACTION_FAILED", title: "Extraction failed", detail: sample.extractionError, createdAt: new Date(sample.uploadedAt.getTime() + 12_000) }]),
            ...(["APPROVED", "REJECTED"].includes(sample.status)
              ? [{ eventType: "REVIEW_DECISION", title: sample.status === "APPROVED" ? "Document approved" : "Document rejected", actor: "Demo reviewer", createdAt: new Date(sample.uploadedAt.getTime() + 86_400_000) }]
              : []),
          ],
        },
      },
    })
  }
  console.log(`Seeded ${samples.length} realistic sample documents.`)
}

main().finally(() => db.$disconnect())
