"use client"

import type { UserResponse } from "../services/neo-api"
import { UsersTable } from "../data-tables/users"

interface UsersProps {
  users: UserResponse[] | null
}

export default function Users({ users }: UsersProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <UsersTable users={users} />
          </div>
        </div>
      </div>
    </div>
  )
}
