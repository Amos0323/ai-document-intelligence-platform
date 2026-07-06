import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Flag,
  Loader2,
  MessageSquareMore,
  Save,
  X,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { formatDateTime, titleCase } from "@/lib/utils"
import type { DocumentRecord } from "@/types/documents"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ErrorState, PageSkeleton } from "@/components/page-states"
import { RiskBadge, StatusBadge } from "@/components/status-badge"

const invoiceFields = [
  ["vendorName", "Vendor name"],
  ["invoiceNumber", "Invoice number"],
  ["invoiceDate", "Invoice date"],
  ["dueDate", "Due date"],
  ["totalAmount", "Total amount"],
  ["vatAmount", "VAT amount"],
  ["currency", "Currency"],
  ["purchaseOrderNumber", "Purchase order"],
  ["paymentTerms", "Payment terms"],
  ["bankDetails", "Bank details"],
] as const

const contractFields = [
  ["effectiveDate", "Effective date"],
  ["expiryDate", "Expiry date"],
  ["renewalTerms", "Renewal terms"],
  ["paymentTerms", "Payment terms"],
  ["terminationClause", "Termination clause"],
  ["governingLaw", "Governing law"],
] as const

const hrFields = [
  ["employeeName", "Employee name"],
  ["employeeNumber", "Employee number"],
  ["department", "Department"],
  ["documentType", "Document type"],
  ["effectiveDate", "Effective date"],
] as const

function fieldsForType(type: string) {
  if (type === "INVOICE") return invoiceFields
  if (type === "CONTRACT") return contractFields
  if (type === "HR") return hrFields
  return [
    ["documentType", "Document type"],
    ["summary", "Summary"],
  ] as const
}

function fieldValue(value: unknown) {
  if (value === null || value === undefined) return ""
  if (typeof value === "string" || typeof value === "number") return String(value)
  return JSON.stringify(value)
}

function DocumentPreview({ document }: { document: DocumentRecord }) {
  const data = document.extractedData ?? {}
  return (
    <div className="mx-auto min-h-[680px] max-w-xl border border-border bg-white p-6 text-slate-900 shadow-sm sm:p-9">
      <div className="flex items-start justify-between border-b border-slate-300 pb-6">
        <div>
          <p className="text-xl font-bold tracking-tight">{fieldValue(data.vendorName) || "BUSINESS DOCUMENT"}</p>
          <p className="mt-1 text-xs text-slate-500">{titleCase(document.documentType)}</p>
        </div>
        <div className="text-right text-xs">
          <p className="font-semibold">{fieldValue(data.invoiceNumber) || titleCase(document.documentType)}</p>
          <p className="mt-1 text-slate-500">{fieldValue(data.invoiceDate) || formatDateTime(document.uploadedAt)}</p>
        </div>
      </div>
      <pre className="mt-6 whitespace-pre-wrap font-sans text-xs leading-6 text-slate-700">
        {document.extractedText || "No extracted text is available for this document."}
      </pre>
    </div>
  )
}

export function ReviewPage() {
  const { id = "" } = useParams()
  const queryClient = useQueryClient()
  const [sourceTab, setSourceTab] = useState<"document" | "text">("document")
  const [draftOverrides, setDraftOverrides] = useState<Record<string, Record<string, unknown>>>({})
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string>>({})

  const query = useQuery({
    queryKey: ["document", id],
    queryFn: () => api.get<DocumentRecord>(`/api/documents/${id}`),
    enabled: Boolean(id),
  })

  const draft = draftOverrides[id] ?? query.data?.extractedData ?? {}
  const notes = noteOverrides[id] ?? query.data?.reviewerNotes ?? ""

  const saveMutation = useMutation({
    mutationFn: () => api.patch<DocumentRecord>(`/api/documents/${id}`, { extractedData: draft, reviewerNotes: notes }),
    onSuccess: (document) => {
      queryClient.setQueryData(["document", id], document)
      toast.success("Review changes saved")
    },
    onError: (error) => toast.error(error.message),
  })

  const decisionMutation = useMutation({
    mutationFn: (status: "APPROVED" | "REJECTED" | "NEEDS_INFO") =>
      api.post<DocumentRecord>(`/api/documents/${id}/decision`, { status, reviewerNotes: notes }),
    onSuccess: (document) => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      void queryClient.invalidateQueries({ queryKey: ["documents"] })
      void query.refetch()
      toast.success(
        document.status === "APPROVED"
          ? "Document approved"
          : document.status === "REJECTED"
            ? "Document rejected"
            : "Information request recorded",
      )
    },
    onError: (error) => toast.error(error.message),
  })

  const lineItems = useMemo(
    () => (Array.isArray(draft.lineItems) ? draft.lineItems as Array<Record<string, unknown>> : []),
    [draft.lineItems],
  )

  if (query.isLoading) return <PageSkeleton />
  if (query.isError || !query.data) {
    return <ErrorState message={query.error?.message ?? "This document could not be loaded."} onRetry={() => void query.refetch()} />
  }

  const document = query.data
  const fields = fieldsForType(document.documentType)
  const decisionAllowed = ["NEEDS_REVIEW", "NEEDS_INFO"].includes(document.status)
  const confidenceTone = document.confidence >= 0.85 ? "success" : document.confidence >= 0.65 ? "warning" : "danger"

  const updateField = (key: string, value: string) => {
    const numericFields = new Set(["totalAmount", "vatAmount"])
    setDraftOverrides((current) => ({
      ...current,
      [id]: {
        ...draft,
        [key]: numericFields.has(key) ? (value ? Number(value) : null) : value || null,
      },
    }))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <Link to="/documents" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to documents
        </Link>
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {document.vendorName ?? document.originalName}
              </h1>
              <StatusBadge status={document.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {titleCase(document.documentType)} · Uploaded {formatDateTime(document.uploadedAt)}
              {document.processingTimeMs ? ` · ${Math.round(document.processingTimeMs / 1000)}s processing` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!decisionAllowed || decisionMutation.isPending} onClick={() => decisionMutation.mutate("NEEDS_INFO")}>
              <MessageSquareMore data-icon="inline-start" />
              Request info
            </Button>
            <Button variant="outline" disabled={!decisionAllowed || decisionMutation.isPending} onClick={() => decisionMutation.mutate("REJECTED")}>
              <X data-icon="inline-start" />
              Reject
            </Button>
            <Button disabled={!decisionAllowed || decisionMutation.isPending} onClick={() => decisionMutation.mutate("APPROVED")}>
              {decisionMutation.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
              Approve
            </Button>
          </div>
        </div>
      </div>

      {document.status === "APPROVED" ? (
        <Alert title="Approved and ready to export">
          This document completed human review. Exported data includes the reviewer&apos;s corrections.
        </Alert>
      ) : null}
      {document.extractionMethod === "fallback" ? (
        <Alert title="Fallback extraction used" variant="warning">
          The OpenAI request was unavailable. Deterministic extraction continued with low confidence for manual review.
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_280px] 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_320px]">
        <Card className="min-w-0 overflow-hidden xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
          <CardHeader className="border-b border-border pb-0">
            <CardTitle>Source document</CardTitle>
            <div className="flex gap-5 pt-3">
              {(["document", "text"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`border-b-2 pb-3 text-sm font-medium ${sourceTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                  onClick={() => setSourceTab(tab)}
                >
                  {tab === "document" ? "Document" : "Extracted text"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[700px] overflow-auto bg-muted/50 p-4">
            {sourceTab === "document" ? (
              <DocumentPreview document={document} />
            ) : (
              <pre className="whitespace-pre-wrap rounded-lg bg-background p-5 font-mono text-xs leading-6">
                {document.extractedText || "No extracted text is available."}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex-row items-start justify-between border-b border-border">
            <div>
              <CardTitle>Extracted data</CardTitle>
              <CardDescription>Correct any field before making a review decision.</CardDescription>
            </div>
            <Badge variant={confidenceTone}>
              {Math.round(document.confidence * 100)}% confidence
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(([key, label]) => {
                const issue = document.validationIssues?.find((item) => item.field === key)
                return (
                  <label key={key} className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium">{label}</span>
                    <Input
                      aria-invalid={issue?.severity === "error"}
                      value={fieldValue(draft[key])}
                      onChange={(event) => updateField(key, event.target.value)}
                      className={issue ? "border-warning" : undefined}
                    />
                    {issue ? <span className="text-[11px] text-warning-foreground">{issue.message}</span> : null}
                  </label>
                )
              })}
            </div>

            {document.documentType === "CONTRACT" && Array.isArray(draft.parties) ? (
              <div>
                <p className="mb-2 text-xs font-medium">Parties</p>
                <div className="flex flex-wrap gap-2">
                  {(draft.parties as string[]).map((party) => <Badge key={party}>{party}</Badge>)}
                </div>
              </div>
            ) : null}

            {lineItems.length > 0 ? (
              <div>
                <p className="mb-3 text-sm font-semibold">Line items ({lineItems.length})</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Description</th>
                        <th className="px-3 py-2 font-medium">Qty</th>
                        <th className="px-3 py-2 font-medium">Unit price</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={`${fieldValue(item.description)}-${index}`} className="border-b border-border last:border-b-0">
                          <td className="px-3 py-2.5">{fieldValue(item.description)}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{fieldValue(item.quantity)}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{fieldValue(item.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-medium">{fieldValue(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div>
              <label htmlFor="reviewer-notes" className="mb-2 block text-xs font-medium">Reviewer notes</label>
              <Textarea
                id="reviewer-notes"
                maxLength={2_000}
                placeholder="Add context for the audit trail..."
                value={notes}
                onChange={(event) => setNoteOverrides((current) => ({ ...current, [id]: event.target.value }))}
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Visible in the audit record</span>
                <span>{notes.length} / 2,000</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-5">
              <div className="flex gap-2">
                <a href={`/api/documents/${id}/export?format=json`}>
                  <Button variant="outline" type="button">
                    <Download data-icon="inline-start" />
                    JSON
                  </Button>
                </a>
                <a href={`/api/documents/${id}/export?format=csv`}>
                  <Button variant="outline" type="button">CSV</Button>
                </a>
              </div>
              <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4 text-warning-foreground" aria-hidden="true" />
                Validation issues ({document.validationIssues?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {document.validationIssues?.length ? document.validationIssues.map((issue) => (
                <div key={issue.id} className="rounded-lg border border-warning/25 bg-warning/5 p-3">
                  <p className="text-xs font-medium">{titleCase(issue.field)}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{issue.message}</p>
                </div>
              )) : (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  All validation checks passed
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Flag className="size-4 text-danger" aria-hidden="true" />
                Risk flags ({document.risks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {document.risks.length ? document.risks.map((risk) => (
                <div key={risk.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium">{titleCase(risk.riskType)}</p>
                    <RiskBadge severity={risk.severity} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{risk.description}</p>
                  <p className="mt-2 text-[11px] font-medium text-foreground">{risk.suggestedAction}</p>
                </div>
              )) : (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  No material risks detected
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-primary" aria-hidden="true" />
                Activity timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative ml-2 border-l border-border">
                {document.auditEvents?.map((event, index) => (
                  <li key={event.id} className="relative ml-5 pb-5 last:pb-0">
                    <span className={`absolute -left-[25px] top-0.5 size-2.5 rounded-full border-2 border-background ${index === (document.auditEvents?.length ?? 0) - 1 ? "bg-primary" : "bg-success"}`} />
                    <p className="text-xs font-medium">{event.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(event.createdAt)} · {event.actor}</p>
                    {event.detail ? <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{event.detail}</p> : null}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
