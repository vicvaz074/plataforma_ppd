"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type InsightItem = {
  title: string
  owner: string
  score: number
  status: "low" | "medium" | "high"
  actionLabel: string
  href: string
}

type ModuleInteractivePanelProps = {
  title: string
  description: string
  items: InsightItem[]
}

const statusLabel: Record<InsightItem["status"], string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
}

const statusBadgeClass: Record<InsightItem["status"], string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
}

export function ModuleInteractivePanel({ title, description, items }: ModuleInteractivePanelProps) {
  const [selectedStatus, setSelectedStatus] = useState<InsightItem["status"] | "all">("all")

  const visibleItems = useMemo(() => {
    if (selectedStatus === "all") return items
    return items.filter((item) => item.status === selectedStatus)
  }, [items, selectedStatus])

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Todos" },
            { key: "high", label: "Alta prioridad" },
            { key: "medium", label: "Media" },
            { key: "low", label: "Baja" },
          ].map((option) => (
            <Button
              type="button"
              key={option.key}
              variant={selectedStatus === option.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(option.key as InsightItem["status"] | "all")}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleItems.map((item) => (
          <div key={item.title} className="rounded-lg border p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-sm">{item.title}</p>
              <Badge className={statusBadgeClass[item.status]} variant="outline">
                {statusLabel[item.status]}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">Responsable: {item.owner}</p>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Avance</span>
                <span className="font-semibold">{item.score}%</span>
              </div>
              <Progress value={item.score} />
            </div>

            <Button asChild variant="ghost" className="w-full justify-start px-2 h-8">
              <Link href={item.href}>{item.actionLabel}</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
