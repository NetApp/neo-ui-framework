"use client"

import { SectionCards } from "../sections/cards"
import { DashboardChart } from "../data-tables/dashboard-chart"
import type { HealthResponse, LicenseResponse, VersionResponse } from "../services/neo-api"

interface DashboardProps {
  health: HealthResponse | null
  license: LicenseResponse | null
  version: VersionResponse | null
}

export default function Dashboard({ health, license, version }: DashboardProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards health={health} license={license} version={version} />
          <div className="px-4 lg:px-6">
            <DashboardChart />
          </div>
        </div>
      </div>
    </div>
  )
}
