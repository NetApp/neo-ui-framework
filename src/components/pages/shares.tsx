"use client"

import type { SharesResponse } from "../services/neo-api"
import { SharesTable } from "../data-tables/shares"

interface SharesProps {
  shares: SharesResponse[] | null
}

export default function Shares({ shares }: SharesProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <SharesTable shares={shares} />
          </div>
        </div>
      </div>
    </div>
  )
}
