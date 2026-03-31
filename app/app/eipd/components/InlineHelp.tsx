"use client"

import { useId, useState } from "react"
import { ChevronDown, ChevronUp, Info } from "lucide-react"

import type { HelpContent } from "../registro/catalog"

type InlineHelpProps = {
  helpText?: HelpContent
  buttonLabel?: string
}

const hasHelpContent = (helpText?: HelpContent) =>
  Boolean(helpText?.paragraphs?.length || helpText?.bullets?.length)

export function InlineHelp({ helpText, buttonLabel = "Cómo responder" }: InlineHelpProps) {
  const [open, setOpen] = useState(false)
  const contentId = useId()

  if (!hasHelpContent(helpText)) {
    return null
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={contentId}
        className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-[#0a4abf] transition-colors hover:text-[#08368a]"
      >
        <Info className="h-3.5 w-3.5" />
        {buttonLabel}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open ? (
        <div
          id={contentId}
          className="rounded-xl border border-[#d6e1f6] bg-[#f7fbff] p-3 text-sm text-slate-600"
        >
          <div className="space-y-2">
            {helpText?.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {helpText?.bullets?.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {helpText.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default InlineHelp
