"use client"

import type { FilesResponse } from "../services/neo-api"
import { FilesTable } from "../data-tables/files"

interface FilesProps {
  files: FilesResponse | null
}

export default function Files({ files }: FilesProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <FilesTable files={files} />
          </div>
        </div>
      </div>
    </div>
  )
}
