// app/layout.tsx
import type { Metadata } from "next"
import { ClientLayout } from "./ClientLayout"
import '../globals.css'

export const metadata: Metadata = {
  title: "DavaraGovernance",
  description: "Plataforma de gestión de cumplimiento de protección de datos",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content={metadata.description || ""} />
        <title>{typeof metadata.title === "string" ? metadata.title : ""}</title>

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
