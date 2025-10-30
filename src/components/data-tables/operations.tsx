"use client"

import type { OperationResponse } from "@/components/services/neo-api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


interface OperationsTableProps {
  operations?: OperationResponse[] | null
}

export function OperationsTable({ operations }: OperationsTableProps) {
  const rows = operations ?? []

  return (
    <>
        <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((operation) => (
                <TableRow key={operation.id}>
                  <TableCell>{new Date(operation.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{operation.username}</TableCell>
                  <TableCell>{operation.operation_type}</TableCell>
                  <TableCell>{operation.status}</TableCell>
                  <TableCell>{operation.details}</TableCell>
                </TableRow>
              ))
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
    </>
  )
}