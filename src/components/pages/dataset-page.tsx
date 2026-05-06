// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { OverviewCard } from "@/components/cards/overview-card"
import { FilesTable } from "@/components/data-tables/filesT"
import type { FilesResponse, FileMetadataResponse, FileEntry } from "@/services/neo-api"
import type { Dataset, DatasetItem, DatasetItemsResponse } from "@/services/models"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { IconTrash } from "@tabler/icons-react"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"

interface DatasetPageProps {
    datasets: Dataset[]
    onFetchFileMetadata: (shareId: string, fileId: string) => Promise<FileMetadataResponse>
    onDeleteDataset: (id: string) => Promise<void>
    onFetchDatasetItems: (datasetId: string, page: number, pageSize: number) => Promise<DatasetItemsResponse>
}

function datasetItemToFileEntry(item: DatasetItem): FileEntry {
    return {
        id: item.file_id,
        filename: item.filename,
        file_path: item.file_path,
        unc_path: item.unc_path,
        share_id: item.share_id,
        size: item.size,
        modified_time: item.modified_time,
        file_type: item.file_type,
        is_directory: false,
        created_at: item.added_at,
        accessed_at: item.added_at,
        indexed_at: item.added_at,
    }
}

export default function DatasetPage({
    datasets,
    onFetchFileMetadata,
    onDeleteDataset,
    onFetchDatasetItems,
}: DatasetPageProps) {
    const { datasetId } = useParams()
    const navigate = useNavigate()

    const dataset = useMemo(() =>
        datasets.find(d => d.id === datasetId),
        [datasets, datasetId]
    )

    // Items fetched from API
    const [itemsResponse, setItemsResponse] = useState<DatasetItemsResponse | null>(null)
    const [itemsLoading, setItemsLoading] = useState(false)
    const PAGE_SIZE = 50

    const fetchItems = useCallback(async (page: number) => {
        if (!datasetId) return
        setItemsLoading(true)
        try {
            const response = await onFetchDatasetItems(datasetId, page, PAGE_SIZE)
            setItemsResponse(response)
        } catch {
            toast.error("Failed to load dataset items")
        } finally {
            setItemsLoading(false)
        }
    }, [datasetId, onFetchDatasetItems])

    useEffect(() => {
        fetchItems(1)
    }, [fetchItems])

    // Map API items → FilesResponse for FilesTable
    const filesResponse = useMemo<FilesResponse | null>(() => {
        if (!itemsResponse || !dataset) return null
        const files = itemsResponse.items.map(datasetItemToFileEntry)
        return {
            share_id: dataset.id,
            path: dataset.name,
            files,
            total_count: itemsResponse.total_count,
            total_size: files.reduce((acc, f) => acc + f.size, 0),
            page: itemsResponse.page,
            page_size: itemsResponse.page_size,
            total_pages: itemsResponse.total_pages,
            has_next: itemsResponse.has_next,
            has_previous: itemsResponse.has_previous,
        }
    }, [itemsResponse, dataset])

    // File detail sheet
    const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
    const [fileMetadata, setFileMetadata] = useState<FileMetadataResponse | null>(null)
    const [contentLoading, setContentLoading] = useState(false)

    useEffect(() => {
        if (!selectedFile) return
        const load = async () => {
            setFileMetadata(null)
            setContentLoading(true)
            try {
                const shareId = selectedFile.share_id || "dataset"
                const metadata = await onFetchFileMetadata(shareId, selectedFile.id)
                setFileMetadata(metadata)
            } catch (error) {
                console.error("Failed to fetch file content", error)
                toast.error("Failed to load file content")
            } finally {
                setContentLoading(false)
            }
        }
        load()
    }, [selectedFile, onFetchFileMetadata])

    const handleFileClick = (file: FileEntry) => {
        setFileMetadata(null)
        setSelectedFile(file)
    }

    // Delete
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const handleConfirmDelete = async () => {
        if (dataset) {
            await onDeleteDataset(dataset.id)
            toast.success(`Dataset "${dataset.name}" deleted`)
            navigate("/my-datasets/my-datasets")
        }
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
                                description={dataset.description || `Created on ${new Date(dataset.createdAt).toLocaleString()}`}
                                showCacheStats={false}
                            />
                        </div>

                        <div className="mb-4 flex justify-end gap-2">
                            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                <IconTrash className="mr-2 size-4" />
                                <span className="hidden sm:inline">Delete dataset</span>
                                <span className="sm:hidden">Delete</span>
                            </Button>
                        </div>

                        <FilesTable
                            files={filesResponse}
                            loading={itemsLoading}
                            emptyMessage="No items in this dataset."
                            onFileClick={handleFileClick}
                            onPageChange={(page) => fetchItems(page)}
                        />
                    </div>
                </div>
            </div>

            <Sheet open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
                <SheetContent className="w-[90vw] sm:w-[85vw] sm:max-w-[85vw] flex flex-col p-0 gap-0">
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                        <SheetHeader className="mb-4 p-0">
                            <div className="flex flex-col space-y-1">
                                <h2 className="text-lg font-semibold">{selectedFile?.filename}</h2>
                                <p className="text-sm text-muted-foreground break-all">{selectedFile?.unc_path}</p>
                            </div>
                        </SheetHeader>

                        <div className="mt-4 flex-1 flex flex-col">
                            {contentLoading ? (
                                <div className="flex justify-center py-8">
                                    <Spinner className="size-8" />
                                </div>
                            ) : (
                                <Tabs defaultValue="details" className="w-full flex-1 flex flex-col">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="details">Details</TabsTrigger>
                                        <TabsTrigger value="content">Content</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="details" className="mt-4 flex-1 flex flex-col data-[state='inactive']:hidden">
                                        {fileMetadata ? (
                                            <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                                                <div>
                                                    <dt className="font-medium text-foreground">Filename</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{fileMetadata.filename}</pre></dd>
                                                </div>
                                                <div>
                                                    <dt className="font-medium text-foreground">File type</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{fileMetadata.file_type || "—"}</pre></dd>
                                                </div>
                                                <div className="sm:col-span-1">
                                                    <dt className="font-medium text-foreground">File path</dt>
                                                    <dd className="break-words p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{fileMetadata.file_path}</pre></dd>
                                                </div>
                                                <div className="sm:col-span-1">
                                                    <dt className="font-medium text-foreground">UNC path</dt>
                                                    <dd className="break-words p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{fileMetadata.unc_path}</pre></dd>
                                                </div>
                                                <div>
                                                    <dt className="font-medium text-foreground">Size</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{fileMetadata.size.toLocaleString()} bytes</pre></dd>
                                                </div>
                                                <div>
                                                    <dt className="font-medium text-foreground">Directory</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{fileMetadata.is_directory ? "Yes" : "No"}</pre></dd>
                                                </div>
                                                <div>
                                                    <dt className="font-medium text-foreground">Created</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(fileMetadata.created_at).toLocaleString()}</pre></dd>
                                                </div>
                                                <div>
                                                    <dt className="font-medium text-foreground">Modified</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(fileMetadata.modified_time).toLocaleString()}</pre></dd>
                                                </div>
                                                <div>
                                                    <dt className="font-medium text-foreground">Accessed</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(fileMetadata.accessed_at).toLocaleString()}</pre></dd>
                                                </div>
                                                <div>
                                                    <dt className="font-medium text-foreground">Indexed</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{fileMetadata.indexed_at ? new Date(fileMetadata.indexed_at).toLocaleString() : "—"}</pre></dd>
                                                </div>
                                                <div>
                                                    <dt className="font-medium text-foreground">Conversion (ms)</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{fileMetadata.conversion_duration_ms}</pre></dd>
                                                </div>
                                                <div>
                                                    <dt className="font-medium text-foreground">Extractor</dt>
                                                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{fileMetadata.extractor_used || "—"}</pre></dd>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <dt className="font-medium text-foreground">ACL principals</dt>
                                                    <dd className="p-1">
                                                        <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                                                            {fileMetadata.acl_principals?.length ? fileMetadata.acl_principals.join(", ") : "N/A"}
                                                        </pre>
                                                    </dd>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <dt className="font-medium text-foreground">Resolved principals</dt>
                                                    <dd className="p-1">
                                                        {fileMetadata.resolved_principals?.length ? (
                                                            <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                                                                {JSON.stringify(fileMetadata.resolved_principals, null, 2)}
                                                            </pre>
                                                        ) : (
                                                            <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">"N/A"</pre>
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <dt className="font-medium text-foreground">Content</dt>
                                                    <dd className="p-1">
                                                        {fileMetadata.content ? (
                                                            <pre className="mt-1 max-h-96 overflow-auto rounded bg-muted p-2 text-xs">
                                                                {fileMetadata.content}
                                                            </pre>
                                                        ) : (
                                                            <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">"—"</pre>
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                        ) : (
                                            <p className="text-center text-muted-foreground">No metadata available</p>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="content" className="mt-4 flex-1 flex flex-col data-[state='inactive']:hidden">
                                        <div className="flex-1 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md font-mono whitespace-pre-wrap [&_b]:text-red-500 [&_b]:font-bold">
                                            <Markdown remarkPlugins={[remarkGfm]}>
                                                {fileMetadata?.content || "*No content available*"}
                                            </Markdown>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            )}
                        </div>
                    </div>
                    <SheetFooter className="p-4 border-t">
                        <SheetClose asChild>
                            <Button variant="outline">Close</Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Dataset"
                description={`Are you sure you want to delete the dataset "${dataset.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    )
}
