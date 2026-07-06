import "./lib/env.js"
import { mkdirSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import cors from "cors"
import express from "express"
import multer from "multer"
import { z } from "zod"
import { db } from "./lib/db.js"
import { serializeDocument } from "./lib/serialize.js"
import { processDocument } from "./services/pipeline.js"
import { assertTransition } from "./domain/status-machine.js"
import { toCsv, toJson } from "./domain/export.js"
import { documentTypes } from "./domain/schemas.js"

const app = express()
const port = Number(process.env.PORT ?? 3001)
const uploadDirectory = path.resolve("uploads")
mkdirSync(uploadDirectory, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_request, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-")
      callback(null, `${Date.now()}-${safeName}`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ]
    if (allowed.includes(file.mimetype)) {
      callback(null, true)
      return
    }
    callback(new Error("Only PDF, DOCX, PNG, and JPG files are supported"))
  },
})

app.use(cors())
app.use(express.json({ limit: "2mb" }))

app.get("/api/health", (_request, response) => response.json({ status: "ok" }))

app.get("/api/dashboard", async (_request, response, next) => {
  try {
    const [total, pending, approved, rejected, failed, durations, recent, reviewQueue] = await Promise.all([
      db.document.count(),
      db.document.count({ where: { status: { in: ["NEEDS_REVIEW", "NEEDS_INFO"] } } }),
      db.document.count({ where: { status: { in: ["APPROVED", "EXPORTED"] } } }),
      db.document.count({ where: { status: "REJECTED" } }),
      db.document.count({ where: { status: "FAILED" } }),
      db.document.findMany({ where: { processingTimeMs: { not: null } }, select: { processingTimeMs: true } }),
      db.document.findMany({ take: 6, orderBy: { uploadedAt: "desc" }, include: { risks: true } }),
      db.document.findMany({
        where: { status: { in: ["NEEDS_REVIEW", "NEEDS_INFO"] } },
        take: 4,
        orderBy: { uploadedAt: "desc" },
        include: { risks: true },
      }),
    ])
    const averageProcessingMs = durations.length
      ? Math.round(durations.reduce((sum, item) => sum + (item.processingTimeMs ?? 0), 0) / durations.length)
      : 0
    response.json({
      metrics: { total, pending, approved, rejected, failed, averageProcessingMs },
      recent: recent.map(serializeDocument),
      reviewQueue: reviewQueue.map(serializeDocument),
    })
  } catch (error) {
    next(error)
  }
})

app.get("/api/documents", async (request, response, next) => {
  try {
    const search = String(request.query.search ?? "").trim()
    const type = String(request.query.type ?? "")
    const status = String(request.query.status ?? "")
    const risk = String(request.query.risk ?? "")
    const documents = await db.document.findMany({
      where: {
        ...(type ? { documentType: type } : {}),
        ...(status ? { status } : {}),
        ...(risk ? { risks: { some: { severity: risk } } } : {}),
        ...(search
          ? {
              OR: [
                { originalName: { contains: search } },
                { vendorName: { contains: search } },
                { invoiceNumber: { contains: search } },
              ],
            }
          : {}),
      },
      include: { risks: true, validationIssues: true },
      orderBy: { uploadedAt: "desc" },
    })
    response.json(documents.map(serializeDocument))
  } catch (error) {
    next(error)
  }
})

app.get("/api/documents/:id", async (request, response, next) => {
  try {
    const document = await db.document.findUnique({
      where: { id: request.params.id },
      include: {
        risks: { orderBy: { createdAt: "asc" } },
        validationIssues: { orderBy: { createdAt: "asc" } },
        auditEvents: { orderBy: { createdAt: "asc" } },
      },
    })
    if (!document) return response.status(404).json({ message: "Document not found" })
    response.json(serializeDocument(document))
  } catch (error) {
    next(error)
  }
})

app.get("/api/documents/:id/source", async (request, response, next) => {
  try {
    const document = await db.document.findUnique({ where: { id: request.params.id } })
    if (!document) return response.status(404).json({ message: "Document not found" })
    const file = await readFile(document.filePath)
    response.type(document.mimeType).send(file)
  } catch (error) {
    next(error)
  }
})

app.post("/api/documents", upload.single("file"), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ message: "Choose a document to upload" })
    const parsedType = z.enum(documentTypes).optional().safeParse(request.body.documentType || undefined)
    if (!parsedType.success) return response.status(400).json({ message: "Invalid document type" })
    const document = await db.document.create({
      data: {
        originalName: request.file.originalname,
        storedName: request.file.filename,
        mimeType: request.file.mimetype,
        filePath: request.file.path,
        documentType: parsedType.data ?? "GENERAL",
        auditEvents: { create: { eventType: "UPLOADED", title: "Document uploaded", actor: "Demo user" } },
      },
    })
    await processDocument(document.id, parsedType.data)
    const processed = await db.document.findUnique({
      where: { id: document.id },
      include: { risks: true, validationIssues: true, auditEvents: true },
    })
    response.status(201).json(processed ? serializeDocument(processed) : document)
  } catch (error) {
    next(error)
  }
})

app.patch("/api/documents/:id", async (request, response, next) => {
  try {
    const body = z
      .object({ extractedData: z.record(z.string(), z.unknown()).optional(), reviewerNotes: z.string().max(2_000).optional() })
      .parse(request.body)
    const data = body.extractedData
    const document = await db.document.update({
      where: { id: request.params.id },
      data: {
        reviewerNotes: body.reviewerNotes,
        extractedData: data ? JSON.stringify(data) : undefined,
        vendorName: typeof data?.vendorName === "string" ? data.vendorName : undefined,
        invoiceNumber: typeof data?.invoiceNumber === "string" ? data.invoiceNumber : undefined,
      },
      include: { risks: true, validationIssues: true, auditEvents: { orderBy: { createdAt: "asc" } } },
    })
    response.json(serializeDocument(document))
  } catch (error) {
    next(error)
  }
})

app.post("/api/documents/:id/decision", async (request, response, next) => {
  try {
    const body = z
      .object({
        status: z.enum(["APPROVED", "REJECTED", "NEEDS_INFO"]),
        reviewerNotes: z.string().max(2_000).optional(),
      })
      .parse(request.body)
    const current = await db.document.findUniqueOrThrow({ where: { id: request.params.id } })
    assertTransition(current.status, body.status)
    const [document] = await db.$transaction([
      db.document.update({
        where: { id: current.id },
        data: { status: body.status, reviewerNotes: body.reviewerNotes, reviewDecisionAt: new Date() },
      }),
      db.auditEvent.create({
        data: {
          documentId: current.id,
          eventType: "REVIEW_DECISION",
          title: body.status === "APPROVED" ? "Document approved" : body.status === "REJECTED" ? "Document rejected" : "More information requested",
          actor: "Demo reviewer",
          detail: body.reviewerNotes,
        },
      }),
    ])
    response.json(serializeDocument(document))
  } catch (error) {
    next(error)
  }
})

app.get("/api/documents/:id/export", async (request, response, next) => {
  try {
    const format = request.query.format === "csv" ? "csv" : "json"
    const document = await db.document.findUniqueOrThrow({ where: { id: request.params.id } })
    const payload = {
      id: document.id,
      documentType: document.documentType,
      status: document.status,
      confidence: document.confidence,
      ...(document.extractedData ? JSON.parse(document.extractedData) : {}),
    }
    await db.auditEvent.create({
      data: { documentId: document.id, eventType: "EXPORT_GENERATED", title: `${format.toUpperCase()} export generated`, actor: "Demo user" },
    })
    response
      .type(format === "csv" ? "text/csv" : "application/json")
      .attachment(`${path.parse(document.originalName).name}.${format}`)
      .send(format === "csv" ? toCsv(payload) : toJson(payload))
  } catch (error) {
    next(error)
  }
})

if (process.env.NODE_ENV === "production") {
  const distDirectory = path.resolve("dist")
  app.use(express.static(distDirectory))
  app.use((request, response, next) => {
    if (request.method === "GET" && request.accepts("html")) {
      return response.sendFile(path.join(distDirectory, "index.html"))
    }
    next()
  })
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  void _next
  const message = error instanceof Error ? error.message : "Unexpected server error"
  console.error(error)
  response.status(error instanceof z.ZodError ? 400 : 500).json({ message })
})

app.listen(port, () => {
  console.log(`DocuIntel API running on http://localhost:${port}`)
})
