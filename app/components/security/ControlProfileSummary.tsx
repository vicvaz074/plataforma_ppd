"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { ControlProfile } from "@/lib/security-controls"

interface ControlProfileSummaryProps {
  profile: ControlProfile
  title?: string
  showWrapperCard?: boolean
}

const CONTROL_CATEGORY_LABELS: Record<
  "administrative" | "network" | "physical",
  string
> = {
  administrative: "Medidas administrativas",
  network: "Medidas técnicas",
  physical: "Medidas físicas",
}

const ControlProfileSummary = ({
  profile,
  title = "Controles recomendados",
  showWrapperCard = false,
}: ControlProfileSummaryProps) => {
  const categorizedLists = profile.lists.reduce(
    (acc, list) => {
      acc[list.category].push(list)
      return acc
    },
    {
      administrative: [] as ControlProfile["lists"],
      network: [] as ControlProfile["lists"],
      physical: [] as ControlProfile["lists"],
    }
  )

  const content = (
    <div className="space-y-6">
      <div className="space-y-1">
        <h4 className="font-semibold text-base">{title}</h4>
        <p className="text-sm text-muted-foreground">
          Nivel BAA: {profile.baaLevel} · Riesgo más alto: {profile.highestRisk.toUpperCase()}
        </p>
      </div>

      {profile.patterns.length === 0 &&
      profile.lists.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No se encontraron controles recomendados para este subinventario.
        </p>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {profile.patterns.length > 0 && (
            <AccordionItem value="basic-controls">
              <AccordionTrigger className="text-base font-semibold">
                Controles básicos
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {profile.patterns.map((pattern) => (
                    <div
                      key={pattern.key}
                      className="rounded-md border bg-muted/30 p-3 space-y-2"
                    >
                      <div>
                        <p className="font-semibold">{pattern.title}</p>
                        <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {pattern.reason}
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {pattern.controls.map((control) => (
                          <li key={control.id}>
                            <span className="font-medium">{control.title}:</span> {control.recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {(profile.lists.length > 0) &&
            (Object.entries(categorizedLists) as [
              "administrative" | "network" | "physical",
              ControlProfile["lists"]
            ][])
              .filter(([, lists]) => lists.length > 0)
              .map(([category, lists]) => (
                <AccordionItem value={`category-${category}`} key={category}>
                  <AccordionTrigger className="text-base font-semibold">
                    {CONTROL_CATEGORY_LABELS[category]}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Accordion type="multiple" className="space-y-2">
                      {lists.map((list) => (
                        <AccordionItem value={list.key} key={list.key}>
                          <AccordionTrigger className="text-left text-sm font-semibold">
                            {list.title}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 text-sm">
                              <p className="text-muted-foreground">{list.description}</p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {list.reason}
                              </p>
                              {list.required.length > 0 && (
                                <div className="space-y-1">
                                  <Badge className="text-xs">Controles necesarios</Badge>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {list.required.map((control) => (
                                      <li key={control.id}>
                                        <span className="font-medium">{control.title}:</span> {control.recommendation}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {list.optional.length > 0 && (
                                <div className="space-y-1">
                                  <Badge variant="secondary" className="text-xs">
                                    Controles opcionales
                                  </Badge>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {list.optional.map((control) => (
                                      <li key={control.id}>
                                        <span className="font-medium">{control.title}:</span> {control.recommendation}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              ))}
        </Accordion>
      )}
    </div>
  )

  if (showWrapperCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  return content
}

export default ControlProfileSummary
