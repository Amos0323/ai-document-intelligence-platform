import { Badge } from "@/components/ui/badge"
import { titleCase } from "@/lib/utils"
import type { DocumentStatus, RiskSeverity } from "@/types/documents"

const statusVariants: Record<DocumentStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  UPLOADED: "neutral",
  PROCESSING: "info",
  NEEDS_REVIEW: "warning",
  NEEDS_INFO: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  FAILED: "danger",
  EXPORTED: "success",
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge variant={statusVariants[status]}>{titleCase(status)}</Badge>
}

export function RiskBadge({ severity }: { severity: RiskSeverity }) {
  const variant = severity === "high" ? "danger" : severity === "medium" ? "warning" : "success"
  return <Badge variant={variant}>{titleCase(severity)}</Badge>
}

