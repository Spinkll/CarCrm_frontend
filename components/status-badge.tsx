import { cn } from "@/lib/utils"

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
}

const statusTranslations: Record<string, string> = {
  completed: "Виконано",
  paid: "Оплачено",
  in_progress: "В процесі",
  in_process: "В процесі",
  waiting_parts: "Очікує запчастини",
  pending: "Очікує",
  received: "Отримано",
  cancelled: "Скасовано",
  scheduled: "Заплановано",
  confirmed: "Підтверджено",
}

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status?.toLowerCase().replace("-", "_") || "pending"
  
  const translatedText = statusTranslations[normalizedStatus] || status.toLowerCase().replace(/[-_]/g, " ")

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
          (normalizedStatus === "confirmed" || normalizedStatus === "received") && "bg-blue-500"
        )}
      />
      {translatedText}
    </span>
  )
}