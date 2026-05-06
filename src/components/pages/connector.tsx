// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { NeoInstanceCard } from "@/components/cards/neo-instance-card"
import { VersioningCard } from "@/components/cards/versioning-card"
import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  HelmChartVersionResponse,
  MonitoringOverviewResponse,
} from "@/services/neo-api"
import { OverviewCard } from "@/components/cards/overview-card"

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
              <OverviewCard
                overview={monitoringOverview}
                title="System Overview"
                showCacheStats={false}
              />
              <NeoInstanceCard
                health={health}
                license={license}
                className="md:col-span-2 lg:col-span-2"
              />
              <VersioningCard
                version={version}
                helmChartVersion={helmChartVersion}
                health={health}
                license={license}
                className="md:col-span-2 lg:col-span-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
