"use client"

import type { UserResponse, MeResponse } from "@/components/services/neo-api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface UsersTableProps {
  users?: UserResponse[] | null
  me?: MeResponse | null
}

export function UsersTable({ users, me }: UsersTableProps) {
  const rows = users ?? []

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Login</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((user) => {
              const isCurrent = me?.id === user.id
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.username}
                    {isCurrent ? <span className="ml-1 text-xs text-muted-foreground">(current)</span> : null}
                  </TableCell>
                  <TableCell>{user.email ?? "-"}</TableCell>
                  <TableCell>{user.is_active ? "Yes" : "No"}</TableCell>
                  <TableCell>{user.is_admin ? "Yes" : "No"}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                  <TableCell>{new Date(user.last_login).toLocaleString()}</TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                No users available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}