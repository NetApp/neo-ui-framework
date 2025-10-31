"use client"

import type { UserResponse } from "../services/neo-api"
import { UsersTable } from "../data-tables/users"
import type { MeResponse } from "../services/neo-api"

interface UsersProps {
  users: UserResponse[] | null
  me: MeResponse | null
}

export default function Users({ users, me }: UsersProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <UsersTable users={users} me={me}/>
          </div>
        </div>
      </div>
    </div>
  )
}
