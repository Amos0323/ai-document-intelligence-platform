const escapeCsv = (value: unknown) => {
  const text = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "")
  return `"${text.replaceAll('"', '""')}"`
}

export function toCsv(data: Record<string, unknown>) {
  const entries = Object.entries(data)
  return `${entries.map(([key]) => escapeCsv(key)).join(",")}\n${entries.map(([, value]) => escapeCsv(value)).join(",")}\n`
}

export function toJson(data: Record<string, unknown>) {
  return JSON.stringify(data, null, 2)
}

