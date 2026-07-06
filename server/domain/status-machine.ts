const transitions: Record<string, string[]> = {
  UPLOADED: ["PROCESSING", "FAILED"],
  PROCESSING: ["NEEDS_REVIEW", "FAILED"],
  NEEDS_REVIEW: ["APPROVED", "REJECTED", "NEEDS_INFO"],
  NEEDS_INFO: ["NEEDS_REVIEW", "REJECTED"],
  APPROVED: ["EXPORTED"],
  REJECTED: [],
  FAILED: ["PROCESSING"],
  EXPORTED: [],
}

export function canTransition(from: string, to: string) {
  return transitions[from]?.includes(to) ?? false
}

export function assertTransition(from: string, to: string) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid document status transition: ${from} → ${to}`)
  }
}

