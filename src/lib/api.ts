export function apiUrl(url: string): string {
  const origin = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "")
  return `${origin}${url}`
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(url), options)
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(payload?.message ?? (response.status === 404
      ? "The document API could not be found. Configure VITE_API_BASE_URL with the backend address and redeploy the frontend."
      : `Request failed with status ${response.status}`))
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("The server returned a web page instead of document data. Check the backend address and API routing.")
  }
  return response.json() as Promise<T>
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
}

