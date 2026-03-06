"use client"

import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { StatusBadge } from "@/components/status-badge"
import { cn } from "@/lib/utils"
import { GripVertical, Eye, Car, User, Hash } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAppointments } from "@/lib/appointments-context"
import { useCrm } from "@/lib/crm-context"
import { useNotifications } from "@/lib/notifications-context"

interface Order {
    id: number
    customerId: number
    vehicleId: number
    carId: number
    description: string
    status: string
    totalAmount: number
    createdAt: string
    car?: {
        brand: string
        model: string
        year: number
        plate: string
        userId: number
    }
}

interface Vehicle {
    id: number
    brand: string
    model: string
    plate: string
    userId: number
}

interface Customer {
    id: number
    firstName: string
    lastName: string
}

interface KanbanColumn {
    id: string
    title: string
    statuses: string[]
    color: string
    bgColor: string
    dropStatus: string
}

const columns: KanbanColumn[] = [
    {
        id: "pending",
        title: "Очікує",
        statuses: ["PENDING"],
        color: "bg-amber-500",
        bgColor: "bg-amber-500/5 border-amber-500/20",
        dropStatus: "PENDING",
    },
    {
        id: "confirmed",
        title: "Підтверджено",
        statuses: ["CONFIRMED"],
        color: "bg-blue-500",
        bgColor: "bg-blue-500/5 border-blue-500/20",
        dropStatus: "CONFIRMED",
    },
    {
        id: "in_progress",
        title: "В роботі",
        statuses: ["IN_PROGRESS"],
        color: "bg-violet-500",
        bgColor: "bg-violet-500/5 border-violet-500/20",
        dropStatus: "IN_PROGRESS",
    },
    {
        id: "waiting_parts",
        title: "Очікує запчастини",
        statuses: ["WAITING_PARTS"],
        color: "bg-orange-500",
        bgColor: "bg-orange-500/5 border-orange-500/20",
        dropStatus: "WAITING_PARTS",
    },
    {
        id: "completed",
        title: "Завершено",
        statuses: ["COMPLETED", "PAID"],
        color: "bg-emerald-500",
        bgColor: "bg-emerald-500/5 border-emerald-500/20",
        dropStatus: "COMPLETED",
    },
]

interface KanbanBoardProps {
    orders: Order[]
    vehicles: Vehicle[]
    customers: Customer[]
    updateStatus: (id: number, status: string) => Promise<void>
    canDrag: boolean
}

export function KanbanBoard({ orders, vehicles, customers, updateStatus, canDrag }: KanbanBoardProps) {
    const router = useRouter()
    const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

    const { appointments, updateStatus: updateAppointmentStatus } = useAppointments()
    const { refreshData } = useCrm()
    const { fetchNotifications } = useNotifications()

    // Filter out cancelled orders for kanban view
    const activeOrders = orders.filter(o => o.status !== "CANCELLED")

    const getColumnOrders = useCallback((col: KanbanColumn) => {
        return activeOrders
            .filter(o => col.statuses.includes(o.status))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [activeOrders])

    const handleDragStart = (e: React.DragEvent, orderId: number) => {
        if (!canDrag) return
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", String(orderId))
        setDraggedOrderId(orderId)
    }

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        if (!canDrag) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOverColumn(columnId)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = async (e: React.DragEvent, column: KanbanColumn) => {
        if (!canDrag) return
        e.preventDefault()
        setDragOverColumn(null)
        setDraggedOrderId(null)

        const orderId = Number(e.dataTransfer.getData("text/plain"))
        const order = orders.find(o => o.id === orderId)
        if (!order) return

        // Don't update if already in the target column
        if (column.statuses.includes(order.status)) return

        try {
            await updateStatus(orderId, column.dropStatus)

            // Sync appointment status
            const orderToApptStatus: Record<string, string> = {
                CONFIRMED: "CONFIRMED",
                IN_PROGRESS: "ARRIVED",
                COMPLETED: "COMPLETED",
                PAID: "COMPLETED",
                CANCELLED: "CANCELLED",
            }
            const apptStatus = orderToApptStatus[column.dropStatus]
            if (apptStatus) {
                const relatedAppt = appointments.find(a => a.orderId === orderId)
                if (relatedAppt && relatedAppt.status !== apptStatus) {
                    await updateAppointmentStatus(relatedAppt.id, apptStatus)
                }
            }

            refreshData()
            fetchNotifications()
            toast({ title: "Статус оновлено", variant: "success" })
        } catch {
            toast({ title: "Не вдалося оновити статус", variant: "destructive" })
        }
    }

    const handleDragEnd = () => {
        setDraggedOrderId(null)
        setDragOverColumn(null)
    }

    return (
        <div className="kanban-board">
            {columns.map(col => {
                const colOrders = getColumnOrders(col)
                const isOver = dragOverColumn === col.id

                return (
                    <div
                        key={col.id}
                        className={cn(
                            "kanban-column",
                            isOver && "kanban-column-drag-over"
                        )}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col)}
                    >
                        {/* Column header */}
                        <div className="kanban-column-header">
                            <div className={cn("kanban-column-indicator", col.color)} />
                            <h3 className="kanban-column-title">{col.title}</h3>
                            <span className="kanban-column-count">{colOrders.length}</span>
                        </div>

                        {/* Cards */}
                        <div className="kanban-column-content">
                            {colOrders.map(order => {
                                const vehicleData = order.car || vehicles.find(v => v.id === (order.carId || order.vehicleId))
                                const customer = customers.find(c => c.id === vehicleData?.userId)
                                const isDragging = draggedOrderId === order.id

                                return (
                                    <div
                                        key={order.id}
                                        draggable={canDrag}
                                        onDragStart={(e) => handleDragStart(e, order.id)}
                                        onDragEnd={handleDragEnd}
                                        className={cn(
                                            "kanban-card",
                                            isDragging && "kanban-card-dragging",
                                            canDrag && "kanban-card-draggable"
                                        )}
                                    >
                                        <div className="kanban-card-header">
                                            <div className="kanban-card-id">
                                                <Hash className="size-3 text-muted-foreground" />
                                                <span className="font-mono text-xs font-semibold text-foreground">{order.id}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {canDrag && (
                                                    <GripVertical className="size-3.5 text-muted-foreground/50 shrink-0 cursor-grab" />
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        router.push(`/orders-detail/${order.id}`)
                                                    }}
                                                    className="kanban-card-details-btn"
                                                    title="Деталі"
                                                >
                                                    <Eye className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {vehicleData && (
                                            <div className="kanban-card-vehicle">
                                                <Car className="size-3 text-muted-foreground shrink-0" />
                                                <span className="truncate text-xs text-foreground">
                                                    {vehicleData.brand} {vehicleData.model}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {vehicleData.plate || ""}
                                                </span>
                                            </div>
                                        )}

                                        {customer && (
                                            <div className="kanban-card-customer">
                                                <User className="size-3 text-muted-foreground shrink-0" />
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {customer.firstName} {customer.lastName}
                                                </span>
                                            </div>
                                        )}

                                        {order.description && (
                                            <p className="kanban-card-desc">
                                                {order.description}
                                            </p>
                                        )}

                                        <div className="kanban-card-footer">
                                            <StatusBadge status={order.status.toLowerCase()} />
                                            <span className="text-xs font-semibold text-foreground">
                                                {Number(order.totalAmount || 0).toLocaleString()} ₴
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}

                            {colOrders.length === 0 && (
                                <div className="kanban-empty">
                                    <p>Немає замовлень</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
