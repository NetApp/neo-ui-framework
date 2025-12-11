"use client"

import * as React from "react"
import { TrendingDown } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import type { DatabaseSizeResponse } from "@/services/neo-api"

interface ContentSavingsChartProps {
  databaseSize: DatabaseSizeResponse | null
  className?: string
}

// Static chart configuration for content savings
const chartConfig = {
  size: {
    label: "Size (MB)",
  },
  original: {
    label: "Original Files",
    color: "var(--chart-1)",
  },
  content: {
    label: "Extracted Content",
    color: "var(--chart-2)",
  },
  savings: {
    label: "Space Saved",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function ContentSavingsChart({ databaseSize, className }: ContentSavingsChartProps) {
  const chartData = React.useMemo(() => {
    if (!databaseSize) {
      return []
    }

    const originalSizeMB = databaseSize.total_original_file_size_mb
    const contentSizeMB = databaseSize.total_file_content_size_mb
    const savingsMB = originalSizeMB - contentSizeMB

    return [
      {
        type: "content",
        size: contentSizeMB,
        fill: "var(--color-content)",
      },
      {
        type: "savings",
        size: savingsMB > 0 ? savingsMB : 0,
        fill: "var(--color-savings)",
      },
    ]
  }, [databaseSize])

  const totalOriginalSize = React.useMemo(() => {
    if (!databaseSize) return 0
    return databaseSize.total_original_file_size_mb
  }, [databaseSize])

  const savingsPercentage = React.useMemo(() => {
    if (!databaseSize || databaseSize.total_original_file_size_mb === 0) return 0

    const originalSize = databaseSize.total_original_file_size_mb
    const contentSize = databaseSize.total_file_content_size_mb
    const savings = originalSize - contentSize

    return (savings / originalSize) * 100
  }, [databaseSize])

  const savingsInfo = React.useMemo(() => {
    if (!databaseSize) return null

    const originalSize = databaseSize.total_original_file_size_mb
    const contentSize = databaseSize.total_file_content_size_mb
    const savings = originalSize - contentSize

    return {
      originalSize,
      contentSize,
      savings: savings > 0 ? savings : 0,
      compressionRatio: contentSize > 0 ? (originalSize / contentSize).toFixed(1) : "0",
    }
  }, [databaseSize])

  // Custom tooltip to show size details
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && savingsInfo) {
      const data = payload[0].payload
      const percentage = ((data.size / totalOriginalSize) * 100).toFixed(1)

      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">
            {data.type === 'content' ? 'Content Size' : 'Space Saved'}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.type === 'content' ? (
              <>
                Size: {data.size.toFixed(2)} MB ({percentage}%) <br />
                Original Size: {savingsInfo.originalSize.toFixed(2)} MB
              </>
            ) : (
              <>
                Size: {data.size.toFixed(2)} MB ({percentage}%)
              </>
            )}
          </p>
          {data.type === 'savings' && (
            <p className="text-sm text-muted-foreground">
              Compression ratio: {savingsInfo.compressionRatio}:1
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (!databaseSize) {
    return (
      <Card className={`md:col-span-2 lg:col-span-2 flex flex-col ${className || ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Content Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No database data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`md:col-span-2 lg:col-span-2 flex flex-col ${className || ""}`}>
      <CardHeader className="items-center pb-0">
        <CardTitle>Content Extraction Efficiency</CardTitle>
        <CardDescription>Original files vs extracted content size</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<CustomTooltip />}
            />
            <Pie
              data={chartData}
              dataKey="size"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {savingsPercentage.toFixed(1)}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-sm"
                        >
                          Space Saved
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {savingsInfo && (
          <>
            <div className="flex items-center gap-2 leading-none font-medium">
              {savingsInfo.savings.toFixed(2)} MB saved ({savingsInfo.compressionRatio}:1 ratio)
              <TrendingDown className="h-4 w-4" />
            </div>
          </>
        )}
        <div className="text-muted-foreground leading-none text-center">
          Storage efficiency through content extraction
        </div>
      </CardFooter>
    </Card>
  )
}