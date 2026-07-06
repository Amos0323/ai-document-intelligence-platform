import { lazy, Suspense } from "react"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  Clock3,
  FileText,
  Plus,
  XCircle,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { formatDate, titleCase } from "@/lib/utils"
import type { DashboardData, DocumentRecord } from "@/types/documents"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState, PageSkeleton } from "@/components/page-states"
import { RiskBadge, StatusBadge } from "@/components/status-badge"

const ProcessingChart = lazy(() => import("./processing-chart"))

function highestRisk(document: DocumentRecord) {
  if (document.risks.some((risk) => risk.severity === "high")) return "high"
  if (document.risks.some((risk) => risk.severity === "medium")) return "medium"
  return "low"
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string
  value: string | number
  hint: string
  icon: typeof FileText
  tone?: "neutral" | "success" | "warning" | "danger" | "info"
}) {
  const toneClass = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning-foreground",
    danger: "bg-danger/10 text-danger",
    info: "bg-info/10 text-info",
  }[tone]
  return (
    <Card className="min-w-0">
      <CardContent className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/api/dashboard"),
  })

  if (query.isLoading) return <PageSkeleton />
  if (query.isError || !query.data) {
    return <ErrorState message={query.error?.message ?? "The dashboard is unavailable."} onRetry={() => void query.refetch()} />
  }

  const { metrics, recent, reviewQueue } = query.data
  const seconds = Math.round(metrics.averageProcessingMs / 1000)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Document intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review, validate and move business documents forward.</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex h-9 self-start items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden="true" />
          Upload document
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total documents" value={metrics.total} hint="Across all workflows" icon={FileText} />
        <MetricCard label="Pending review" value={metrics.pending} hint="Needs human attention" icon={Clock3} tone="warning" />
        <MetricCard label="Approved" value={metrics.approved} hint="Ready for downstream use" icon={CheckCircle2} tone="success" />
        <MetricCard label="Rejected" value={metrics.rejected} hint="Stopped by reviewer" icon={XCircle} tone="danger" />
        <MetricCard label="Failed extraction" value={metrics.failed} hint="Needs a retry or manual entry" icon={AlertTriangle} tone="danger" />
        <MetricCard label="Average processing" value={`${seconds}s`} hint="Upload to review-ready" icon={CircleGauge} tone="info" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Processing activity</CardTitle>
              <CardDescription>Documents prepared for review over the last 30 days</CardDescription>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Last 30 days</span>
          </CardHeader>
          <CardContent className="h-64 p-3 pt-0 sm:p-5 sm:pt-0">
            <Suspense fallback={<div className="h-full animate-pulse rounded-lg bg-muted" />}>
              <ProcessingChart />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Review queue</CardTitle>
              <CardDescription>{metrics.pending} documents awaiting a decision</CardDescription>
            </div>
            <Link to="/documents?status=NEEDS_REVIEW" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-0">
            {reviewQueue.map((document) => (
              <Link
                key={document.id}
                to={`/documents/${document.id}`}
                className="group flex items-center gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
              >
                <span className={`h-9 w-1 rounded-full ${highestRisk(document) === "high" ? "bg-danger" : "bg-warning"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium group-hover:text-primary">{document.vendorName ?? document.originalName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {titleCase(document.documentType)} · {formatDate(document.uploadedAt)}
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent documents</CardTitle>
            <CardDescription>Latest activity across every document workflow</CardDescription>
          </div>
          <Link to="/documents" className="text-xs font-medium text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-y border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((document) => (
                <tr key={document.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <Link to={`/documents/${document.id}`} className="block max-w-sm truncate font-medium hover:text-primary">
                      {document.vendorName ?? document.originalName}
                    </Link>
                    <span className="text-xs text-muted-foreground">{document.invoiceNumber ?? document.originalName}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{titleCase(document.documentType)}</td>
                  <td className="px-4 py-3"><StatusBadge status={document.status} /></td>
                  <td className="px-4 py-3"><RiskBadge severity={highestRisk(document)} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(document.uploadedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
