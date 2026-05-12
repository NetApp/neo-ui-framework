// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { OverviewCard } from "@/components/cards/overview-card"
import type { FileMetadataResponse, FileEntry } from "@/services/neo-api"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { IconTrash } from "@tabler/icons-react"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"

interface DatasetPageProps {
    datasets: Dataset[]
    onFetchFileMetadata: (shareId: string, fileId: string) => Promise<FileMetadataResponse>
    onDeleteDataset: (id: string) => Promise<void>
    onDeleteDatasetItems: (datasetId: string, fileIds: string[]) => Promise<void>
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
    onDeleteDatasetItems,
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
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 50

    // Selected items for deletion
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeleteItemsDialogOpen, setIsDeleteItemsDialogOpen] = useState(false)
    const [isDeletingItems, setIsDeletingItems] = useState(false)

    const fetchItems = useCallback(async (page: number) => {
        if (!datasetId) return
        setItemsLoading(true)
        setCurrentPage(page)
        try {
            const response = await onFetchDatasetItems(datasetId, page, PAGE_SIZE)
            setItemsResponse(response)
            // Clear selection when page changes
            setSelectedIds(new Set())
        } catch {
            toast.error("Failed to load dataset items")
        } finally {
            setItemsLoading(false)
        }
    }, [datasetId, onFetchDatasetItems])

    useEffect(() => {
        fetchItems(1)
    }, [fetchItems])

    // Handle checkbox toggle
    const toggleItemSelection = useCallback((fileId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(fileId)) {
                newSet.delete(fileId)
            } else {
                newSet.add(fileId)
            }
            return newSet
        })
    }, [])

    // Handle select all checkboxes on current page
    const toggleSelectAll = useCallback(() => {
        if (!itemsResponse) return
        const pageFileIds = new Set(itemsResponse.items.map(item => item.file_id))
        
        setSelectedIds(prev => {
            if (prev.size === itemsResponse.items.length && 
                itemsResponse.items.every(item => prev.has(item.file_id))) {
                // Deselect all
                return new Set()
            } else {
                // Select all on this page
                return pageFileIds
            }
        })
    }, [itemsResponse])

    // Handle delete selected items
    const handleDeleteSelectedItems = async () => {
        if (!dataset || selectedIds.size === 0) return

        setIsDeletingItems(true)
        try {
            const fileIds = Array.from(selectedIds)
            await onDeleteDatasetItems(dataset.id, fileIds)
            toast.success(`${fileIds.length} item(s) deleted`)
            setSelectedIds(new Set())
            setIsDeleteItemsDialogOpen(false)
            // Refresh current page
            await fetchItems(currentPage)
        } catch (error) {
            toast.error("Failed to delete items")
            console.error("Delete items error", error)
        } finally {
            setIsDeletingItems(false)
        }
    }

    // Map API items → FilesResponse for FilesTable
    // Note: This is kept for reference but not used since we render custom table
    // const filesResponse = useMemo<FilesResponse | null>(() => {
    //     if (!itemsResponse || !dataset) return null
    //     const files = itemsResponse.items.map(datasetItemToFileEntry)
    //     return {
    //         share_id: dataset.id,
    //         path: dataset.name,
    //         files,
    //         total_count: itemsResponse.total_count,
    //         total_size: files.reduce((acc, f) => acc + f.size, 0),
    //         page: itemsResponse.page,
    //         page_size: itemsResponse.page_size,
    //         total_pages: itemsResponse.total_pages,
    //         has_next: itemsResponse.has_next,
    //         has_previous: itemsResponse.has_previous,
    //     }
    // }, [itemsResponse, dataset])

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

                        <div className="mb-4 flex justify-between items-center gap-2">
                            <div className="flex gap-2">
                                {selectedIds.size > 0 && (
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => setIsDeleteItemsDialogOpen(true)}
                                        disabled={isDeletingItems}
                                    >
                                        <IconTrash className="mr-2 size-4" />
                                        <span className="hidden sm:inline">Delete selected ({selectedIds.size})</span>
                                        <span className="sm:hidden">Delete ({selectedIds.size})</span>
                                    </Button>
                                )}
                            </div>
                            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                <IconTrash className="mr-2 size-4" />
                                <span className="hidden sm:inline">Delete dataset</span>
                                <span className="sm:hidden">Delete</span>
                            </Button>
                        </div>

                        {/* Custom items table with selection */}
                        <div className="overflow-hidden rounded-lg border">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={
                                                    !!(itemsResponse && itemsResponse.items.length > 0 &&
                                                    itemsResponse.items.every(item => selectedIds.has(item.file_id)))
                                                }
                                                onCheckedChange={() => toggleSelectAll()}
                                                aria-label="Select all items"
                                            />
                                        </TableHead>
                                        <TableHead>Filename</TableHead>
                                        <TableHead>Share</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Modified</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {itemsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <Spinner className="size-6 mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : itemsResponse && itemsResponse.items.length > 0 ? (
                                        itemsResponse.items.map((item) => (
                                            <TableRow key={item.file_id} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={selectedIds.has(item.file_id)}
                                                        onCheckedChange={() => toggleItemSelection(item.file_id)}
                                                        aria-label={`Select ${item.filename}`}
                                                    />
                                                </TableCell>
                                                <TableCell 
                                                    onClick={() => handleFileClick(datasetItemToFileEntry(item))}
                                                    className="font-medium truncate"
                                                >
                                                    {item.filename}
                                                </TableCell>
                                                <TableCell 
                                                    onClick={() => handleFileClick(datasetItemToFileEntry(item))}
                                                    className="text-sm text-muted-foreground"
                                                >
                                                    {item.share_name || item.share_id}
                                                </TableCell>
                                                <TableCell 
                                                    onClick={() => handleFileClick(datasetItemToFileEntry(item))}
                                                    className="text-sm text-right"
                                                >
                                                    {(item.size / 1024 / 1024).toFixed(2)} MB
                                                </TableCell>
                                                <TableCell 
                                                    onClick={() => handleFileClick(datasetItemToFileEntry(item))}
                                                    className="text-sm text-muted-foreground"
                                                >
                                                    {new Date(item.modified_time).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No items in this dataset.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination controls */}
                        {itemsResponse && itemsResponse.total_pages > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Page {itemsResponse.page} of {itemsResponse.total_pages} ({itemsResponse.total_count} total items)
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchItems(itemsResponse.page - 1)}
                                        disabled={!itemsResponse.has_previous || itemsLoading}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchItems(itemsResponse.page + 1)}
                                        disabled={!itemsResponse.has_next || itemsLoading}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Sheet open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
                <SheetContent side="bottom" className="max-h-[95vh] flex flex-col p-0 gap-0">
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
                open={isDeleteItemsDialogOpen}
                onOpenChange={setIsDeleteItemsDialogOpen}
                title="Delete Items"
                description={`Are you sure you want to delete ${selectedIds.size} item(s) from this dataset? This action cannot be undone.`}
                onConfirm={handleDeleteSelectedItems}
                confirmText="Delete"
                variant="destructive"
            />

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
