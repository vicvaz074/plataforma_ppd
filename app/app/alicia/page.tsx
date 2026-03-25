import Image from "next/image"
import { ArrowUpRight, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const contactEmail = "alicia@davara.com.mx"
const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent("Quiero adquirir Alicia")}`

export default function AliciaPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#18181b] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Card className="relative overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#18181b] p-8 shadow-sm sm:p-10">
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div className="space-y-8">
              <span className="inline-flex w-fit items-center rounded-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-slate-300">
                Davara Governance
              </span>

              <div className="space-y-6">
                <div className="inline-flex">
                  <div className="relative h-16 w-[220px] sm:h-20 sm:w-[280px]">
                    <Image
                      src="/images/Alicia_Sin_Despachos.png"
                      alt="Alicia"
                      fill
                      priority
                      sizes="(min-width: 640px) 280px, 220px"
                      className="object-contain brightness-0 dark:brightness-0 dark:invert"
                    />
                  </div>
                </div>

                <div className="max-w-2xl space-y-4">
                  <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    Tu asistente legal con IA
                  </h1>
                  <p className="text-base leading-7 text-gray-600 dark:text-slate-300">
                    Asistente legal con IA desarrollado por Davara Governance.
                  </p>
                  <p className="text-base leading-7 text-gray-600 dark:text-slate-300">
                    Para adquirir Alicia, contáctanos y te acompañamos en una implementación personalizada para tu operación.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-950 p-6 text-white shadow-sm">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.24em] text-slate-400">
                <Mail className="h-4 w-4" />
                <span>Escríbenos a</span>
              </div>

              <a
                href={contactHref}
                className="mt-6 block text-lg font-semibold tracking-tight text-white underline decoration-white/20 underline-offset-4 transition hover:decoration-white break-all"
              >
                {contactEmail}
              </a>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                Implementación personalizada para tu operación, con acompañamiento directo del equipo de Davara Governance.
              </p>

              <Button
                asChild
                className="mt-8 h-11 w-full rounded-full bg-white text-slate-950 shadow-none hover:bg-slate-100"
              >
                <a href={contactHref}>
                  Quiero adquirir Alicia
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
