import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  completed: "bg-success/15 text-success border-success/20",
  "in_progress": "bg-primary/15 text-primary border-primary/20",
  pending: "bg-warning/15 text-warning border-warning/20",
  cancelled: "bg-destructive/15 text-destructive border-destructive/20",
  scheduled: "bg-muted text-muted-foreground border-border",
  confirmed: "bg-primary/15 text-primary border-primary/20",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] || "bg-muted text-muted-foreground border-border"
      )}
    >
      <span
        className={cn(
          "mr-1.5 size-1.5 rounded-full",
          status === "completed" && "bg-success",
          status === "in_progress" && "bg-primary",
          status === "pending" && "bg-warning",
          status === "cancelled" && "bg-destructive",
          status === "scheduled" && "bg-muted-foreground",
          status === "confirmed" && "bg-primary"
        )}
      />
      {status.replace(/[-_]/g, " ")}
    </span>
  )
}
