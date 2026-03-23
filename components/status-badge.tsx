import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

const statusStyles: Record<string, string> = {
  completed: "bg-success/15 text-success border-success/20",
  paid: "bg-success/15 text-success border-success/20",
  in_progress: "bg-primary/15 text-primary border-primary/20",
  in_process: "bg-primary/15 text-primary border-primary/20",
  waiting_parts: "bg-orange-500/15 text-orange-600 border-orange-500/20",
  pending: "bg-warning/15 text-warning border-warning/20",
  received: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  cancelled: "bg-destructive/15 text-destructive border-destructive/20",
  scheduled: "bg-muted text-muted-foreground border-border",
  confirmed: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  arrived: "bg-violet-500/15 text-violet-600 border-violet-500/20",
  no_show: "bg-destructive/15 text-destructive border-destructive/20",
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const normalizedStatus = status?.toLowerCase().replace("-", "_") || "pending"

  // We look for status_key in search namespace as it's already used there
  const translatedText = t("status_" + normalizedStatus.toUpperCase(), "search")

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        statusStyles[normalizedStatus] || "bg-muted text-muted-foreground border-border"
      )}
    >
      <span
        className={cn(
          "mr-1.5 size-1.5 rounded-full shrink-0",
          (normalizedStatus === "completed" || normalizedStatus === "paid") && "bg-success",
          (normalizedStatus === "in_progress" || normalizedStatus === "in_process") && "bg-primary",
          normalizedStatus === "waiting_parts" && "bg-orange-500",
          normalizedStatus === "pending" && "bg-warning",
          normalizedStatus === "cancelled" && "bg-destructive",
          normalizedStatus === "scheduled" && "bg-muted-foreground",
          (normalizedStatus === "confirmed" || normalizedStatus === "received") && "bg-blue-500",
          normalizedStatus === "arrived" && "bg-violet-500",
          normalizedStatus === "no_show" && "bg-destructive"
        )}
      />
      {translatedText}
    </span>
  )
}