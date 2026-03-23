"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useServiceRequests } from "@/lib/service-requests-context"
import { Loader2 } from "lucide-react"
import { useSettings } from "@/lib/settings-context"
import { translations } from "@/lib/translations"

export function ServiceRequestsChart() {
  const { requests, isLoading } = useServiceRequests()
  const { settings } = useSettings()

  const t = translations[settings.language].dashboard.charts

  const chartData = useMemo(() => {
    let newReq = 0
    let inReview = 0
    let processed = 0
    let rejected = 0

    requests.forEach((r) => {
      if (r.status === "NEW") newReq++
      else if (r.status === "IN_REVIEW") inReview++
      else if (r.status === "PROCESSED") processed++
      else if (r.status === "REJECTED") rejected++
    })

    return [
      { name: t.statusNew, value: newReq, color: "oklch(0.65 0.18 220)" },           // Blue
      { name: t.statusInReview, value: inReview, color: "oklch(0.80 0.15 90)" },  // Yellow/Orange 
      { name: t.statusProcessed, value: processed, color: "oklch(0.60 0.15 150)" }, // Green
      { name: t.statusRejected, value: rejected, color: "oklch(0.60 0.15 20)" },     // Red
    ].filter(d => d.value > 0)
  }, [requests, t])

  const totalRequests = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{t.statusTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Custom legend to make it look cleaner and more aligned
  const CustomLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-col gap-2 justify-center pl-2">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-2 text-sm">
            <span 
              className="size-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground flex-1">{entry.value}</span>
            <span className="font-semibold">{entry.payload?.value}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card className="border-border bg-card flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-foreground">
          {t.incomingRequests}
        </CardTitle>
        <CardDescription className="text-xs">
          {t.totalRequests} {totalRequests}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4 pt-4">
        <div className="h-[220px] w-full">
          {chartData.length === 0 ? (
            <div className="flex w-full h-full items-center justify-center text-muted-foreground text-sm">
              {t.noRequests}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  cornerRadius={4}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: "oklch(0.22 0.005 260 / 0.5)" }}
                  contentStyle={{
                    backgroundColor: "oklch(0.17 0.005 260)",
                    border: "1px solid oklch(0.26 0.01 260)",
                    borderRadius: "8px",
                    color: "oklch(0.95 0 0)",
                    fontSize: 13,
                  }}
                  itemStyle={{ color: "white" }}
                  formatter={(value: number, name: string) => [
                    `${value} (${((value / totalRequests) * 100).toFixed(0)}%)`,
                    name
                  ]}
                />
                <Legend 
                  content={<CustomLegend />} 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
