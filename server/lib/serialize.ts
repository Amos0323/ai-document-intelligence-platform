type JsonDocument = {
  extractedData: string | null
  [key: string]: unknown
}

export function serializeDocument<T extends JsonDocument>(document: T) {
  return {
    ...document,
    extractedData: document.extractedData ? JSON.parse(document.extractedData) : null,
  }
}

