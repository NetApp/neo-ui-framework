"use client"

import * as React from "react"
import { 
    TrendingUp, 
    // File 
} from "lucide-react"
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
  ChartTooltipContent,
} from "@/components/ui/chart"

interface FileTypeChartProps {
  fileAnalytics: { file_type: string; count: number; total_size: number }[] | null
}

// Static chart configuration for specific file types
const chartConfig = {
  count: {
    label: "Files",
  },
  pdf: {
    label: "PDF",
    color: "var(--chart-1)",
  },
  doc: {
    label: "DOC",
    color: "var(--chart-2)",
  },
  docx: {
    label: "DOCX",
    color: "var(--chart-3)",
  },
  ppt: {
    label: "PPT",
    color: "var(--chart-4)",
  },
  pptx: {
    label: "PPTX",
    color: "var(--chart-5)",
  },
  txt: {
    label: "TXT",
    color: "var(--chart-1)",
  },
  other: {
    label: "Other",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

export function FileTypeChart({ fileAnalytics }: FileTypeChartProps) {
  const chartData = React.useMemo(() => {
    if (!fileAnalytics || fileAnalytics.length === 0) {
      return []
    }

    // Map file analytics to chart data with proper colors
    return fileAnalytics.map((item) => ({
      fileType: item.file_type.toLowerCase(),
      count: item.count,
      fill: `var(--color-${item.file_type.toLowerCase()})`,
    }))
  }, [fileAnalytics])

  const totalFiles = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  const mostCommonType = React.useMemo(() => {
    if (chartData.length === 0) return null
    return chartData[0]
  }, [chartData])

  if (!fileAnalytics || fileAnalytics.length === 0) {
    return (
      <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Document Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No document data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Document Types Distribution</CardTitle>
        <CardDescription>Breakdown by document type (PDF, DOC, PPT, TXT)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="fileType"
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
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalFiles.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Documents
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
        {mostCommonType && (
          <div className="flex items-center gap-2 leading-none font-medium">
            Most common: {mostCommonType.fileType.toUpperCase()} ({mostCommonType.count.toLocaleString()} files)
            <TrendingUp className="h-4 w-4" />
          </div>
        )}
        <div className="text-muted-foreground leading-none">
          Document type distribution across all indexed shares
        </div>
      </CardFooter>
    </Card>
  )
}