"use client"

import { useState } from "react"
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
import { IconTrash, IconFolderCode, IconInfoCircle } from "@tabler/icons-react"
import { OverviewCard } from "@/components/cards/overview-card"
import type { Dataset } from "@/services/models"
import type { MonitoringOverviewResponse } from "@/services/neo-api"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MyDatasetsProps {
    datasets: Dataset[]
    onDeleteDataset: (id: string) => void
    monitoringOverview: MonitoringOverviewResponse | null
    cacheStats?: {
        sizeBytes: number
        items: number
    }
}

export default function MyDatasets({
    datasets,
    onDeleteDataset,
    monitoringOverview,
    cacheStats,
}: MyDatasetsProps) {
    const navigate = useNavigate()
    const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set())
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

    const handleDelete = () => {
        selectedDatasets.forEach((id) => onDeleteDataset(id))
        setSelectedDatasets(new Set())
        toast.success(`Deleted ${selectedDatasets.size} dataset(s)`)
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
                                description="Manage your created datasets."
                                variant="files"
                                cacheStats={cacheStats}
                            />
                        </div>

                        <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300">
                            <IconInfoCircle className="h-4 w-4" />
                            <AlertTitle>Tech Preview feature</AlertTitle>
                            <AlertDescription>
                                Datasets are only persistent during the user session and will be deleted at logout with the cache.
                            </AlertDescription>
                        </Alert>

                        {selectedDatasets.size > 0 && (
                            <div className="mb-4 flex justify-end">
                                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                    <IconTrash className="mr-2 size-4" />
                                    Delete Dataset(s)
                                </Button>
                            </div>
                        )}

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
                                        <TableHead>Files</TableHead>
                                        <TableHead>Total Size</TableHead>
                                        <TableHead>Created At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {datasets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                                                No datasets created yet.
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
                                                    <div className="flex items-center gap-2">
                                                        <IconFolderCode className="size-4 text-muted-foreground" />
                                                        {dataset.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{dataset.files.length} files</TableCell>
                                                <TableCell>
                                                    {dataset.files.reduce((acc, file) => acc + file.size, 0).toLocaleString()} bytes
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(dataset.createdAt).toLocaleDateString()}
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
