"use client"

import { useEffect, useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns"
import { uk } from "date-fns/locale"
import {
  BarChart3,
  CalendarRange,
  ClipboardList,
  Coins,
  Download,
  Filter,
  Loader2,
  Package,
  Sparkles,
  TableProperties,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
  Wrench,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useCustomers } from "@/lib/customers-context"
import { useEmployees } from "@/lib/employees-context"
import { useInventory } from "@/lib/inventory-context"
import { useOrders } from "@/lib/orders-context"
import { cn } from "@/lib/utils"
import { useVehicles } from "@/lib/vehicles-context"

type ReportEntity = "orders" | "finance" | "inventory" | "employees" | "customers"
type PeriodPreset = "today" | "week" | "month" | "custom"
type PresetId = "payroll" | "unpaid" | "low-stock" | "abc" | "profit"

type PaymentRecord = {
  id: number
  amount: number
  method: "CASH" | "CARD" | "TRANSFER"
  createdAt: string
}

type OrderDetail = {
  id: number
  status: string
  totalAmount: number
  createdAt: string
  car?: {
    brand?: string
    model?: string
    plate?: string
    userId?: number
  }
  customer?: {
    firstName: string
    lastName: string
    phone?: string
  }
  mechanic?: {
    id: number
    firstName: string
    lastName: string
  } | null
  items?: Array<{
    id: number
    name: string
    quantity: number
    price: number
    type?: "SERVICE" | "PART"
  }>
}

type ReportRow = Record<string, string | number | null>

type ReportColumn = {
  id: string
  label: string
  type?: "text" | "date" | "currency" | "number" | "percent"
  align?: "left" | "right"
}

type SummaryCard = {
  label: string
  value: string
  caption: string
}

type FiltersState = {
  orderStatus: string
  orderBrand: string
  financeMode: string
  inventoryCategory: string
  inventoryMaxStock: string
  employeeRole: string
  customerMinVisits: string
}

type SelectedColumnsState = Record<ReportEntity, string[]>

type NormalizedOrder = {
  id: number
  createdAt: string
  status: string
  customerId: number | null
  customerName: string
  customerPhone: string
  brand: string
  model: string
  plate: string
  carLabel: string
  totalAmount: number
  paidAmount: number
  debt: number
  paymentCount: number
  mechanicId: number | null
  mechanicName: string
  serviceRevenue: number
  partsRevenue: number
  partsCost: number
  profit: number
}

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("uk-UA")

const ENTITY_OPTIONS: Array<{
  id: ReportEntity
  label: string
  description: string
  icon: typeof ClipboardList
}> = [
    {
      id: "orders",
      label: "Замовлення",
      description: "Операційні звіти по роботах, статусах і авто.",
      icon: ClipboardList,
    },
    {
      id: "finance",
      label: "Фінанси",
      description: "Оплати, борги, виручка та рентабельність.",
      icon: Wallet,
    },
    {
      id: "inventory",
      label: "Склад",
      description: "Залишки, мінімальні пороги та закупівлі.",
      icon: Package,
    },
    {
      id: "employees",
      label: "Механіки",
      description: "Зарплати, комісія та продуктивність майстрів.",
      icon: Wrench,
    },
    {
      id: "customers",
      label: "Клієнти",
      description: "LTV, частота візитів і ABC-аналіз.",
      icon: Users,
    },
  ]

const PERIOD_OPTIONS: Array<{ id: PeriodPreset; label: string }> = [
  { id: "today", label: "За сьогодні" },
  { id: "week", label: "Цей тиждень" },
  { id: "month", label: "Цей місяць" },
  { id: "custom", label: "Довільний діапазон" },
]

const ORDER_STATUS_OPTIONS = [
  { value: "ALL", label: "Усі статуси" },
  { value: "PAID", label: "Тільки PAID" },
  { value: "COMPLETED", label: "Тільки COMPLETED" },
  { value: "COMPLETED_OR_PAID", label: "COMPLETED або PAID" },
  { value: "IN_PROGRESS", label: "У роботі" },
]

const FINANCE_MODE_OPTIONS = [
  { value: "ALL", label: "Усі фінансові записи" },
  { value: "DEBT_ONLY", label: "Лише боржники" },
  { value: "PAID_ONLY", label: "Лише повністю оплачені" },
  { value: "COMPLETED_OR_PAID", label: "COMPLETED або PAID" },
]

const EMPLOYEE_ROLE_OPTIONS = [
  { value: "MECHANIC", label: "Тільки механіки" },
  { value: "ALL", label: "Усі ролі" },
]

const COLUMN_DEFINITIONS: Record<ReportEntity, ReportColumn[]> = {
  orders: [
    { id: "date", label: "Дата", type: "date" },
    { id: "orderNumber", label: "Замовлення" },
    { id: "customer", label: "Клієнт" },
    { id: "phone", label: "Телефон" },
    { id: "car", label: "Авто" },
    { id: "brand", label: "Марка" },
    { id: "plate", label: "Номер авто" },
    { id: "status", label: "Статус" },
    { id: "amount", label: "Сума", type: "currency", align: "right" },
    { id: "cost", label: "Собівартість", type: "currency", align: "right" },
    { id: "profit", label: "Чистий прибуток", type: "currency", align: "right" },
    { id: "mechanic", label: "Механік" },
  ],
  finance: [
    { id: "date", label: "Дата", type: "date" },
    { id: "orderNumber", label: "Замовлення" },
    { id: "customer", label: "Клієнт" },
    { id: "phone", label: "Телефон" },
    { id: "car", label: "Авто" },
    { id: "totalAmount", label: "Сума", type: "currency", align: "right" },
    { id: "paidAmount", label: "Оплачено", type: "currency", align: "right" },
    { id: "debt", label: "Борг", type: "currency", align: "right" },
    { id: "serviceRevenue", label: "Послуги", type: "currency", align: "right" },
    { id: "partsRevenue", label: "Запчастини", type: "currency", align: "right" },
    { id: "partsCost", label: "Закупка", type: "currency", align: "right" },
    { id: "profit", label: "Чистий прибуток", type: "currency", align: "right" },
    { id: "paymentsCount", label: "Платежів", type: "number", align: "right" },
  ],
  inventory: [
    { id: "name", label: "Назва" },
    { id: "sku", label: "SKU" },
    { id: "category", label: "Категорія" },
    { id: "stockQuantity", label: "Залишок", type: "number", align: "right" },
    { id: "minStockLevel", label: "Мінімум", type: "number", align: "right" },
    { id: "needToBuy", label: "Докупити", type: "number", align: "right" },
    { id: "purchasePrice", label: "Закупка", type: "currency", align: "right" },
    { id: "retailPrice", label: "Продаж", type: "currency", align: "right" },
  ],
  employees: [
    { id: "mechanic", label: "Механік" },
    { id: "role", label: "Роль" },
    { id: "phone", label: "Телефон" },
    { id: "commissionRate", label: "Його %", type: "percent", align: "right" },
    { id: "baseSalary", label: "Ставка", type: "currency", align: "right" },
    { id: "completedOrders", label: "Кількість робіт", type: "number", align: "right" },
    { id: "totalWorksAmount", label: "Сума робіт", type: "currency", align: "right" },
    { id: "payout", label: "До виплати", type: "currency", align: "right" },
  ],
  customers: [
    { id: "customer", label: "Клієнт" },
    { id: "phone", label: "Телефон" },
    { id: "visits", label: "Візитів", type: "number", align: "right" },
    { id: "carsCount", label: "Авто", type: "number", align: "right" },
    { id: "totalSpent", label: "Сума чеків", type: "currency", align: "right" },
    { id: "avgCheck", label: "Середній чек", type: "currency", align: "right" },
    { id: "segment", label: "ABC сегмент" },
  ],
}

const DEFAULT_COLUMNS: SelectedColumnsState = {
  orders: ["date", "customer", "car", "status", "amount", "cost", "profit"],
  finance: ["date", "customer", "car", "totalAmount", "paidAmount", "debt", "profit"],
  inventory: ["name", "sku", "stockQuantity", "minStockLevel", "needToBuy"],
  employees: ["mechanic", "completedOrders", "totalWorksAmount", "commissionRate", "payout"],
  customers: ["customer", "visits", "totalSpent", "avgCheck", "segment"],
}

const PRESET_META: Array<{
  id: PresetId
  title: string
  description: string
  icon: typeof Coins
}> = [
    {
      id: "payroll",
      title: "Зарплата механіків",
      description: "COMPLETED / PAID за місяць з payout по комісії.",
      icon: Coins,
    },
    {
      id: "unpaid",
      title: "Боржники",
      description: "Завершені замовлення, де оплат менше за підсумок.",
      icon: TriangleAlert,
    },
    {
      id: "low-stock",
      title: "Дефіцит на складі",
      description: "stockQuantity <= minStockLevel з підказкою по закупівлі.",
      icon: Package,
    },
    {
      id: "abc",
      title: "ABC клієнтів",
      description: "Топ-клієнти за виручкою за поточний рік.",
      icon: Users,
    },
    {
      id: "profit",
      title: "Рентабельність",
      description: "Послуги + маржа по запчастинах за місяць.",
      icon: TrendingUp,
    },
  ]

function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0)
}

function formatNumber(value: number) {
  return numberFormatter.format(value || 0)
}

function formatCellValue(column: ReportColumn, value: ReportRow[string]) {
  if (value === null || value === undefined || value === "") {
    return "—"
  }

  if (column.type === "currency") {
    return formatCurrency(Number(value))
  }

  if (column.type === "number") {
    return formatNumber(Number(value))
  }

  if (column.type === "percent") {
    return `${Number(value)}%`
  }

  if (column.type === "date") {
    return format(new Date(String(value)), "dd.MM.yyyy", { locale: uk })
  }

  return String(value)
}

function inferInventoryCategory(itemName: string, sku: string | null) {
  if (sku?.includes("-")) {
    return sku.split("-")[0].toUpperCase()
  }

  const lowerName = itemName.toLowerCase()
  if (lowerName.includes("oil") || lowerName.includes("маст")) return "FLUID"
  if (lowerName.includes("filter") || lowerName.includes("фільтр")) return "FILTER"
  if (lowerName.includes("brake") || lowerName.includes("гальм")) return "BRAKE"
  if (lowerName.includes("spark") || lowerName.includes("свіч")) return "IGNITION"

  return "PARTS"
}

function matchesStatusFilter(status: string, filterValue: string) {
  if (filterValue === "ALL") return true
  if (filterValue === "COMPLETED_OR_PAID") return status === "COMPLETED" || status === "PAID"
  return status === filterValue
}

function csvEscape(value: string) {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export function ReportBuilderPage() {
  const { user } = useAuth()
  const { orders, isLoading: ordersLoading } = useOrders()
  const { inventory, isLoading: inventoryLoading } = useInventory()
  const { customers, isLoading: customersLoading } = useCustomers()
  const { employees, isLoading: employeesLoading } = useEmployees()
  const { vehicles, isLoading: vehiclesLoading } = useVehicles()

  const [entity, setEntity] = useState<ReportEntity>("orders")
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("month")
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null)
  const [customRange, setCustomRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })
  const [filters, setFilters] = useState<FiltersState>({
    orderStatus: "ALL",
    orderBrand: "ALL",
    financeMode: "ALL",
    inventoryCategory: "ALL",
    inventoryMaxStock: "5",
    employeeRole: "MECHANIC",
    customerMinVisits: "1",
  })
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumnsState>(DEFAULT_COLUMNS)
  const [orderDetailsById, setOrderDetailsById] = useState<Record<number, OrderDetail | null>>({})
  const [paymentsByOrderId, setPaymentsByOrderId] = useState<Record<number, PaymentRecord[]>>({})
  const [isEnrichingOrders, setIsEnrichingOrders] = useState(false)

  const canAccess = user?.role === "ADMIN" || user?.role === "MANAGER"

  useEffect(() => {
    if (!canAccess || orders.length === 0) return

    const missingIds = orders
      .map((order) => order.id)
      .filter((orderId) => orderDetailsById[orderId] === undefined || paymentsByOrderId[orderId] === undefined)

    if (missingIds.length === 0) return

    let cancelled = false

    async function enrichOrders() {
      setIsEnrichingOrders(true)

      const detailsPatch: Record<number, OrderDetail | null> = {}
      const paymentsPatch: Record<number, PaymentRecord[]> = {}

      await Promise.all(
        missingIds.map(async (orderId) => {
          const [detailResult, paymentsResult] = await Promise.allSettled([
            api.get(`/orders/${orderId}`),
            api.get(`/payments/order/${orderId}`),
          ])

          detailsPatch[orderId] = detailResult.status === "fulfilled" ? (detailResult.value.data as OrderDetail) : null
          paymentsPatch[orderId] =
            paymentsResult.status === "fulfilled" && Array.isArray(paymentsResult.value.data)
              ? (paymentsResult.value.data as PaymentRecord[])
              : []
        }),
      )

      if (cancelled) return

      setOrderDetailsById((current) => ({ ...current, ...detailsPatch }))
      setPaymentsByOrderId((current) => ({ ...current, ...paymentsPatch }))
      setIsEnrichingOrders(false)
    }

    enrichOrders()

    return () => {
      cancelled = true
    }
  }, [canAccess, orderDetailsById, orders, paymentsByOrderId])

  const earliestOrderDate = useMemo(() => {
    if (orders.length === 0) {
      return startOfYear(new Date())
    }

    return orders.reduce((earliest, order) => {
      const orderDate = new Date(order.createdAt)
      return orderDate < earliest ? orderDate : earliest
    }, new Date(orders[0].createdAt))
  }, [orders])

  const inventoryByName = useMemo(() => {
    return Object.fromEntries(inventory.map((item) => [item.name, item]))
  }, [inventory])

  const normalizedOrders = useMemo<NormalizedOrder[]>(() => {
    return orders.map((order) => {
      const detail = orderDetailsById[order.id]
      const payments = paymentsByOrderId[order.id] || []
      const vehicle = detail?.car || order.car || vehicles.find((item) => item.id === order.carId || item.id === order.vehicleId)
      const matchedCustomer = customers.find((item) => item.id === vehicle?.userId || item.id === order.customerId)
      const detailCustomer = detail?.customer

      const items = detail?.items || order.items || []
      const serviceRevenue = items
        .filter((item) => item.type !== "PART")
        .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
      const partsRevenue = items
        .filter((item) => item.type === "PART")
        .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
      const partsCost = items
        .filter((item) => item.type === "PART")
        .reduce((sum, item) => {
          const stockItem = inventoryByName[item.name]
          return sum + Number(stockItem?.purchasePrice || 0) * Number(item.quantity || 0)
        }, 0)
      const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      const mechanicName = detail?.mechanic ? `${detail.mechanic.firstName} ${detail.mechanic.lastName}` : "—"

      return {
        id: order.id,
        createdAt: detail?.createdAt || order.createdAt,
        status: detail?.status || order.status,
        customerId: matchedCustomer?.id ?? order.customerId ?? null,
        customerName: detailCustomer
          ? `${detailCustomer.firstName} ${detailCustomer.lastName}`
          : matchedCustomer
            ? `${matchedCustomer.firstName} ${matchedCustomer.lastName}`
            : "Невідомий клієнт",
        customerPhone: detailCustomer?.phone || matchedCustomer?.phone || "—",
        brand: vehicle?.brand || "—",
        model: vehicle?.model || "",
        plate: vehicle?.plate || "—",
        carLabel: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate || "—"})` : `Авто #${order.carId || order.vehicleId}`,
        totalAmount: Number(detail?.totalAmount ?? order.totalAmount ?? 0),
        paidAmount,
        debt: Math.max(Number(detail?.totalAmount ?? order.totalAmount ?? 0) - paidAmount, 0),
        paymentCount: payments.length,
        mechanicId: detail?.mechanic?.id ?? null,
        mechanicName,
        serviceRevenue,
        partsRevenue,
        partsCost,
        profit: serviceRevenue + partsRevenue - partsCost,
      }
    })
  }, [customers, inventoryByName, orderDetailsById, orders, paymentsByOrderId, vehicles])

  const periodRange = useMemo(() => {
    const now = new Date()

    if (periodPreset === "today") {
      return {
        from: startOfDay(now),
        to: endOfDay(now),
        label: "За сьогодні",
      }
    }

    if (periodPreset === "week") {
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
        label: "Цей тиждень",
      }
    }

    if (periodPreset === "month") {
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
        label: "Цей місяць",
      }
    }

    const from = startOfDay(customRange.from || now)
    const to = endOfDay(customRange.to || customRange.from || now)

    return {
      from,
      to,
      label: `${format(from, "dd MMM", { locale: uk })} - ${format(to, "dd MMM yyyy", { locale: uk })}`,
    }
  }, [customRange, periodPreset])

  const availableBrands = useMemo(() => {
    const uniqueBrands = Array.from(new Set(normalizedOrders.map((order) => order.brand).filter((brand) => brand && brand !== "—")))
    return uniqueBrands.sort((left, right) => left.localeCompare(right, "uk"))
  }, [normalizedOrders])

  const inventoryRows = useMemo<ReportRow[]>(() => {
    const inventoryLimit = Number(filters.inventoryMaxStock || 0)

    return inventory
      .map((item) => {
        const category = inferInventoryCategory(item.name, item.sku)
        const minStockLevel = Number(item.minStockLevel || 0)
        const needToBuy = Math.max(minStockLevel - Number(item.stockQuantity || 0), 0)

        return {
          name: item.name,
          sku: item.sku || "—",
          category,
          stockQuantity: Number(item.stockQuantity || 0),
          minStockLevel,
          needToBuy,
          purchasePrice: Number(item.purchasePrice || 0),
          retailPrice: Number(item.retailPrice || 0),
        }
      })
      .filter((row) => {
        const matchesCategory = filters.inventoryCategory === "ALL" || row.category === filters.inventoryCategory
        return matchesCategory && Number(row.stockQuantity) <= inventoryLimit
      })
      .sort((left, right) => Number(left.stockQuantity) - Number(right.stockQuantity))
  }, [filters.inventoryCategory, filters.inventoryMaxStock, inventory])

  const inventoryCategories = useMemo(() => {
    const categories = Array.from(new Set(inventory.map((item) => inferInventoryCategory(item.name, item.sku))))
    return categories.sort((left, right) => left.localeCompare(right, "uk"))
  }, [inventory])

  const timeFilteredOrders = useMemo(() => {
    return normalizedOrders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= periodRange.from && orderDate <= periodRange.to
    })
  }, [normalizedOrders, periodRange.from, periodRange.to])

  const orderRows = useMemo<ReportRow[]>(() => {
    return timeFilteredOrders
      .filter((order) => matchesStatusFilter(order.status, filters.orderStatus))
      .filter((order) => filters.orderBrand === "ALL" || order.brand === filters.orderBrand)
      .map((order) => ({
        date: order.createdAt,
        orderNumber: `#${order.id}`,
        customer: order.customerName,
        phone: order.customerPhone,
        car: order.carLabel,
        brand: order.brand,
        plate: order.plate,
        status: order.status,
        amount: order.totalAmount,
        cost: order.partsCost,
        profit: order.profit,
        mechanic: order.mechanicName,
      }))
      .sort((left, right) => new Date(String(right.date)).getTime() - new Date(String(left.date)).getTime())
  }, [filters.orderBrand, filters.orderStatus, timeFilteredOrders])

  const financeRows = useMemo<ReportRow[]>(() => {
    return timeFilteredOrders
      .filter((order) => {
        if (filters.financeMode === "DEBT_ONLY") return order.debt > 0 && order.status === "COMPLETED"
        if (filters.financeMode === "PAID_ONLY") return order.debt === 0 && order.paidAmount > 0
        if (filters.financeMode === "COMPLETED_OR_PAID") return order.status === "COMPLETED" || order.status === "PAID"
        return order.status !== "CANCELLED"
      })
      .map((order) => ({
        date: order.createdAt,
        orderNumber: `#${order.id}`,
        customer: order.customerName,
        phone: order.customerPhone,
        car: order.carLabel,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        debt: order.debt,
        serviceRevenue: order.serviceRevenue,
        partsRevenue: order.partsRevenue,
        partsCost: order.partsCost,
        profit: order.profit,
        paymentsCount: order.paymentCount,
      }))
      .sort((left, right) => Number(right.debt) - Number(left.debt) || new Date(String(right.date)).getTime() - new Date(String(left.date)).getTime())
  }, [filters.financeMode, timeFilteredOrders])

  const employeeRows = useMemo<ReportRow[]>(() => {
    const grouped = new Map<number, { completedOrders: number; totalWorksAmount: number }>()

    timeFilteredOrders
      .filter((order) => (order.status === "COMPLETED" || order.status === "PAID") && order.mechanicId)
      .forEach((order) => {
        const mechanicId = Number(order.mechanicId)
        const current = grouped.get(mechanicId) || { completedOrders: 0, totalWorksAmount: 0 }
        current.completedOrders += 1
        current.totalWorksAmount += order.serviceRevenue > 0 ? order.serviceRevenue : order.totalAmount
        grouped.set(mechanicId, current)
      })

    return employees
      .filter((employee) => (filters.employeeRole === "ALL" ? true : employee.role === filters.employeeRole))
      .map((employee) => {
        const aggregated = grouped.get(employee.id) || { completedOrders: 0, totalWorksAmount: 0 }
        const commissionRate = Number(employee.commissionRate || 0)
        const payout = Number(employee.baseSalary || 0) + aggregated.totalWorksAmount * (commissionRate / 100)

        return {
          mechanic: `${employee.firstName} ${employee.lastName}`,
          role: employee.role,
          phone: employee.phone || "—",
          commissionRate,
          baseSalary: Number(employee.baseSalary || 0),
          completedOrders: aggregated.completedOrders,
          totalWorksAmount: aggregated.totalWorksAmount,
          payout,
        }
      })
      .filter((row) => {
        if (selectedPreset === "payroll") {
          return Number(row.completedOrders) > 0 || Number(row.payout) > 0
        }
        return true
      })
      .sort((left, right) => Number(right.payout) - Number(left.payout))
  }, [employees, filters.employeeRole, selectedPreset, timeFilteredOrders])

  const customerRows = useMemo<ReportRow[]>(() => {
    const grouped = new Map<
      number,
      {
        customer: string
        phone: string
        visits: number
        carsCount: number
        totalSpent: number
        avgCheck: number
      }
    >()

    timeFilteredOrders
      .filter((order) => order.status === "COMPLETED" || order.status === "PAID")
      .forEach((order) => {
        if (!order.customerId) return

        const existing = grouped.get(order.customerId) || {
          customer: order.customerName,
          phone: order.customerPhone,
          visits: 0,
          carsCount: 0,
          totalSpent: 0,
          avgCheck: 0,
        }

        existing.visits = Number(existing.visits) + 1
        existing.totalSpent = Number(existing.totalSpent) + order.totalAmount
        grouped.set(order.customerId, existing)
      })

    const rows = Array.from(grouped.entries())
      .map(([customerId, row]) => {
        const customerVehicles = vehicles.filter((vehicle) => vehicle.userId === customerId)
        return {
          ...row,
          carsCount: customerVehicles.length,
          avgCheck: row.visits > 0 ? row.totalSpent / row.visits : 0,
          customerId,
        }
      })
      .filter((row) => row.visits >= Number(filters.customerMinVisits || 0))
      .sort((left, right) => right.totalSpent - left.totalSpent)

    return rows.map((row, index) => {
      const rankRatio = rows.length === 0 ? 1 : index / rows.length
      let segment = "C"
      if (rankRatio < 0.2) segment = "A"
      else if (rankRatio < 0.5) segment = "B"

      return {
        customer: row.customer,
        phone: row.phone,
        visits: row.visits,
        carsCount: row.carsCount,
        totalSpent: row.totalSpent,
        avgCheck: row.avgCheck,
        segment,
      }
    })
  }, [filters.customerMinVisits, timeFilteredOrders, vehicles])

  const activeRows = useMemo(() => {
    if (entity === "orders") return orderRows
    if (entity === "finance") return financeRows
    if (entity === "inventory") return inventoryRows
    if (entity === "employees") return employeeRows
    return customerRows
  }, [customerRows, employeeRows, entity, financeRows, inventoryRows, orderRows])

  const activeColumns = useMemo(() => {
    const selectedIds = selectedColumns[entity]
    return COLUMN_DEFINITIONS[entity].filter((column) => selectedIds.includes(column.id))
  }, [entity, selectedColumns])

  const summaryCards = useMemo<SummaryCard[]>(() => {
    if (entity === "orders") {
      const totalAmount = orderRows.reduce((sum, row) => sum + Number(row.amount || 0), 0)
      const totalProfit = orderRows.reduce((sum, row) => sum + Number(row.profit || 0), 0)
      return [
        { label: "Замовлень", value: formatNumber(orderRows.length), caption: periodRange.label },
        { label: "Оборот", value: formatCurrency(totalAmount), caption: "Сума по вибірці" },
        { label: "Чистий прибуток", value: formatCurrency(totalProfit), caption: "Послуги + маржа запчастин" },
      ]
    }

    if (entity === "finance") {
      const totalRevenue = financeRows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)
      const totalPaid = financeRows.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0)
      const totalDebt = financeRows.reduce((sum, row) => sum + Number(row.debt || 0), 0)
      return [
        { label: "Виставлено", value: formatCurrency(totalRevenue), caption: periodRange.label },
        { label: "Оплачено", value: formatCurrency(totalPaid), caption: "Сума підтверджених оплат" },
        { label: "Борг", value: formatCurrency(totalDebt), caption: "Несплачені залишки" },
      ]
    }

    if (entity === "inventory") {
      const positionsToBuy = inventoryRows.filter((row) => Number(row.needToBuy) > 0).length
      const shortageUnits = inventoryRows.reduce((sum, row) => sum + Number(row.needToBuy || 0), 0)
      return [
        { label: "Позицій у звіті", value: formatNumber(inventoryRows.length), caption: "З поточним лімітом залишку" },
        { label: "Критичних SKU", value: formatNumber(positionsToBuy), caption: "Потрібна закупівля" },
        { label: "Одиниць докупити", value: formatNumber(shortageUnits), caption: "До мінімального рівня" },
      ]
    }

    if (entity === "employees") {
      const payrollFund = employeeRows.reduce((sum, row) => sum + Number(row.payout || 0), 0)
      const totalWorks = employeeRows.reduce((sum, row) => sum + Number(row.completedOrders || 0), 0)
      return [
        { label: "Механіків", value: formatNumber(employeeRows.length), caption: periodRange.label },
        { label: "Робіт", value: formatNumber(totalWorks), caption: "Завершені / оплачені замовлення" },
        { label: "Фонд виплат", value: formatCurrency(payrollFund), caption: "Ставка + комісія" },
      ]
    }

    const totalSpent = customerRows.reduce((sum, row) => sum + Number(row.totalSpent || 0), 0)
    const totalVisits = customerRows.reduce((sum, row) => sum + Number(row.visits || 0), 0)
    const aClients = customerRows.filter((row) => row.segment === "A").length
    return [
      { label: "Клієнтів", value: formatNumber(customerRows.length), caption: periodRange.label },
      { label: "Візитів", value: formatNumber(totalVisits), caption: "У завершених / оплачених замовленнях" },
      { label: "A-сегмент", value: formatNumber(aClients), caption: `${formatCurrency(totalSpent)} загалом` },
    ]
  }, [customerRows, employeeRows, entity, financeRows, inventoryRows, orderRows, periodRange.label])

  const reportSubtitle = useMemo(() => {
    if (selectedPreset === "payroll") return "Payroll по механіках за вибраний місяць."
    if (selectedPreset === "unpaid") return "Замовлення зі статусом COMPLETED, де борг ще лишився."
    if (selectedPreset === "low-stock") return "Позиції, які вже впали нижче контрольного запасу."
    if (selectedPreset === "abc") return "ABC-аналіз клієнтів за сумою чеків за поточний рік."
    if (selectedPreset === "profit") return "Рентабельність з маржею по запчастинах та послугах."

    const currentEntity = ENTITY_OPTIONS.find((item) => item.id === entity)
    return currentEntity?.description || "Гнучкий конструктор звітів для СТО."
  }, [entity, selectedPreset])

  const handleEntityChange = (value: ReportEntity) => {
    setSelectedPreset(null)
    setEntity(value)
  }

  const handlePeriodChange = (value: PeriodPreset) => {
    setSelectedPreset(null)
    setPeriodPreset(value)
  }

  const updateFilters = (patch: Partial<FiltersState>) => {
    setSelectedPreset(null)
    setFilters((current) => ({ ...current, ...patch }))
  }

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    setSelectedPreset(null)
    setSelectedColumns((current) => {
      const nextColumns = checked
        ? [...current[entity], columnId]
        : current[entity].filter((item) => item !== columnId)

      return {
        ...current,
        [entity]: nextColumns.length > 0 ? nextColumns : current[entity],
      }
    })
  }

  const applyPreset = (presetId: PresetId) => {
    setSelectedPreset(presetId)

    if (presetId === "payroll") {
      setEntity("employees")
      setPeriodPreset("month")
      setFilters((current) => ({
        ...current,
        employeeRole: "MECHANIC",
      }))
      setSelectedColumns((current) => ({
        ...current,
        employees: ["mechanic", "completedOrders", "totalWorksAmount", "commissionRate", "payout"],
      }))
      return
    }

    if (presetId === "unpaid") {
      setEntity("finance")
      setPeriodPreset("custom")
      setCustomRange({
        from: startOfDay(earliestOrderDate),
        to: endOfDay(new Date()),
      })
      setFilters((current) => ({
        ...current,
        financeMode: "DEBT_ONLY",
      }))
      setSelectedColumns((current) => ({
        ...current,
        finance: ["customer", "phone", "car", "debt", "totalAmount", "paidAmount"],
      }))
      return
    }

    if (presetId === "low-stock") {
      setEntity("inventory")
      setPeriodPreset("month")
      setFilters((current) => ({
        ...current,
        inventoryCategory: "ALL",
        inventoryMaxStock: "999999",
      }))
      setSelectedColumns((current) => ({
        ...current,
        inventory: ["name", "sku", "stockQuantity", "minStockLevel", "needToBuy"],
      }))
      return
    }

    if (presetId === "abc") {
      setEntity("customers")
      setPeriodPreset("custom")
      setCustomRange({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
      })
      setFilters((current) => ({
        ...current,
        customerMinVisits: "1",
      }))
      setSelectedColumns((current) => ({
        ...current,
        customers: ["customer", "visits", "totalSpent", "avgCheck", "segment"],
      }))
      return
    }

    setEntity("finance")
    setPeriodPreset("month")
    setFilters((current) => ({
      ...current,
      financeMode: "COMPLETED_OR_PAID",
    }))
    setSelectedColumns((current) => ({
      ...current,
      finance: ["date", "customer", "serviceRevenue", "partsRevenue", "partsCost", "profit"],
    }))
  }

  const handleDownloadCsv = () => {
    if (activeRows.length === 0 || activeColumns.length === 0) return

    const header = activeColumns.map((column) => csvEscape(column.label)).join(";")
    const body = activeRows
      .map((row) =>
        activeColumns
          .map((column) => csvEscape(String(formatCellValue(column, row[column.id]))))
          .join(";"),
      )
      .join("\n")

    const csvContent = `\uFEFF${header}\n${body}`
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `report-${entity}-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleDownloadExcel = () => {
    if (activeRows.length === 0 || activeColumns.length === 0) return

    const headerCells = activeColumns
      .map(
        (column) =>
          `<Cell ss:StyleID="header"><Data ss:Type="String">${xmlEscape(column.label)}</Data></Cell>`,
      )
      .join("")

    const rowsXml = activeRows
      .map((row) => {
        const cells = activeColumns
          .map((column) => {
            const rawValue = row[column.id]

            if (rawValue === null || rawValue === undefined || rawValue === "") {
              return '<Cell><Data ss:Type="String"></Data></Cell>'
            }

            if (column.type === "currency" || column.type === "number" || column.type === "percent") {
              return `<Cell><Data ss:Type="Number">${Number(rawValue) || 0}</Data></Cell>`
            }

            if (column.type === "date") {
              return `<Cell><Data ss:Type="String">${xmlEscape(
                format(new Date(String(rawValue)), "dd.MM.yyyy", { locale: uk }),
              )}</Data></Cell>`
            }

            return `<Cell><Data ss:Type="String">${xmlEscape(String(rawValue))}</Data></Cell>`
          })
          .join("")

        return `<Row>${cells}</Row>`
      })
      .join("")

    const worksheetName = xmlEscape(
      ENTITY_OPTIONS.find((item) => item.id === entity)?.label || "Report",
    )

    const excelContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#E8F1FF" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${worksheetName}">
  <Table>
   <Row>${headerCells}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`

    const blob = new Blob([excelContent], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `report-${entity}-${format(new Date(), "yyyy-MM-dd")}.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const isLoading = ordersLoading || inventoryLoading || customersLoading || employeesLoading || vehiclesLoading

  if (!canAccess) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageHeader
          title="Конструктор звітів"
          description="Доступний тільки для адміністратора або менеджера."
        />
        <div className="flex-1 overflow-auto p-6">
          <Card className="border-border bg-card">
            <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
              <BarChart3 className="size-10 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold text-foreground">Недостатньо прав доступу</p>
                <p className="text-sm text-muted-foreground">
                  Для роботи з конструктором звітів потрібна роль ADMIN або MANAGER.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Конструктор звітів"
        description="4 кроки налаштування, 5 швидких пресетів і жива таблиця, яку можна одразу завантажити."
      />

      <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] p-4 sm:p-6">
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                  <Sparkles className="size-3" />
                  Швидкі пресети
                </Badge>
                <p className="text-sm text-muted-foreground">Один клік для найпопулярніших звітів директорів СТО.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {PRESET_META.map((preset) => {
                const Icon = preset.icon

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className={cn(
                      "group rounded-2xl border p-4 text-left transition-all duration-200",
                      selectedPreset === preset.id
                        ? "border-primary bg-primary/8 shadow-[0_10px_30px_rgba(37,99,235,0.12)]"
                        : "border-border bg-card/90 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
                    )}
                  >
                    <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{preset.title}</p>
                      <p className="text-xs leading-5 text-muted-foreground">{preset.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="border-border bg-card/95 shadow-sm xl:sticky xl:top-0 xl:self-start">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Filter className="size-4" />
                  </div>
                  <div>
                    <CardTitle>Налаштування</CardTitle>
                    <CardDescription>Зліва конфігурація, справа готова таблиця результатів.</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Що аналізуємо?</p>
                      <p className="text-xs text-muted-foreground">Сутність для звіту та таблиці.</p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {ENTITY_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const isActive = entity === option.id

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleEntityChange(option.id)}
                          className={cn(
                            "flex items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                            isActive ? "border-primary bg-primary/8" : "border-border hover:border-primary/30 hover:bg-muted/40",
                          )}
                        >
                          <div
                            className={cn(
                              "mt-0.5 flex size-9 items-center justify-center rounded-xl",
                              isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-foreground">{option.label}</p>
                            <p className="text-xs leading-5 text-muted-foreground">{option.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Період</p>
                      <p className="text-xs text-muted-foreground">Швидкий вибір або довільний діапазон.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {PERIOD_OPTIONS.map((option) => (
                      <Button
                        key={option.id}
                        type="button"
                        variant={periodPreset === option.id ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handlePeriodChange(option.id)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>

                  {periodPreset === "custom" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-start gap-2">
                          <CalendarRange className="size-4" />
                          {periodRange.label}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          numberOfMonths={2}
                          selected={customRange}
                          onSelect={(range) => {
                            setSelectedPreset(null)
                            setCustomRange(range || { from: undefined, to: undefined })
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Фільтри</p>
                      <p className="text-xs text-muted-foreground">Змінюються залежно від вибраної сутності.</p>
                    </div>
                  </div>

                  {entity === "orders" && (
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label>Статус</Label>
                        <Select value={filters.orderStatus} onValueChange={(value) => updateFilters({ orderStatus: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Марка авто</Label>
                        <Select value={filters.orderBrand} onValueChange={(value) => updateFilters({ orderBrand: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Усі марки</SelectItem>
                            {availableBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {entity === "finance" && (
                    <div className="grid gap-2">
                      <Label>Режим вибірки</Label>
                      <Select value={filters.financeMode} onValueChange={(value) => updateFilters({ financeMode: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FINANCE_MODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {entity === "inventory" && (
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label>Категорія</Label>
                        <Select
                          value={filters.inventoryCategory}
                          onValueChange={(value) => updateFilters({ inventoryCategory: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Усі категорії</SelectItem>
                            {inventoryCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Кількість менше або дорівнює</Label>
                        <Input
                          type="number"
                          min="0"
                          value={filters.inventoryMaxStock}
                          onChange={(event) => updateFilters({ inventoryMaxStock: event.target.value || "0" })}
                        />
                      </div>
                    </div>
                  )}

                  {entity === "employees" && (
                    <div className="grid gap-2">
                      <Label>Роль</Label>
                      <Select value={filters.employeeRole} onValueChange={(value) => updateFilters({ employeeRole: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_ROLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {entity === "customers" && (
                    <div className="grid gap-2">
                      <Label>Мінімум візитів</Label>
                      <Input
                        type="number"
                        min="1"
                        value={filters.customerMinVisits}
                        onChange={(event) => updateFilters({ customerMinVisits: event.target.value || "1" })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Колонки</p>
                      <p className="text-xs text-muted-foreground">Користувач сам обирає, що бачити в таблиці.</p>
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-2xl border border-border bg-muted/20 p-3">
                    {COLUMN_DEFINITIONS[entity].map((column) => {
                      const isChecked = selectedColumns[entity].includes(column.id)

                      return (
                        <label
                          key={column.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-background/80"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => handleColumnToggle(column.id, Boolean(checked))}
                          />
                          <span className="text-sm text-foreground">{column.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {summaryCards.map((card) => (
                  <Card key={card.label} className="border-border bg-card/95">
                    <CardHeader className="space-y-1 pb-2">
                      <CardDescription>{card.label}</CardDescription>
                      <CardTitle className="text-2xl">{card.value}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">{card.caption}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-border bg-card/95 shadow-sm">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <TableProperties className="size-3" />
                        Результат
                      </Badge>
                      <Badge variant="secondary">{periodRange.label}</Badge>
                      {selectedPreset && (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                          {PRESET_META.find((preset) => preset.id === selectedPreset)?.title}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <CardTitle>Таблиця звіту</CardTitle>
                      <CardDescription>{reportSubtitle}</CardDescription>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(isLoading || isEnrichingOrders) && (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        Синхронізація даних
                      </div>
                    )}
                    <Button onClick={handleDownloadCsv} disabled={activeRows.length === 0} variant="outline" className="gap-2">
                      <Download className="size-4" />
                      CSV
                    </Button>
                    <Button onClick={handleDownloadExcel} disabled={activeRows.length === 0} className="gap-2">
                      <Download className="size-4" />
                      Завантажити Excel
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2.5 py-1">Рядків: {formatNumber(activeRows.length)}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-1">Сутність: {ENTITY_OPTIONS.find((item) => item.id === entity)?.label}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-1">Колонок: {activeColumns.length}</span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border">
                    <div className="max-h-[720px] overflow-auto">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow className="hover:bg-transparent">
                            {activeColumns.map((column) => (
                              <TableHead
                                key={column.id}
                                className={cn(column.align === "right" && "text-right")}
                              >
                                {column.label}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={Math.max(activeColumns.length, 1)} className="py-12 text-center text-muted-foreground">
                                Дані за поточною конфігурацією не знайдені. Змініть період, фільтри або застосуйте інший пресет.
                              </TableCell>
                            </TableRow>
                          ) : (
                            activeRows.map((row, index) => (
                              <TableRow key={`${entity}-${index}`} className="border-border">
                                {activeColumns.map((column) => (
                                  <TableCell
                                    key={`${column.id}-${index}`}
                                    className={cn(
                                      "text-foreground",
                                      column.align === "right" && "text-right tabular-nums",
                                    )}
                                  >
                                    {formatCellValue(column, row[column.id])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
