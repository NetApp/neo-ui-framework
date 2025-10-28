"use client"

import { SectionCards } from "@/components/sections/cards"
import { DashboardChart } from "../data-tables/dashboard-chart"

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <DashboardChart />
          </div>
        </div>
      </div>
    </div>
  )
}
