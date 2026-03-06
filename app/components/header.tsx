"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/LanguageContext"
import { useSidebar } from "@/lib/SidebarContext"
import { useRouter, usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { translations } from "@/lib/translations"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Moon, Sun, Globe, User, ChevronDown, LogOut, LayoutDashboard } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

export function Header() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { collapsed } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const t = translations[language]
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName")
    if (storedUserName) {
      setUserName(storedUserName)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")

    toast({
      title: t.logout,
      description: t.goodbye || "Has cerrado sesión correctamente.",
    })

    const isFile = window.location.protocol === "file:"
    setTimeout(() => {
      if (isFile) {
        window.location.href = "./login/index.html"
      } else {
        router.push("/login")
      }
    }, 1500)
  }

  const dashboardActive =
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/")

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b bg-white dark:bg-gray-950"
    >
      <div className="flex h-16 items-center px-6 justify-between">
        {/* Left side: logo (when sidebar collapsed) + title */}
        <div className="flex items-center gap-4">
          {/* Logo shown only when sidebar is collapsed */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              width: collapsed ? 150 : 0,
              opacity: collapsed ? 1 : 0,
            }}
          >
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo_davaragovernance.png"
                alt="Davara Governance"
                width={150}
                height={50}
                style={{ objectFit: "contain" }}
                priority
                unoptimized
              />
            </Link>
          </div>

          <div className="hidden md:block">
            <h1 className="text-xl font-normal" style={{ fontFamily: "Futura PT Medium, sans-serif" }}>
              {t.welcomeMessage}
            </h1>
          </div>
        </div>

        {/* Controles a la derecha */}
        <div className="flex items-center gap-4">
          {/* Selector de idioma */}
          <Select value={language} onValueChange={(value: "es" | "en") => setLanguage(value)}>
            <SelectTrigger className="w-[100px]">
              <Globe className="mr-2 h-4 w-4" />
              <SelectValue placeholder={language.toUpperCase()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">ES</SelectItem>
              <SelectItem value="en">EN</SelectItem>
            </SelectContent>
          </Select>

          {/* Panel de control en medio */}
          <Link href="/dashboard">
            <Button
              variant={dashboardActive ? "default" : "outline"}
              className="gap-2"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="hidden sm:inline">{t.dashboard}</span>
            </Button>
          </Link>

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline-block">
                  {userName || t.users}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push("/profile")}>
                {t.profile}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/settings")}>
                {t.settings}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleLogout}>
                <motion.div
                  className="flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.logout}
                </motion.div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botón theme */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: theme === "light" ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </motion.div>
          </Button>
        </div>
      </div>
    </motion.header>
  )
}
