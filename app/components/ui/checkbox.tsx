"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onChange"> {
  checked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      className,
      checked = false,
      indeterminate = false,
      onCheckedChange,
      disabled,
      ...props
    },
    ref,
  ) => {
    const dataState = indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"

    const toggle = () => {
      if (disabled) return
      onCheckedChange?.(!checked)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault()
        toggle()
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? "mixed" : checked ? "true" : "false"}
        data-state={dataState}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "peer inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary bg-background text-primary-foreground ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary",
          className,
        )}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {(checked || indeterminate) && <Check className="h-3 w-3" />}
      </button>
    )
  },
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
