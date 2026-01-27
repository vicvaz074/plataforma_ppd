"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronDown, ChevronUp, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { isWithinInterval, parse } from "date-fns"
import { historyRecords, type HistoryRecord } from "@/lib/history"
import { useLanguage } from "@/lib/LanguageContext"
import { translations } from "@/lib/translations"

export default function HistoryPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof HistoryRecord
    direction: "asc" | "desc"
  } | null>(null)

  const handleSort = (key: keyof HistoryRecord) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" }
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" }
      }
      return null
    })
  }

  const filteredAndSortedRecords = [...historyRecords]
    .filter((record) => {
      const matchesSearch =
        !searchQuery ||
        record.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.author.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (startDate && endDate) {
        const recordDate = parse(record.timestamp.split(",")[0], "dd/MM/yyyy", new Date())
        const start = parse(startDate, "yyyy-MM-dd", new Date())
        const end = parse(endDate, "yyyy-MM-dd", new Date())

        return isWithinInterval(recordDate, { start, end })
      }

      return true
    })
    .sort((a, b) => {
      if (!sortConfig) return 0

      const { key, direction } = sortConfig
      const aValue = a[key]
      const bValue = b[key]

      if (aValue < bValue) return direction === "asc" ? -1 : 1
      if (aValue > bValue) return direction === "asc" ? 1 : -1
      return 0
    })

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">{t.history}</h1>

      <div className="space-y-6">
        <div className="space-y-4">
          <Input
            placeholder={t.findPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{t.filterByDate}</span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[200px]"
              />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[200px]" />
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate("")
                    setEndDate("")
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort("documentId")}>
                  {t.documentId}
                  {sortConfig?.key === "documentId" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline w-4 h-4 ml-1" />
                    ))}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                  {t.type}
                  {sortConfig?.key === "type" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline w-4 h-4 ml-1" />
                    ))}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("lastChange")}>
                  {t.lastChange}
                  {sortConfig?.key === "lastChange" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline w-4 h-4 ml-1" />
                    ))}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("author")}>
                  {t.author}
                  {sortConfig?.key === "author" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline w-4 h-4 ml-1" />
                    ))}
                </TableHead>
                <TableHead>{t.changes}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.documentName}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{record.lastChange}</span>
                      <span className="text-sm text-muted-foreground">{record.timestamp}</span>
                    </div>
                  </TableCell>
                  <TableCell>{record.author}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {record.changes.map((change, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                {change}
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t.viewChangeDetails}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}

