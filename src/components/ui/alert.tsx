import type { HTMLAttributes, ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Alert({
  title,
  children,
  variant = "default",
  className,
}: {
  title: string
  children?: ReactNode
  variant?: "default" | "danger" | "warning"
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-3 text-sm",
        variant === "danger" && "border-danger/20 bg-danger/5 text-danger",
        variant === "warning" && "border-warning/25 bg-warning/5 text-warning-foreground",
        variant === "default" && "border-border bg-muted/50",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{title}</p>
        {children ? <div className="text-muted-foreground">{children}</div> : null}
      </div>
    </div>
  )
}

export function AlertActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-2 flex gap-2", className)} {...props} />
}

