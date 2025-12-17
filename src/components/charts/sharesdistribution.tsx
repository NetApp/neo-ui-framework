// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import * as React from "react"
import { TrendingUp, FolderOpen } from "lucide-react"
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
  //   ChartTooltipContent,
} from "@/components/ui/chart"

interface SharesDistributionChartProps {
  sharesAnalytics: { share_id: string; share_name: string; share_path: string; count: number; total_size: number }[] | null
}

// Generate chart configuration dynamically based on shares analytics data
const generateChartConfig = (sharesAnalytics: { share_id: string; share_name: string; share_path: string; count: number; total_size: number }[]): ChartConfig => {
  const config: ChartConfig = {
    count: {
      label: "Files",
    },
  }

  // Create color mapping for each share
  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ]

  sharesAnalytics.forEach((share, index) => {
    const shareKey = share.share_id
    config[shareKey] = {
      label: share.share_name || share.share_path.split('/').pop() || share.share_path,
      color: colors[index % colors.length],
    }
  })

  return config
}

export function SharesDistributionChart({ sharesAnalytics }: SharesDistributionChartProps) {
  const chartData = React.useMemo(() => {
    if (!sharesAnalytics || sharesAnalytics.length === 0) {
      return []
    }

    // Map shares analytics to chart data
    return sharesAnalytics.map((share) => ({
      shareId: share.share_id,
      shareName: share.share_name || share.share_path.split('/').pop() || share.share_path,
      shareFullPath: share.share_path,
      count: share.count,
      totalSize: share.total_size,
      fill: `var(--color-${share.share_id})`,
    }))
  }, [sharesAnalytics])

  const chartConfig = React.useMemo(() => {
    if (!sharesAnalytics || sharesAnalytics.length === 0) return {}
    return generateChartConfig(sharesAnalytics)
  }, [sharesAnalytics])

  const totalFiles = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])



  const largestShare = React.useMemo(() => {
    if (chartData.length === 0) return null
    return chartData[0]
  }, [chartData])

  // Custom tooltip to show share details
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.count / totalFiles) * 100).toFixed(1)
      const sizeInMB = (data.totalSize / (1024 * 1024)).toFixed(1)

      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.shareName}</p>
          <p className="text-xs text-muted-foreground mb-1">{data.shareFullPath}</p>
          <p className="text-sm text-muted-foreground">
            Files: {data.count.toLocaleString()} ({percentage}%)
          </p>
          <p className="text-sm text-muted-foreground">
            Size: {sizeInMB} MB
          </p>
        </div>
      )
    }
    return null
  }

  if (!sharesAnalytics || sharesAnalytics.length === 0) {
    return (
      <Card className="md:col-span-2 lg:col-span-2 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Document Distribution by Shares</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No shares analytics data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="md:col-span-2 lg:col-span-2 flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Document Distribution by Shares</CardTitle>
        <CardDescription>File count breakdown across {chartData.length} active shares</CardDescription>
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
              dataKey="count"
              nameKey="shareName"
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
                          Total Files
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
        {largestShare && (
          <div className="flex items-center gap-2 leading-none font-medium">
            Largest share: {largestShare.shareName} ({largestShare.count.toLocaleString()} files)
            <TrendingUp className="h-4 w-4" />
          </div>
        )}
        <div className="text-muted-foreground leading-none">
          Distribution of {totalFiles.toLocaleString()} files across {chartData.length} indexed shares
        </div>
      </CardFooter>
    </Card>
  )
}