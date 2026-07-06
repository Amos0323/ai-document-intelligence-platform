import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/app-shell"
import { PageSkeleton } from "@/components/page-states"

const DashboardPage = lazy(() =>
  import("@/features/dashboard/dashboard-page").then((module) => ({ default: module.DashboardPage })),
)
const DocumentsPage = lazy(() =>
  import("@/features/documents/documents-page").then((module) => ({ default: module.DocumentsPage })),
)
const ReviewPage = lazy(() =>
  import("@/features/review/review-page").then((module) => ({ default: module.ReviewPage })),
)
const UploadPage = lazy(() =>
  import("@/features/upload/upload-page").then((module) => ({ default: module.UploadPage })),
)

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6"><PageSkeleton /></div>}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:id" element={<ReviewPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="settings" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
