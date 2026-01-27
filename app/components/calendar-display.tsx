"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/LanguageContext"
import { translations } from "@/lib/translations"

type CalendarDisplayProps = {
  initialDate?: Date
  onDateSelect?: (date: Date) => void
  className?: string
}

export function CalendarDisplay({ initialDate = new Date(), onDateSelect, className }: CalendarDisplayProps) {
  const { language } = useLanguage()
  const t = translations[language]
  const [currentDate, setCurrentDate] = useState(initialDate)

  // Calculate the current month and year
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Function to get month name in Spanish
  const getMonthName = (month: number) => {
    const monthNames = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ]
    return monthNames[month]
  }

  // Function to calculate days in a month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  // Function to navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Get first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  // Adjust for Monday as first day of week (in Spanish calendar)
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  // Get days in current month
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)

  // Get days in previous month
  const daysInPreviousMonth = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1,
  )

  // Generate calendar days
  const calendarDays = []

  // Add days from previous month
  for (let i = startingDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPreviousMonth - i,
      currentMonth: false,
      date: new Date(
        currentMonth === 0 ? currentYear - 1 : currentYear,
        currentMonth === 0 ? 11 : currentMonth - 1,
        daysInPreviousMonth - i,
      ),
    })
  }

  // Add days from current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      currentMonth: true,
      date: new Date(currentYear, currentMonth, i),
    })
  }

  // Calculate how many days we need from the next month
  const remainingDays = 42 - calendarDays.length // 6 rows of 7 days

  // Add days from next month
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      currentMonth: false,
      date: new Date(
        currentMonth === 11 ? currentYear + 1 : currentYear,
        currentMonth === 11 ? 0 : currentMonth + 1,
        i,
      ),
    })
  }

  // Day abbreviations in Spanish
  const dayAbbreviations = ["lu", "ma", "mi", "ju", "vi", "sá", "do"]

  return (
    <div className={cn("rounded-lg border p-4 w-full max-w-sm mx-auto", className)}>
      <div className="text-center mb-4">
        <span className="text-xl font-medium">
          {getMonthName(currentMonth)} {currentYear}
        </span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dayAbbreviations.map((day) => (
          <div key={day} className="font-medium text-sm py-2">
            {day}
          </div>
        ))}

        {calendarDays.map((item, index) => (
          <button
            key={index}
            className={cn(
              "rounded-md aspect-square flex items-center justify-center text-sm",
              "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              !item.currentMonth && "text-gray-400 dark:text-gray-600",
              item.currentMonth && "font-medium",
            )}
            onClick={() => onDateSelect && onDateSelect(item.date)}
          >
            {item.day}
          </button>
        ))}
      </div>
    </div>
  )
}

