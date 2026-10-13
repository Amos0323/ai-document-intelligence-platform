import {
  BarChart3,
  Bell,
  FileCheck2,
  Files,
  LogOut,
  Settings,
  UploadCloud,
} from "lucide-react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navigation = [
  { label: "Overview", to: "/", icon: BarChart3 },
  { label: "Documents", to: "/documents", icon: Files },
  { label: "Review queue", to: "/documents?status=NEEDS_REVIEW", icon: FileCheck2 },
  { label: "Upload", to: "/upload", icon: UploadCloud },
]

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const location = useLocation()
  const reviewQueueSelected =
    location.pathname === "/documents" &&
    new URLSearchParams(location.search).get("status") === "NEEDS_REVIEW"

  return (
    <nav className={cn("flex gap-1", mobile ? "overflow-x-auto px-4 pb-3" : "flex-col px-3")}>
      {navigation.map(({ label, to, icon: Icon }) => {
        const isActive =
          label === "Overview"
            ? location.pathname === "/"
            : label === "Documents"
              ? location.pathname.startsWith("/documents") && !reviewQueueSelected
              : label === "Review queue"
                ? reviewQueueSelected
                : location.pathname === "/upload"
        return (
          <Link
            key={label}
            to={to}
            className={cn(
              "flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              mobile ? "text-muted-foreground" : "text-sidebar-muted hover:bg-white/8 hover:text-white",
              isActive && (mobile ? "bg-primary/10 text-primary" : "bg-primary text-white"),
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-sidebar text-white lg:flex">
        <div className="flex h-18 items-center gap-3 px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <FileCheck2 className="size-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">DocuIntel</div>
            <div className="text-[11px] text-sidebar-muted">Document operations</div>
          </div>
        </div>
        <Navigation />
        <div className="mt-6 px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">Workspace</div>
        <div className="mt-2 px-3">
          <NavLink to="/settings" className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-muted hover:bg-white/8 hover:text-white">
            <Settings className="size-4" aria-hidden="true" />
            Settings
          </NavLink>
        </div>
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">KM</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">Kabelo Mokoena</div>
              <div className="truncate text-xs text-sidebar-muted">Operations team</div>
            </div>
            <LogOut className="size-4 text-sidebar-muted" aria-hidden="true" />
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2 font-semibold">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
                <FileCheck2 className="size-4" aria-hidden="true" />
              </div>
              DocuIntel
            </div>
            <Bell className="size-5 text-muted-foreground" aria-label="Notifications" />
          </div>
          <Navigation mobile />
        </header>
        <main className="mx-auto min-h-screen max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {import.meta.env.VITE_TEMPORARY_DEMO === "true" ? (
            <p role="note" className="mb-5 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
              Portfolio demo: use sample files only. Uploaded documents and review changes reset when the server restarts. The first request may take about a minute while the server wakes up.
            </p>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
