import { useState } from "react"
import { FileText, Image, Loader2, ShieldCheck, UploadCloud, X } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useDropzone } from "react-dropzone"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { DocumentRecord, DocumentType } from "@/types/documents"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"

export function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File>()
  const [documentType, setDocumentType] = useState<DocumentType | "">("")

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a document first")
      const formData = new FormData()
      formData.append("file", file)
      if (documentType) formData.append("documentType", documentType)
      return api.post<DocumentRecord>("/api/documents", formData)
    },
    onSuccess: (document) => {
      toast.success("Document is ready for review")
      navigate(`/documents/${document.id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    noClick: true,
    onDropAccepted: (files) => setFile(files[0]),
    onDropRejected: () => toast.error("Use a PDF, DOCX, PNG, or JPG file smaller than 10 MB."),
  })

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Upload a document</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start a secure extraction, validation and review workflow.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle>Source file</CardTitle>
            <CardDescription>PDF, DOCX, PNG or JPG · up to 10 MB</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div
              {...getRootProps()}
              className={cn(
                "flex min-h-72 cursor-default flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center transition-colors",
                isDragActive && "border-primary bg-primary/5",
                file && "border-success/40 bg-success/5",
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-success/10 text-success">
                    <FileText className="size-6" aria-hidden="true" />
                  </div>
                  <p className="mt-4 max-w-full truncate font-medium">{file.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to process</p>
                  <Button variant="ghost" className="mt-3" onClick={() => setFile(undefined)}>
                    <X data-icon="inline-start" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UploadCloud className="size-6" aria-hidden="true" />
                  </div>
                  <p className="mt-4 font-medium">{isDragActive ? "Drop the document here" : "Drag and drop your document"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">or choose a file from your computer</p>
                  <Button type="button" variant="outline" className="mt-4" onClick={open}>Browse files</Button>
                </>
              )}
            </div>

            <div>
              <label htmlFor="document-type" className="mb-2 block text-sm font-medium">Document type</label>
              <Select id="document-type" className="w-full" value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType | "")}>
                <option value="">Detect automatically</option>
                <option value="INVOICE">Invoice</option>
                <option value="CONTRACT">Contract</option>
                <option value="HR">HR document</option>
                <option value="GENERAL">General business document</option>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">Automatic detection works well for clear business documents.</p>
            </div>

            {mutation.isError ? <Alert title="Upload failed" variant="danger">{mutation.error.message}</Alert> : null}

            <Button size="lg" disabled={!file || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <UploadCloud data-icon="inline-start" />}
              {mutation.isPending ? "Extracting and validating..." : "Upload and process"}
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">What happens next</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              {[
                ["1", "Text extraction", "PDF, DOCX or image OCR"],
                ["2", "AI structuring", "Schema-specific fields"],
                ["3", "Control checks", "Validation and risk rules"],
                ["4", "Human review", "Approve, reject or request info"],
              ].map(([step, title, detail]) => (
                <div key={step} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{step}</span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Alert title="Human-in-the-loop by design">
            AI output is never auto-approved. Reviewers can correct every field before export.
          </Alert>
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            Files stay on your local development machine.
          </div>
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <Image className="size-4" aria-hidden="true" />
            OCR is used only when image extraction is required.
          </div>
        </div>
      </div>
    </div>
  )
}
