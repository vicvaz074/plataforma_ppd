"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldOff, Lock, ArrowLeft, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  hasModuleAccess,
  hasModulePassword,
  verifyModulePassword,
  isModuleUnlocked,
  unlockModule,
  ALL_MODULES,
} from "@/lib/user-permissions"

interface ModuleGuardProps {
  moduleSlug: string
  children: React.ReactNode
}

export function ModuleGuard({ moduleSlug, children }: ModuleGuardProps) {
  const router = useRouter()
  const [status, setStatus] = useState<"checking" | "allowed" | "denied" | "password-required">("checking")
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState(false)

  useEffect(() => {
    const email = localStorage.getItem("userEmail")
    const role = localStorage.getItem("userRole")

    // Admin always has access
    if (role === "admin") {
      setStatus("allowed")
      return
    }

    // Check module permission
    if (!hasModuleAccess(email, moduleSlug)) {
      setStatus("denied")
      return
    }

    // Check module password
    if (hasModulePassword(moduleSlug) && !isModuleUnlocked(moduleSlug)) {
      setStatus("password-required")
      return
    }

    setStatus("allowed")
  }, [moduleSlug])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const valid = await verifyModulePassword(moduleSlug, passwordInput)
    if (valid) {
      unlockModule(moduleSlug)
      setStatus("allowed")
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  const moduleName = ALL_MODULES.find((m) => m.slug === moduleSlug)?.labelEs || moduleSlug

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (status === "denied") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-6">
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No tienes permiso para acceder al módulo:
          </p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-6">
            {moduleName}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
            Contacta al administrador de la plataforma para solicitar acceso a este módulo.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="gap-2 bg-[#2E7D73] hover:bg-[#246158]"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Button>
        </motion.div>
      </div>
    )
  }

  if (status === "password-required") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Módulo Protegido
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ingresa la contraseña para acceder a <strong>{moduleName}</strong>
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Contraseña del módulo"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value)
                    setPasswordError(false)
                  }}
                  className={`pl-10 ${passwordError ? "border-red-500 focus:ring-red-500" : ""}`}
                  autoFocus
                />
              </div>

              <AnimatePresence>
                {passwordError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-red-500"
                  >
                    Contraseña incorrecta. Inténtalo de nuevo.
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#2E7D73] hover:bg-[#246158]"
                >
                  Desbloquear
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
