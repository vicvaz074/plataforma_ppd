"use client"

import { useState } from "react"
import { legalArticles } from "../types"
import { ChevronDown, ChevronUp, Scale, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function LegalReferences() {
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#2E7D73]/10 flex items-center justify-center">
          <Scale className="h-5 w-5 text-[#2E7D73]" />
        </div>
        <div>
          <h3 className="text-lg" style={{fontWeight:500}}>Referencias legales — LFPDPPP</h3>
          <p className="text-sm text-muted-foreground">Ley Federal de Protección de Datos Personales en Posesión de los Particulares</p>
        </div>
      </div>

      <div className="space-y-3">
        {legalArticles.map((article) => {
          const isExpanded = expandedArticle === article.id
          return (
            <div
              key={article.id}
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                isExpanded
                  ? "border-[#2E7D73]/40 bg-[#2E7D73]/5 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 hover:border-[#2E7D73]/30"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-xs px-2.5 py-1 rounded-lg ${
                      isExpanded
                        ? "border-[#2E7D73] text-[#2E7D73] bg-[#2E7D73]/10"
                        : "border-[#0a0147]/30 text-[#0a0147]"
                    }`}
                  >
                    Art. {article.number}
                  </Badge>
                  <span className="text-sm" style={{fontWeight:500}}>{article.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-[#2E7D73] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed" style={{fontWeight:400}}>
                        {article.text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D73]" />
                    <p className="text-xs text-[#2E7D73]" style={{fontWeight:500}}>
                      {article.relevance}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
