"use client"

import * as React from "react"

export interface ChartDataItem {
  [key: string]: string | number
}

interface BarChartProps {
  data: ChartDataItem[]
  xKey: keyof ChartDataItem
  yKey: keyof ChartDataItem
}

export const BarChart: React.FC<BarChartProps> = ({ data, xKey, yKey }) => (
  <div className="h-64 flex items-end justify-between">
    {data.map((item: ChartDataItem, index: number) => {
      const rawY = item[yKey]
      const value = typeof rawY === "number" ? rawY : parseFloat(String(rawY)) || 0
      return (
        <div
          key={index}
          className="w-8 bg-blue-500"
          style={{ height: `${value / 10}%` }}
        >
          <div className="text-xs text-center">{String(item[xKey])}</div>
        </div>
      )
    })}
  </div>
)

interface LineChartProps {
  data: ChartDataItem[]
  xKey: keyof ChartDataItem
  yKey: keyof ChartDataItem
}

export const LineChart: React.FC<LineChartProps> = ({ data, xKey, yKey }) => (
  <div className="h-64 flex items-end justify-between">
    {data.map((item: ChartDataItem, index: number) => (
      <div key={index} className="w-8 flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <div className="h-full border-l border-blue-500" />
        <div className="text-xs">{String(item[xKey])}</div>
      </div>
    ))}
  </div>
)

interface PieChartProps {
  data: ChartDataItem[]
}

export const PieChart: React.FC<PieChartProps> = ({ data }) => (
  <div className="h-64 relative">
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {data.map((item: ChartDataItem, index: number) => {
        const startAngle = index * (360 / data.length)
        const endAngle = (index + 1) * (360 / data.length)
        const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180)
        const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180)
        const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180)
        const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180)
        const path = `M50 50 L${x1} ${y1} A50 50 0 0 1 ${x2} ${y2} Z`
        const hue = (index * 360) / data.length
        return <path key={index} d={path} fill={`hsl(${hue},70%,50%)`} />
      })}
    </svg>
  </div>
)
