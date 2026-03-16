"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { 
  CalendarClock, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  GripVertical,
  Maximize2,
  Loader2,
  CalendarOff,
} from "lucide-react"
import { useAppointments } from "@/lib/appointments-context"
import { useEmployees } from "@/lib/employees-context"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { format, addDays, isSameDay } from "date-fns"
import { uk } from "date-fns/locale"

export default function SchedulerPage() {
  const router = useRouter()
  const { appointments, isLoading, fetchAppointments, reschedule } = useAppointments()
  const { employees } = useEmployees()
  const { user } = useAuth()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [fallbackMechanics, setFallbackMechanics] = useState<{id: number; firstName: string; lastName: string; role: string}[]>([])

  const canDrag = user?.role === "ADMIN" || user?.role === "MANAGER"
  
  const hourHeight = 80
  const startHour = 8
  const endHour = 20
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  // If useEmployees returns empty (mechanic role can't fetch), load mechanics from API directly
  useEffect(() => {
    if (employees.length === 0 && user) {
      api.get("/users/employees").then(({ data }) => {
        const mechs = (data || []).filter((e: any) => e.role === "MECHANIC")
        setFallbackMechanics(mechs)
      }).catch(() => {
        // If API also fails (no access), at least show current user if they're a mechanic
        if (user.role === "MECHANIC") {
          setFallbackMechanics([{ id: user.id, firstName: user.firstName || "", lastName: user.lastName || "", role: "MECHANIC" }])
        }
      })
    }
  }, [employees.length, user])

  // Get mechanics: prefer employees context, fallback to directly fetched list
  const mechanics = useMemo(() => {
    const fromContext = employees.filter(e => e.role === "MECHANIC")
    return fromContext.length > 0 ? fromContext : fallbackMechanics
  }, [employees, fallbackMechanics])

  // Filter appointments for the selected date
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => 
      isSameDay(new Date(appt.scheduledAt), currentDate)
    )
  }, [appointments, currentDate])

  // Handle vertical drag (time change only) — only for ADMIN/MANAGER
  const handleDragEnd = async (apptId: number, info: any, currentTop: number) => {
    if (!canDrag) return

    const deltaY = info.offset.y
    const newTop = currentTop + deltaY
    const newMinutesOffset = (newTop / hourHeight) * 60
    const newDate = new Date(currentDate)
    newDate.setHours(startHour)
    newDate.setMinutes(0)
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    newDate.setMinutes(newMinutesOffset)
    
    // Round to 15 min intervals
    const roundedMinutes = Math.round(newDate.getMinutes() / 15) * 15
    newDate.setMinutes(roundedMinutes)

    // Clamp to working hours
    if (newDate.getHours() < startHour) {
      newDate.setHours(startHour)
      newDate.setMinutes(0)
    }
    if (newDate.getHours() >= endHour) {
      newDate.setHours(endHour - 1)
      newDate.setMinutes(45)
    }

    try {
      const scheduledAt = newDate.toISOString().replace(".000Z", "")
      const result = await reschedule(apptId, scheduledAt)
      
      if (!result.success) {
        throw new Error(result.error || "Не вдалося змінити час")
      }

      toast({ 
        title: "Час оновлено", 
        description: `Новий час: ${format(newDate, "HH:mm")}`,
        variant: "success" 
      })

    } catch (error: any) {
       toast({ title: "Помилка", description: error.message, variant: "destructive" })
    }
  }

  const formatHour = (hour: number) => `${hour.toString().padStart(2, "0")}:00`

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background/50 backdrop-blur-3xl">
        <PageHeader title="Планувальник" description="Візуальне управління завантаженням сервісу" />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Завантаження розкладу...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-background/50 backdrop-blur-3xl">
      <PageHeader 
        title="Планувальник" 
        description={canDrag ? "Перетягуйте картки для зміни часу" : "Перегляд розкладу на день"}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-card/50 backdrop-blur-xl p-0.5 shadow-sm">
            <Button variant="ghost" size="icon" className="size-8 rounded-md" onClick={() => setCurrentDate(addDays(currentDate, -1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="px-3 text-xs sm:text-sm font-semibold min-w-[100px] sm:min-w-[140px] text-center">
              {format(currentDate, "d MMMM, EE", { locale: uk })}
            </div>
            <Button variant="ghost" size="icon" className="size-8 rounded-md" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          
          <Button variant="outline" size="icon" className="size-9 bg-card/50" onClick={() => setCurrentDate(new Date())} title="Сьогодні">
            <CalendarClock className="size-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="relative flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">
        {mechanics.length === 0 ? (
          /* No mechanics */
          <div className="flex h-full items-center justify-center">
            <Card className="flex flex-col items-center gap-3 p-8 text-center border-dashed">
              <User className="size-10 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-foreground">Механіків не знайдено</p>
                <p className="text-xs text-muted-foreground mt-1">Додайте механіків у розділі «Персонал»</p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="min-w-[700px] rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full" id="scheduler-grid">
            
            {/* Header Row — Mechanic Columns */}
            <div className="flex border-b border-border/50 bg-muted/40 sticky top-0 z-20 backdrop-blur-md">
              <div className="w-16 sm:w-20 shrink-0 border-r border-border/50 bg-muted/20 flex items-center justify-center">
                <Clock className="size-4 text-muted-foreground/50" />
              </div>
              <div className="flex flex-1">
                {mechanics.map((mech) => (
                  <div key={mech.id} className="flex-1 border-r border-border/50 last:border-r-0 py-3 sm:py-4 px-2 sm:px-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center mb-2 text-primary">
                        <User className="size-4" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
                        Механік
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-foreground/90 truncate max-w-full">
                        {mech.firstName} {mech.lastName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid Content */}
            <div className="flex relative flex-1 min-h-[960px]">
              
              {/* Time Column */}
              <div className="w-16 sm:w-20 shrink-0 border-r border-border/50 bg-muted/10 relative z-10">
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className="relative text-[10px] sm:text-[11px] font-bold text-muted-foreground/50 pr-2 sm:pr-3 text-right pointer-events-none"
                    style={{ height: hourHeight }}
                  >
                    <span className="absolute top-0 right-2 sm:right-3 -translate-y-1/2">
                      {formatHour(hour)}
                    </span>
                    <div className="absolute top-0 left-full w-[2000px] border-t border-border/10" />
                    <div className="absolute top-[40px] left-full w-[2000px] border-t border-dashed border-border/5" />
                  </div>
                ))}
              </div>

              {/* Mechanic Columns with Appointments */}
              <div className="flex flex-1 relative">
                {mechanics.map((mech) => {
                  const columnAppointments = filteredAppointments.filter(
                    appt => appt.order?.mechanic?.id === mech.id
                  )

                  return (
                    <div 
                      key={mech.id} 
                      className="flex-1 border-r border-border/50 last:border-r-0 relative group"
                    >
                      {/* Column hover highlight */}
                      <div className="absolute inset-0 group-hover:bg-primary/[0.03] transition-colors" />
                      
                      {/* Empty column state */}
                      {columnAppointments.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <p className="text-[10px] text-muted-foreground/30 rotate-[-90deg] whitespace-nowrap select-none">
                            Немає записів
                          </p>
                        </div>
                      )}
                      
                      {/* Appointment Cards */}
                      {columnAppointments.map((appt) => {
                        const date = new Date(appt.scheduledAt)
                        const h = date.getHours()
                        const m = date.getMinutes()
                        const top = (h - startHour + m / 60) * hourHeight
                        const duration = appt.estimatedMin || 60
                        const height = (duration / 60) * hourHeight
                        const ownerName = appt.order?.car?.user 
                          ? `${appt.order.car.user.firstName} ${appt.order.car.user.lastName}` 
                          : null

                        const cardContent = (
                          <>
                            {/* Status Side Marker */}
                            <div className={cn(
                              "absolute top-0 left-0 w-1 h-full rounded-l-xl",
                              appt.status === "SCHEDULED" && "bg-blue-500",
                              appt.status === "CONFIRMED" && "bg-primary",
                              appt.status === "ARRIVED" && "bg-amber-500",
                              appt.status === "COMPLETED" && "bg-emerald-500",
                              appt.status === "CANCELLED" && "bg-destructive"
                            )} />

                            <div className="flex items-start justify-between mb-1">
                              <div className="flex flex-col gap-0.5 overflow-hidden">
                                <span className="text-[10px] font-bold text-primary/80 flex items-center gap-1">
                                  <Clock className="size-2.5" />
                                  {format(date, "HH:mm")} – {format(new Date(date.getTime() + duration * 60000), "HH:mm")}
                                </span>
                                <p className="text-xs font-semibold text-foreground/90 truncate">
                                  {appt.order?.car?.brand} {appt.order?.car?.model}
                                </p>
                              </div>
                              {canDrag && (
                                <GripVertical className="size-3.5 text-muted-foreground/20 group-hover/appt:text-muted-foreground/50 transition-colors shrink-0" />
                              )}
                            </div>

                            <p className="text-[10px] text-muted-foreground/80 leading-relaxed line-clamp-2">
                              {appt.order?.description || "Без опису"}
                            </p>
                            
                            {height > 70 && (
                              <div className="mt-auto flex items-center justify-between pt-1.5 border-t border-border/50">
                                <div className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground/70">
                                  <Maximize2 className="size-2.5 text-primary/50" />
                                  {duration} хв
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {ownerName && (
                                    <span className="text-[9px] text-muted-foreground/60 truncate max-w-[60px]" title={ownerName}>
                                      {ownerName}
                                    </span>
                                  )}
                                  <span className="text-[9px] font-bold text-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded">
                                    {appt.order?.car?.plate}
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )

                        if (canDrag) {
                          return (
                            <motion.div
                              key={appt.id}
                              drag="y"
                              dragElastic={0.05}
                              dragMomentum={false}
                              onDragEnd={(_, info) => handleDragEnd(appt.id, info, top)}
                              whileHover={{ scale: 1.02, zIndex: 50, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                              whileDrag={{ scale: 1.05, zIndex: 100, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                              className={cn(
                                "absolute left-1.5 right-1.5 rounded-xl border p-2.5 cursor-grab active:cursor-grabbing select-none overflow-hidden transition-colors group/appt",
                                "bg-card/90 backdrop-blur-md border-border/50 shadow-sm z-10",
                                "hover:border-primary/50",
                                appt.status === "COMPLETED" && "bg-emerald-500/5 border-emerald-500/20 opacity-80",
                                appt.status === "ARRIVED" && "ring-1 ring-primary/30 bg-primary/5 border-primary/20",
                                appt.status === "CANCELLED" && "opacity-40 grayscale pointer-events-none"
                              )}
                              style={{ 
                                top, 
                                height: Math.max(height, 50),
                              }}
                              onDoubleClick={() => appt.orderId && router.push(`/orders-detail/${appt.orderId}`)}
                              title="Перетягніть для зміни часу • Подвійний клік — деталі замовлення"
                            >
                              {cardContent}
                            </motion.div>
                          )
                        }

                        // Read-only card for mechanics
                        return (
                          <div
                            key={appt.id}
                            className={cn(
                              "absolute left-1.5 right-1.5 rounded-xl border p-2.5 select-none overflow-hidden cursor-pointer transition-colors group/appt",
                              "bg-card/90 backdrop-blur-md border-border/50 shadow-sm z-10",
                              "hover:border-primary/50 hover:shadow-md",
                              appt.status === "COMPLETED" && "bg-emerald-500/5 border-emerald-500/20 opacity-80",
                              appt.status === "ARRIVED" && "ring-1 ring-primary/30 bg-primary/5 border-primary/20",
                              appt.status === "CANCELLED" && "opacity-40 grayscale"
                            )}
                            style={{ 
                              top, 
                              height: Math.max(height, 50),
                            }}
                            onClick={() => appt.orderId && router.push(`/orders-detail/${appt.orderId}`)}
                            title="Натисніть для перегляду деталей замовлення"
                          >
                            {cardContent}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
                
                {/* Current Time Line */}
                {isSameDay(currentDate, new Date()) && (
                  <CurrentTimeIndicator startHour={startHour} hourHeight={hourHeight} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 sm:p-4 px-4 sm:px-8 border-t bg-card/50 backdrop-blur-md flex flex-wrap justify-between items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-muted-foreground font-medium">
        <div className="flex flex-wrap gap-3 sm:gap-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="size-2 sm:size-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span>Заплановано</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="size-2 sm:size-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
            <span>Підтверджено</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="size-2 sm:size-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span>В роботі</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="size-2 sm:size-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span>Виконано</span>
          </div>
        </div>
        {canDrag && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/10">
            <GripVertical className="size-3" />
            <span>Перетягуйте картки для зміни часу</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CurrentTimeIndicator({ startHour, hourHeight }: { startHour: number, hourHeight: number }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  
  if (currentHour < startHour || currentHour > 20) return null

  const top = (currentHour - startHour + currentMinutes / 60) * hourHeight

  return (
    <div 
      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
      style={{ top }}
    >
      <div className="size-2 rounded-full bg-destructive -ml-1 border-2 border-background shadow-sm" />
      <div className="flex-1 h-px bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
    </div>
  )
}
