import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  completed: "bg-success/15 text-success border-success/20",
  in_progress: "bg-primary/15 text-primary border-primary/20",
  in_process: "bg-primary/15 text-primary border-primary/20", 
  pending: "bg-warning/15 text-warning border-warning/20",
  received: "bg-blue-500/15 text-blue-600 border-blue-500/20", 
  cancelled: "bg-destructive/15 text-destructive border-destructive/20",
  scheduled: "bg-muted text-muted-foreground border-border",
  confirmed: "bg-primary/15 text-primary border-primary/20",
}

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status?.toLowerCase().replace("-", "_") || "pending"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap",
        statusStyles[normalizedStatus] || "bg-muted text-muted-foreground border-border"
      )}
    >
      <span
        className={cn(
          "mr-1.5 size-1.5 rounded-full",
          normalizedStatus === "completed" && "bg-success",
          (normalizedStatus === "in_progress" || normalizedStatus === "in_process") && "bg-primary",
          normalizedStatus === "pending" && "bg-warning",
          normalizedStatus === "cancelled" && "bg-destructive",
          normalizedStatus === "scheduled" && "bg-muted-foreground",
          normalizedStatus === "confirmed" && "bg-primary",
          normalizedStatus === "received" && "bg-blue-500"
        )}
      />
      {status.toLowerCase().replace(/[-_]/g, " ")}
    </span>
  )
}