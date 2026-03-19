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

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
