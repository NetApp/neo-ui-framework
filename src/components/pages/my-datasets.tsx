// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { IconTrash, IconDatabase, IconRefresh } from "@tabler/icons-react"
import { OverviewCard } from "@/components/cards/overview-card"
import type { Dataset, FileMetadataResponse } from "@/services/models"
import type { MonitoringOverviewResponse } from "@/services/neo-api"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { toast } from "sonner"

interface MyDatasetsProps {
    datasets: Dataset[]
    onDeleteDataset: (id: string) => Promise<void>
    onFetchDatasets: () => Promise<void>
    onFetchFileMetadata: (shareId: string, fileId: string) => Promise<FileMetadataResponse>
    monitoringOverview: MonitoringOverviewResponse | null
    cacheStats?: {
        sizeBytes: number
        items: number
    }
}

export default function MyDatasets({
    datasets,
    onDeleteDataset,
    onFetchDatasets,
    onFetchFileMetadata,
    monitoringOverview,
    // cacheStats,
}: MyDatasetsProps) {
    const navigate = useNavigate()
    const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set())
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isWarmingUp, setIsWarmingUp] = useState(false)
    const [isFetching, setIsFetching] = useState(false)

    useEffect(() => {
        const load = async () => {
            setIsFetching(true)
            try {
                await onFetchDatasets()
            } catch {
                toast.error("Failed to load datasets")
            } finally {
                setIsFetching(false)
            }
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const toggleSelectAll = () => {
        if (selectedDatasets.size === datasets.length) {
            setSelectedDatasets(new Set())
        } else {
            setSelectedDatasets(new Set(datasets.map((d) => d.id)))
        }
    }

    const toggleSelectDataset = (id: string) => {
        const newSelected = new Set(selectedDatasets)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedDatasets(newSelected)
    }

    const handleDelete = async () => {
        const count = selectedDatasets.size
        try {
            await Promise.all(Array.from(selectedDatasets).map(id => onDeleteDataset(id)))
            setSelectedDatasets(new Set())
            toast.success(`Deleted ${count} dataset(s)`)
        } catch {
            toast.error("Failed to delete one or more datasets")
        }
    }

    const handleCacheWarmup = async () => {
        const targetDatasets = datasets.filter(d => selectedDatasets.has(d.id))
        const totalFiles = targetDatasets.reduce((acc, d) => acc + d.files.length, 0)

        if (totalFiles === 0) {
            toast.error("No locally-loaded files in selected datasets to cache")
            return
        }

        setIsWarmingUp(true)
        toast.info(`Starting cache warmup for ${totalFiles} files...`)

        let successCount = 0
        let failCount = 0
        const failedFiles: string[] = []

        try {
            for (const dataset of targetDatasets) {
                for (const file of dataset.files) {
                    if (file.share_id) {
                        try {
                            await onFetchFileMetadata(file.share_id, file.id)
                            successCount++
                        } catch (error) {
                            console.error(`Failed to warm cache for file ${file.id}`, error)
                            failCount++
                            failedFiles.push(file.filename || file.id)
                        }
                    }
                }
            }

            if (failCount > 0) {
                const limit = 3
                const fileList = failedFiles.slice(0, limit).join(", ")
                const remaining = failedFiles.length - limit
                const detail = remaining > 0 ? `${fileList} and ${remaining} more` : fileList
                toast.warning(`Cache warmup finished with errors. ${successCount} cached, ${failCount} failed.`)
                toast.error(`Failed files: ${detail}`)
            } else {
                toast.success(`Cache warmup complete. ${successCount} files cached.`)
            }
        } catch {
            toast.error("Cache warmup interrupted due to an error")
        } finally {
            setIsWarmingUp(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="px-4 lg:px-6">
                        <div className="mb-4">
                            <OverviewCard
                                overview={monitoringOverview}
                                title="My Datasets"
                                variant="files"
                                showCacheStats={false}
                            />
                        </div>

                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {isFetching ? "Loading datasets…" : `${datasets.length} dataset${datasets.length !== 1 ? "s" : ""}`}
                            </p>
                            <div className="flex gap-2">
                                {selectedDatasets.size > 0 && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleCacheWarmup}
                                            disabled={isWarmingUp}
                                        >
                                            <IconDatabase className="mr-2 size-4" />
                                            {isWarmingUp ? "Caching..." : "Cache files"}
                                        </Button>
                                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                            <IconTrash className="mr-2 size-4" />
                                            Delete ({selectedDatasets.size})
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={async () => {
                                        setIsFetching(true)
                                        try { await onFetchDatasets() } catch { toast.error("Failed to refresh datasets") } finally { setIsFetching(false) }
                                    }}
                                    disabled={isFetching}
                                    aria-label="Refresh datasets"
                                >
                                    <IconRefresh className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={datasets.length > 0 && selectedDatasets.size === datasets.length}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Visibility</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isFetching ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : datasets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                                                No datasets yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        datasets.map((dataset) => (
                                            <TableRow
                                                key={dataset.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => navigate(`/my-datasets/${dataset.id}`)}
                                            >
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={selectedDatasets.has(dataset.id)}
                                                        onCheckedChange={() => toggleSelectDataset(dataset.id)}
                                                        aria-label={`Select ${dataset.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div>{dataset.name}</div>
                                                    {dataset.description && (
                                                        <div className="text-xs text-muted-foreground truncate max-w-[220px]">{dataset.description}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {dataset.owner_username ?? "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {dataset.item_count ?? dataset.files.length}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={dataset.is_public ? "default" : "secondary"}>
                                                        {dataset.is_public ? "Public" : "Private"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {dataset.expiresAt
                                                        ? new Date(dataset.expiresAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {new Date(dataset.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Datasets"
                description={`Are you sure you want to delete ${selectedDatasets.size} dataset(s)? This action cannot be undone.`}
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    )
}
