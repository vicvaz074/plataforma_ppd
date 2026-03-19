import Image from "next/image"
import { ArrowUpRight, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const contactEmail = "davaragovernance@davara.com.mx"
const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent("Quiero adquirir Alicia")}`

export default function AliciaPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#e2e8f0_52%,_#cbd5e1_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_52%,_#020617_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Card className="relative overflow-hidden border border-white/50 bg-white/90 p-8 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/80 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-white/20" />
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
          <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-slate-200/70 blur-3xl dark:bg-slate-700/20" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-8">
              <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:border-slate-800 dark:bg-white/5 dark:text-slate-300">
                Davara Governance
              </span>

              <div className="space-y-6">
                <div className="inline-flex rounded-[28px] bg-slate-950 px-6 py-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.9)]">
                  <div className="relative h-16 w-[220px] sm:h-20 sm:w-[280px]">
                    <Image
                      src="/images/Alicia_Sin_Despachos.png"
                      alt="Alicia"
                      fill
                      priority
                      sizes="(min-width: 640px) 280px, 220px"
                      className="object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.14)]"
                    />
                  </div>
                </div>

                <div className="max-w-2xl space-y-4">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    Tu asistente legal con IA
                  </h1>
                  <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
                    Asistente legal con IA desarrollado por Davara Governance.
                  </p>
                  <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
                    Para adquirir Alicia, contáctanos y te acompañamos en una implementación personalizada para tu operación.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950 p-6 text-white shadow-[0_24px_64px_-36px_rgba(15,23,42,0.9)]">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.24em] text-slate-400">
                <Mail className="h-4 w-4" />
                <span>Escríbenos a</span>
              </div>

              <a
                href={contactHref}
                className="mt-6 block text-xl font-semibold tracking-tight text-white underline decoration-white/20 underline-offset-4 transition hover:decoration-white"
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
