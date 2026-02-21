// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
  IconPasswordUser,
  IconLink,
  IconUnlink
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
  onLinkEntra?: () => void
  onUnlinkEntra?: () => void
}

export function UsersTable({ users, me, onRequestPasswordChange, onLinkEntra, onUnlinkEntra }: UsersTableProps) {
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
            <TableHead className="w-[140px] text-right">Actions</TableHead>
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
                  <TableCell>
                    {user.last_login ? new Date(user.last_login).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isCurrent && onRequestPasswordChange ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={onRequestPasswordChange}
                          aria-label="Change password"
                          title="Change password"
                        >
                          <IconPasswordUser className="size-4" />
                        </Button>
                      ) : null}
                      {isCurrent && onLinkEntra && onUnlinkEntra ? (
                        user.entra_object_id ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={onUnlinkEntra}
                            aria-label="Unlink Entra ID"
                            title="Unlink Entra ID"
                          >
                            <IconUnlink className="size-4 text-orange-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={onLinkEntra}
                            aria-label="Link Entra ID (SSO)"
                            title="Link Entra ID (SSO)"
                          >
                            <IconLink className="size-4 text-blue-500" />
                          </Button>
                        )
                      ) : null}
                    </div>
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
  )
}