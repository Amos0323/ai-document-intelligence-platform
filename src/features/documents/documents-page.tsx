import { Search, UploadCloud } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router-dom"
import { api } from "@/lib/api"
import { formatDate, titleCase } from "@/lib/utils"
import type { DocumentRecord, RiskSeverity } from "@/types/documents"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { EmptyState, ErrorState, PageSkeleton } from "@/components/page-states"
import { RiskBadge, StatusBadge } from "@/components/status-badge"

function highestRisk(document: DocumentRecord): RiskSeverity {
  if (document.risks.some((risk) => risk.severity === "high")) return "high"
  if (document.risks.some((risk) => risk.severity === "medium")) return "medium"
  return "low"
}

export function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = {
    search: searchParams.get("search") ?? "",
    type: searchParams.get("type") ?? "",
    status: searchParams.get("status") ?? "",
    risk: searchParams.get("risk") ?? "",
  }

  const queryString = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString()
  const query = useQuery({
    queryKey: ["documents", queryString],
    queryFn: () => api.get<DocumentRecord[]>(`/api/documents?${queryString}`),
  })

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  if (query.isLoading) return <PageSkeleton />
  if (query.isError || !query.data) {
    return <ErrorState message={query.error?.message ?? "Documents could not be loaded."} onRetry={() => void query.refetch()} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search, filter and review every document in the pipeline.</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex h-9 self-start items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UploadCloud className="size-4" aria-hidden="true" />
          Upload document
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative">
              <span className="sr-only">Search documents</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
              <Input
                className="pl-9"
                placeholder="Search vendor, invoice or file name..."
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </label>
            <Select aria-label="Document type" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
              <option value="">All types</option>
              <option value="INVOICE">Invoice</option>
              <option value="CONTRACT">Contract</option>
              <option value="HR">HR document</option>
              <option value="GENERAL">General</option>
            </Select>
            <Select aria-label="Status" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="">All statuses</option>
              <option value="NEEDS_REVIEW">Needs review</option>
              <option value="NEEDS_INFO">Needs information</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
            </Select>
            <Select aria-label="Risk severity" value={filters.risk} onChange={(event) => updateFilter("risk", event.target.value)}>
              <option value="">All risk levels</option>
              <option value="high">High risk</option>
              <option value="medium">Medium risk</option>
              <option value="low">Low risk</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {query.data.length === 0 ? (
          <EmptyState
            title="No documents match these filters"
            description="Clear one or more filters, or upload a new document to begin a workflow."
            action={<Button variant="outline" onClick={() => setSearchParams({})}>Clear filters</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-5 py-3 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((document) => (
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
                    <td className="px-4 py-3 text-muted-foreground">{Math.round(document.confidence * 100)}%</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(document.uploadedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

