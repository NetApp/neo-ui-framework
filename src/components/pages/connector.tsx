"use client"

import {
  SectionCards
} from "@/components/sections/cards"
import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  HelmChartVersionResponse,
  MonitoringOverviewResponse,
} from "@/services/neo-api"
import { MonitoringOverviewCard } from "@/components/cards/monitoring-overview-card"

interface ConnectorProps {
  health: HealthResponse | null
  license: LicenseResponse | null
  version: VersionResponse | null
  helmChartVersion: HelmChartVersionResponse | null
  monitoringOverview: MonitoringOverviewResponse | null
}

export default function Connector({ health, license, version, helmChartVersion, monitoringOverview }: ConnectorProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MonitoringOverviewCard
                overview={monitoringOverview}
                title="Connector Status"
                description="Overview of the connector health, license, and version information."
              />
              <SectionCards
                health={health}
                license={license}
                version={version}
                helmChartVersion={helmChartVersion}
                className="md:col-span-2 lg:col-span-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
