"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { serviceBreakdown } from "@/lib/data"

export function ServiceBreakdown() {
  const maxCount = Math.max(...serviceBreakdown.map((s) => s.count))

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Service Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {serviceBreakdown.map((service) => (
            <div key={service.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{service.name}</span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{service.count} jobs</span>
                  <span className="font-medium text-foreground">
                    ${service.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(service.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
