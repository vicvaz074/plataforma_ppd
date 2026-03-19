"use client"

import { ProceduresPdpWorkspace } from "./procedures-pdp-workspace"

type ProceduresPdpContentProps = {
  section: "register" | "list"
}

export function ProceduresPdpContent({ section }: ProceduresPdpContentProps) {
  return <ProceduresPdpWorkspace initialSection={section === "register" ? "register" : "dashboard"} />
}
