"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { OverviewCard } from "@/components/cards/overview-card"
import { FilesTable } from "@/components/data-tables/filesT"
import type { FilesResponse, FileMetadataResponse, FileEntry } from "@/services/neo-api"
import type { Dataset } from "@/services/models"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetHeader,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { IconTrash, IconInfoCircle } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DatasetPageProps {
    datasets: Dataset[]
    onFetchFileMetadata: (shareId: string, fileId: string) => Promise<FileMetadataResponse>
    onDeleteDataset: (id: string) => void
}

export default function DatasetPage({
    datasets,
    onFetchFileMetadata,
    onDeleteDataset,
}: DatasetPageProps) {
    const { datasetId } = useParams()
    const navigate = useNavigate()
    const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
    const [fileContent, setFileContent] = useState<string | null>(null)
    const [contentLoading, setContentLoading] = useState(false)

    const dataset = useMemo(() =>
        datasets.find(d => d.id === datasetId),
        [datasets, datasetId]
    )

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = () => {
        if (dataset) {
            onDeleteDataset(dataset.id)
            toast.success(`Dataset "${dataset.name}" deleted`)
            navigate("/my-datasets/my-datasets")
        }
    }

    const filesResponse = useMemo<FilesResponse | null>(() => {
        if (!dataset) return null
        return {
            share_id: dataset.id,
            path: dataset.name,
            files: dataset.files,
            total_count: dataset.files.length,
            total_size: dataset.files.reduce((acc, file) => acc + file.size, 0),
            page: 1,
            page_size: dataset.files.length,
            total_pages: 1,
            has_next: false,
            has_previous: false,
        }
    }, [dataset])

    useEffect(() => {
        const fetchContent = async () => {
            if (!selectedFile) return

            setFileContent(null)
            setContentLoading(true)

            try {
                const shareId = selectedFile.share_id || "dataset"
                const metadata = await onFetchFileMetadata(shareId, selectedFile.id)
                setFileContent(metadata.content || "*No content available*")
            } catch (error) {
                console.error("Failed to fetch file content", error)
                setFileContent("*Failed to load content*")
                toast.error("Failed to load file content")
            } finally {
                setContentLoading(false)
            }
        }

        fetchContent()
    }, [selectedFile, onFetchFileMetadata])

    const handleFileClick = (file: FileEntry) => {
        setFileContent(null)
        setContentLoading(true)
        setSelectedFile(file)
    }

    if (!dataset) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <p className="text-muted-foreground">Dataset not found.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="px-4 lg:px-6">
                        <div className="mb-4">
                            <OverviewCard
                                overview={null}
                                title={dataset.name}
                                description={`Dataset created on ${new Date(dataset.createdAt).toLocaleString()}`}
                                showCacheStats={false}
                            />
                        </div>

                        <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300">
                            <IconInfoCircle className="h-4 w-4" />
                            <AlertTitle>Tech Preview</AlertTitle>
                            <AlertDescription>
                                This is a tech preview feature. At the current stage, the dataset is only persistent using the current session cache for a given user. At logout, the cache is clear and so is the datasets. Please provide us with feedback.
                            </AlertDescription>
                        </Alert>

                        <div className="mb-4 flex justify-end gap-2">
                            <Button variant="destructive" onClick={handleDeleteClick}>
                                <IconTrash className="mr-2 size-4" />
                                Delete dataset
                            </Button>
                        </div>

                        <FilesTable
                            files={filesResponse}
                            loading={false}
                            emptyMessage="No documents in this dataset."
                            onFetchFileMetadata={onFetchFileMetadata}
                            onFileClick={handleFileClick}
                        />
                    </div>
                </div>
            </div>

            <Sheet open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
                <SheetContent className="w-[90vw] sm:w-[75vw] sm:max-w-[75vw] overflow-y-auto">
                    <SheetHeader className="mb-4">
                    </SheetHeader>

                    <div className="mt-4">
                        {contentLoading ? (
                            <div className="flex justify-center py-8">
                                <Spinner className="size-8" />
                            </div>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{selectedFile?.filename}</CardTitle>
                                    <CardDescription>{selectedFile?.unc_path}</CardDescription>
                                </CardHeader>
                                <CardContent className="prose dark:prose-invert max-w-none prose-table:border prose-table:border-collapse prose-th:border prose-th:p-2 prose-td:border prose-td:p-2">
                                    <Markdown remarkPlugins={[remarkGfm]}>
                                        {fileContent || ""}
                                    </Markdown>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </SheetContent>
            </Sheet >

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Dataset"
                description={`Are you sure you want to delete the dataset "${dataset.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </div >
    )
}
