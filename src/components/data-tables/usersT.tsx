// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useEffect, useState } from "react"

import { 
  IconPasswordUser 
} from "@tabler/icons-react"

import type { 
  MeResponse, 
  UserResponse 
} from "@/services/neo-api"

import { 
  Button 
} from "@/components/ui/button"

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
  onRequestPasswordChange?: () => void
  onLinkEntra?: () => Promise<void>
  onUnlinkEntra?: () => Promise<void>  
}

export function UsersTable({ users, me, onRequestPasswordChange }: UsersTableProps) {
  const rows = users ?? []
  const rowsPerPage = 100
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage))
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [rows.length])

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRows = rows.slice(startIndex, startIndex + rowsPerPage)

  return (
    <>
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
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length ? (
              paginatedRows.map((user) => {
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
                    <TableCell>
                      {user.last_login ? new Date(user.last_login).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {isCurrent && onRequestPasswordChange ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={onRequestPasswordChange}
                          aria-label="Change password"
                        >
                          <IconPasswordUser className="size-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No users available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > 0 ? (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            Showing {startIndex + 1}-{Math.min(startIndex + paginatedRows.length, rows.length)} of {rows.length.toLocaleString()} users · Page {currentPage} of {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}