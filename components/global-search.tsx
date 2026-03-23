"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Car,
  ClipboardList,
  Search,
  User,
  Package,
  Command as CommandIcon,
  Loader2,
  Phone,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { useOrders } from "@/lib/orders-context"
import { useVehicles } from "@/lib/vehicles-context"
import { useCrm } from "@/lib/crm-context"
import { useInventory } from "@/lib/inventory-context"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

const SEARCH_LIMIT = 5

function normalizeSearchValue(value: string | number | null | undefined) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function matchesSearch(query: string, fields: Array<string | number | null | undefined>) {
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return true
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const haystack = fields.map((field) => normalizeSearchValue(field)).join(" ")

  return tokens.every((token) => haystack.includes(token))
}

export function GlobalSearch() {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()

  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const { orders, isLoading: ordersLoading } = useOrders()
  const { vehicles, isLoading: vehiclesLoading } = useVehicles()
  const { customers, isLoading: customersLoading } = useCrm()
  const { inventory, isLoading: inventoryLoading } = useInventory()

  const formatOrderStatus = (status: string) => {
    return t(`status_${status}`, "search")
  }

  if (!user) return null

  const isStaff = user.role === "ADMIN" || user.role === "MANAGER" || user.role === "MECHANIC"

  const isLoading = isStaff
    ? ordersLoading || vehiclesLoading || customersLoading || inventoryLoading
    : ordersLoading || vehiclesLoading
  const normalizedQuery = normalizeSearchValue(searchValue)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsExpanded(true)

        window.setTimeout(() => {
          inputRef.current?.focus()
        }, 50)
      }

      if (e.key === "Escape") {
        setIsExpanded(false)
        setSearchValue("")
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
        setSearchValue("")
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isExpanded])

  const runCommand = React.useCallback((command: () => void) => {
    setIsExpanded(false)
    setSearchValue("")
    command()
  }, [])

  const orderResults = React.useMemo(() => {
    if (!normalizedQuery) return []
    return orders
      .filter((order) =>
        matchesSearch(searchValue, [
          "замовлення", "order", order.id, order.description, order.status, order.car?.brand, order.car?.model, order.car?.plate,
        ])
      ).slice(0, SEARCH_LIMIT)
  }, [orders, searchValue, normalizedQuery])

  const vehicleResults = React.useMemo(() => {
    if (!normalizedQuery) return []
    return vehicles
      .filter((vehicle) =>
        matchesSearch(searchValue, [
          "авто", "автомобіль", "vehicle", vehicle.brand, vehicle.model, vehicle.plate, vehicle.vin, vehicle.year, vehicle.color,
        ])
      ).slice(0, SEARCH_LIMIT)
  }, [vehicles, searchValue, normalizedQuery])

  const customerResults = React.useMemo(() => {
    if (!normalizedQuery) return []
    return customers
      .filter((customer) =>
        matchesSearch(searchValue, [
          "клієнт", "customer", customer.firstName, customer.lastName, customer.email, customer.phone,
        ])
      ).slice(0, SEARCH_LIMIT)
  }, [customers, searchValue, normalizedQuery])

  const inventoryResults = React.useMemo(() => {
    if (!normalizedQuery) return []
    return inventory
      .filter((item) =>
        matchesSearch(searchValue, [
          "склад", "inventory", "запчастина", item.name, item.sku, item.stockQuantity,
        ])
      ).slice(0, SEARCH_LIMIT)
  }, [inventory, searchValue, normalizedQuery])

  const navigationItems = React.useMemo(() => {
    const items = [
      {
        key: "dashboard", label: t("dashboard"), description: t("adminDesc", "dashboard"), href: "/dashboard", icon: CommandIcon, search: ["панель", "dashboard", "головна"],
      },
      {
        key: "orders", label: t("orders"), description: t("orders", "search"), href: "/orders", icon: ClipboardList, search: ["замовлення", "orders", "сервіс"],
      },
      ...(isStaff
        ? [
          { key: "inventory", label: t("inventory"), description: t("inventory", "search"), href: "/inventory", icon: Package, search: ["склад", "inventory", "запчастини", "sku"] },
          { key: "customers", label: t("customers"), description: t("customers", "search"), href: "/customers", icon: User, search: ["клієнти", "customers", "контакти"] },
        ]
        : []),
    ]

    return items.filter((item) =>
      matchesSearch(searchValue, [item.label, item.description, ...item.search]),
    )
  }, [isStaff, searchValue, t])

  const totalResults = orderResults.length + vehicleResults.length + customerResults.length + inventoryResults.length + navigationItems.length

  const showDropdown = isExpanded

  const searchResultsContent = (
    <>
      {isLoading && totalResults === 0 && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && totalResults === 0 && (
        <CommandEmpty className="flex flex-col items-center py-10 text-center">
          <Search className="mb-3 size-9 text-muted-foreground/60" />
          <p className="font-medium text-foreground">{t("nothingFound", "search")}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("nothingFoundDesc", "search")}
          </p>
        </CommandEmpty>
      )}

      {totalResults > 0 && (
        <>
          {orderResults.length > 0 && (
            <CommandGroup heading={t("orders", "search")}>
              {orderResults.map((order) => (
                <CommandItem
                  key={`order-${order.id}`}
                  value={`order-${order.id}`}
                  onSelect={() => runCommand(() => router.push(`/orders-detail/${order.id}`))}
                  className="cursor-pointer rounded-xl px-3 py-3"
                >
                  <ClipboardList className="size-4 text-primary" />
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{t("orderId", "search")}{order.id}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{order.description}</p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                        {formatOrderStatus(order.status)}
                      </span>
                      {order.car?.plate && <span className="font-mono text-[11px]">{order.car.plate}</span>}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {vehicleResults.length > 0 && (
            <>
              {orderResults.length > 0 && <CommandSeparator />}
              <CommandGroup heading={t("vehicles", "search")}>
                {vehicleResults.map((vehicle) => (
                  <CommandItem
                    key={`vehicle-${vehicle.id}`}
                    value={`vehicle-${vehicle.id}`}
                    onSelect={() => runCommand(() => router.push(`/vehicles/${vehicle.id}`))}
                    className="cursor-pointer rounded-xl px-3 py-3"
                  >
                    <Car className="size-4 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {vehicle.brand} {vehicle.model} {vehicle.plate ? `(${vehicle.plate})` : ""}
                      </p>
                      <p className="truncate font-mono text-xs uppercase text-muted-foreground">
                        {vehicle.vin}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {isStaff && customerResults.length > 0 && (
            <>
              {(orderResults.length > 0 || vehicleResults.length > 0) && <CommandSeparator />}
              <CommandGroup heading={t("customers", "search")}>
                {customerResults.map((customer) => (
                  <CommandItem
                    key={`customer-${customer.id}`}
                    value={`customer-${customer.id}`}
                    onSelect={() => runCommand(() => router.push("/customers"))}
                    className="cursor-pointer rounded-xl px-3 py-3"
                  >
                    <User className="size-4 text-green-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {customer.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3" />
                            {customer.phone}
                          </span>
                        ) : (
                          customer.email
                        )}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {isStaff && inventoryResults.length > 0 && (
            <>
              {(orderResults.length > 0 || vehicleResults.length > 0 || customerResults.length > 0) && <CommandSeparator />}
              <CommandGroup heading={t("inventory", "search")}>
                {inventoryResults.map((item) => (
                  <CommandItem
                    key={`inventory-${item.id}`}
                    value={`inventory-${item.id}`}
                    onSelect={() => runCommand(() => router.push("/inventory"))}
                    className="cursor-pointer rounded-xl px-3 py-3"
                  >
                    <Package className="size-4 text-amber-500" />
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{item.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t("sku", "search")}: {item.sku || t("notSpecified", "search")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          item.stockQuantity <= (item.minStockLevel || 0)
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.stockQuantity} {t("pcs", "search")}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {navigationItems.length > 0 && (
            <>
              {(orderResults.length > 0 || vehicleResults.length > 0 || customerResults.length > 0 || inventoryResults.length > 0) && <CommandSeparator />}
              <CommandGroup heading={t("navigation", "search")}>
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.key}
                      value={item.key}
                      onSelect={() => runCommand(() => router.push(item.href))}
                      className="cursor-pointer rounded-xl px-3 py-3"
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{item.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          )}
        </>
      )}
    </>
  )

  return (
    <>
      <div className="sm:hidden">
        <button
          type="button"
          aria-label={t("openSearch", "search")}
          onClick={() => {
            setIsExpanded(true)
            window.setTimeout(() => {
              inputRef.current?.focus()
            }, 50)
          }}
          className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-border hover:bg-card hover:text-foreground"
        >
          <Search className="size-4" />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] flex flex-col bg-background/98 backdrop-blur-sm"
            >
              <Command shouldFilter={false} className="flex flex-1 flex-col overflow-hidden bg-transparent">
                <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Search className="size-4 shrink-0" />
                  </div>

                  <CommandInput
                    ref={inputRef}
                    placeholder={t("expandedPlaceholder", "search")}
                    value={searchValue}
                    onValueChange={setSearchValue}
                    // @ts-ignore
                    hideIcon
                    className="h-10 min-w-0 flex-1"
                    inputClassName="border-none focus:ring-0"
                  />

                  <button
                    type="button"
                    aria-label={t("closeSearch", "search")}
                    onClick={() => {
                      setIsExpanded(false)
                      setSearchValue("")
                    }}
                    className="shrink-0 rounded-md p-1.5 hover:bg-muted"
                  >
                    <X className="size-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="border-b border-border/40 bg-muted/20 px-4 py-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {normalizedQuery.length > 0 
                      ? `${t("resultsFor", "search")} "${searchValue}"` 
                      : t("globalSearch", "search")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isLoading
                      ? t("updating", "search")
                      : normalizedQuery.length === 0
                        ? t("quickNav", "search")
                        : `${t("found", "search")} ${totalResults} ${t("results", "search")}`}
                  </p>
                </div>

                <CommandList className="flex-1 overflow-y-auto px-2 py-2">
                  {searchResultsContent}
                </CommandList>
              </Command>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "relative z-50 hidden min-w-0 transition-all duration-300 ease-in-out sm:block",
          isExpanded ? "w-full max-w-full sm:w-[420px] lg:w-[640px]" : "sm:w-56 lg:w-72",
        )}
      >
        <Command
          shouldFilter={false}
          className={cn(
            "overflow-visible border bg-background/95 shadow-sm backdrop-blur transition-all",
            isExpanded
              ? "rounded-2xl border-primary/30 bg-card shadow-lg shadow-primary/5"
              : "rounded-xl border-border/70 hover:border-border hover:bg-card",
          )}
        >
          <div className="flex min-w-0 items-center gap-2 px-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                isExpanded ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <Search className="size-4 shrink-0" />
            </div>

            <CommandInput
              ref={inputRef}
              placeholder={
                isExpanded
                  ? t("expandedPlaceholder", "search")
                  : t("placeholder", "search")
              }
              onFocus={() => setIsExpanded(true)}
              value={searchValue}
              onValueChange={setSearchValue}
              // @ts-ignore
              hideIcon
              className="h-11 min-w-0 flex-1"
              inputClassName={cn("border-none focus:ring-0", !isExpanded && "cursor-pointer")}
            />

            {!isExpanded && (
              <Kbd className="hidden shrink-0 border-border/70 bg-muted/60 text-[11px] text-muted-foreground lg:inline-flex">
                Ctrl K
              </Kbd>
            )}

            {isExpanded && (
              <button
                type="button"
                aria-label={t("closeSearch", "search")}
                onClick={() => {
                  setIsExpanded(false)
                  setSearchValue("")
                }}
                className="ml-auto shrink-0 rounded-md p-1.5 hover:bg-muted"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] flex max-h-[min(70vh,460px)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-black/5"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {normalizedQuery.length > 0 
                        ? `${t("resultsFor", "search")} "${searchValue}"` 
                        : t("globalSearch", "search")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isLoading
                        ? t("updating", "search")
                        : normalizedQuery.length === 0
                          ? t("quickNav", "search")
                          : `${t("found", "search")} ${totalResults} ${t("results", "search")}`}
                    </p>
                  </div>

                  <Kbd className="hidden border-border/70 bg-background text-[11px] text-muted-foreground sm:inline-flex">
                    Esc
                  </Kbd>
                </div>

                <CommandList className="max-h-[min(56vh,380px)] flex-1 px-2 py-2">
                  {searchResultsContent}
                </CommandList>
              </motion.div>
            )}
          </AnimatePresence>
        </Command>
      </div>
    </>
  )
}
