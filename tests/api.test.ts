import { afterEach, describe, expect, it, vi } from "vitest"
import { api, apiUrl } from "../src/lib/api"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("deployed backend connection", () => {
  it("keeps local requests on the development proxy", () => {
    vi.stubEnv("VITE_API_BASE_URL", "")
    expect(apiUrl("/api/documents")).toBe("/api/documents")
  })

  it("routes uploads and exports to the configured backend", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://backend.example/")
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "doc-1" }), {
      headers: { "Content-Type": "application/json" },
    }))
    vi.stubGlobal("fetch", fetchMock)
    const body = new FormData()
    body.append("file", new Blob(["sample"]), "sample.docx")
    await expect(api.post("/api/documents", body)).resolves.toEqual({ id: "doc-1" })
    expect(fetchMock).toHaveBeenCalledWith("https://backend.example/api/documents", {
      method: "POST", headers: undefined, body,
    })
    expect(apiUrl("/api/documents/doc-1/export?format=csv"))
      .toBe("https://backend.example/api/documents/doc-1/export?format=csv")
  })

  it("explains missing backend routes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Not found", { status: 404 })))
    await expect(api.get("/api/dashboard")).rejects.toThrow("VITE_API_BASE_URL")
  })

  it("detects a frontend fallback masquerading as an API response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<!doctype html>", {
      headers: { "Content-Type": "text/html" },
    })))
    await expect(api.get("/api/dashboard")).rejects.toThrow("web page instead of document data")
  })
})
