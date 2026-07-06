import { readFile } from "node:fs/promises"

export async function extractText(filePath: string, mimeType: string) {
  const buffer = await readFile(filePath)

  if (mimeType === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default
    const result = await pdfParse(buffer)
    return result.text.trim()
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const { createWorker } = await import("tesseract.js")
    const worker = await createWorker("eng")
    try {
      const result = await worker.recognize(buffer)
      return result.data.text.trim()
    } finally {
      await worker.terminate()
    }
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}

