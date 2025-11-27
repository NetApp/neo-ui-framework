"use client"

import {
  SectionCards
} from "@/components/sections/cards"
import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  HelmChartVersionResponse,
} from "@/services/neo-api"

interface ConnectorProps {
  health: HealthResponse | null
  license: LicenseResponse | null
  version: VersionResponse | null
  helmChartVersion: HelmChartVersionResponse | null
}

export default function Connector({ health, license, version, helmChartVersion }: ConnectorProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards
            health={health}
            license={license}
            version={version}
            helmChartVersion={helmChartVersion}
          />
        </div>
      </div>
    </div>
  )
}
