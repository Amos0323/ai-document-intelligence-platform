import { forwardRef, type SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring",
        className,
      )}
      {...props}
    />
  ),
)
Select.displayName = "Select"

