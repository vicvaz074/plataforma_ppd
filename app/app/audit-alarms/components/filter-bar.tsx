"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Search } from "lucide-react"
import { motion } from "framer-motion"

interface FilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  priorityFilter: string
  onPriorityFilterChange: (value: string) => void
  moduleFilter: string
  onModuleFilterChange: (value: string) => void
  moduleOptions: { id: string; name: string }[]
  onResetFilters: () => void
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  moduleFilter,
  onModuleFilterChange,
  moduleOptions,
  onResetFilters,
}: FilterBarProps) {
  const hasActiveFilters =
    searchTerm || statusFilter !== "todos" || priorityFilter !== "todas" || moduleFilter !== "todos"

  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-3 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative flex-1"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary/50" />
        <Input
          placeholder="Buscar recordatorios..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 border-primary/20 focus-visible:ring-primary/30"
        />
      </motion.div>

      <div className="flex flex-wrap gap-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px] border-primary/20 focus:ring-primary/30">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en-progreso">En progreso</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className="w-[140px] border-primary/20 focus:ring-primary/30">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las prioridades</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Select value={moduleFilter} onValueChange={onModuleFilterChange}>
            <SelectTrigger className="w-[180px] border-primary/20 focus:ring-primary/30">
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los módulos</SelectItem>
              {moduleOptions.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05, rotate: hasActiveFilters ? 10 : 0 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="icon"
            onClick={onResetFilters}
            title="Restablecer filtros"
            className="text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${hasActiveFilters ? "animate-spin-once" : ""}`} />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
