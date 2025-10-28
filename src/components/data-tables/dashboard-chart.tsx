"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// import {
//   type ChartConfig, 
//   ChartContainer, 
//   ChartTooltip, 
//   ChartTooltipContent 
// } from "@/components/ui/chart"

export function DashboardChart() {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dashboard Chart</CardTitle>
                <CardDescription>
                    Example of a dashboard chart component.
                </CardDescription>
            </CardHeader>
            <CardContent>

            </CardContent>
            <CardFooter>
                {/* Footer content if needed */}
            </CardFooter>
        </Card>
    )
}