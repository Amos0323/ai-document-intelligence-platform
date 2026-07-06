import { db } from "../lib/db.js"
import { classifyDocument, fallbackExtract } from "../domain/fallback.js"
import type { DocumentType } from "../domain/schemas.js"
import { validateDocument } from "../domain/validation.js"
import { detectRisks } from "../domain/risks.js"
import { extractWithOpenAI } from "./ai-extraction.js"
import { extractText } from "./text-extraction.js"

const audit = (documentId: string, eventType: string, title: string, detail?: string) =>
  db.auditEvent.create({ data: { documentId, eventType, title, detail } })

export async function processDocument(documentId: string, requestedType?: DocumentType) {
  const startedAt = Date.now()
  const document = await db.document.update({
    where: { id: documentId },
    data: { status: "PROCESSING" },
  })

  try {
    const text = await extractText(document.filePath, document.mimeType)
    if (!text) throw new Error("No readable text could be extracted from this file")
    await db.document.update({ where: { id: documentId }, data: { extractedText: text } })
    await audit(documentId, "TEXT_EXTRACTED", "Text extracted", `${text.length.toLocaleString()} characters`)

    const documentType = requestedType ?? classifyDocument(text)
    let extraction
    let aiError: string | undefined
    try {
      extraction = await extractWithOpenAI(text, documentType)
    } catch (error) {
      aiError = error instanceof Error ? error.message : "Unknown OpenAI error"
      extraction = fallbackExtract(text, documentType)
    }

    await audit(
      documentId,
      "AI_EXTRACTION_COMPLETED",
      extraction.method === "openai" ? "AI extraction completed" : "Fallback extraction completed",
      aiError ? `OpenAI unavailable: ${aiError}` : undefined,
    )

    const parsed = extraction.data as Record<string, unknown>
    const issues = validateDocument(documentType, extraction.data)
    const vendorName = typeof parsed.vendorName === "string" ? parsed.vendorName : null
    const invoiceNumber = typeof parsed.invoiceNumber === "string" ? parsed.invoiceNumber : null
    const duplicateInvoice = invoiceNumber
      ? Boolean(
          await db.document.findFirst({
            where: { id: { not: documentId }, invoiceNumber, vendorName: vendorName ?? undefined },
          }),
        )
      : false
    const risks = detectRisks({
      documentType,
      data: extraction.data,
      extractedText: text,
      confidence: extraction.confidence,
      duplicateInvoice,
    })

    await db.$transaction([
      db.validationIssue.deleteMany({ where: { documentId } }),
      db.riskFlag.deleteMany({ where: { documentId } }),
      db.document.update({
        where: { id: documentId },
        data: {
          documentType,
          status: "NEEDS_REVIEW",
          extractedData: JSON.stringify(extraction.data),
          confidence: extraction.confidence,
          extractionMethod: extraction.method,
          extractionError: aiError,
          vendorName,
          invoiceNumber,
          processingTimeMs: Date.now() - startedAt,
        },
      }),
      ...issues.map((issue) => db.validationIssue.create({ data: { ...issue, documentId } })),
      ...risks.map((risk) => db.riskFlag.create({ data: { ...risk, documentId } })),
    ])
    await audit(documentId, "VALIDATION_COMPLETED", "Validation completed", `${issues.length} issue(s) found`)
    await audit(documentId, "RISK_ANALYSIS_COMPLETED", "Risk analysis completed", `${risks.length} risk(s) flagged`)
    await audit(documentId, "HUMAN_REVIEW_REQUIRED", "Awaiting human review")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown processing error"
    await db.document.update({
      where: { id: documentId },
      data: { status: "FAILED", extractionError: message, processingTimeMs: Date.now() - startedAt },
    })
    await audit(documentId, "EXTRACTION_FAILED", "Extraction failed", message)
  }
}

