// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { OverviewCard } from "@/components/cards/overview-card"
import type { FileMetadataResponse, FileEntry } from "@/services/neo-api"
import type {
    CreateSubsetRequest,
    Dataset,
    DatasetItem,
    DatasetItemsResponse,
    DatasetNerSearchRequest,
    DatasetNerSearchResponse,
    DatasetPermission,
    DatasetSearchRequest,
    DatasetSearchResponse,
    DatasetShareResponse,
    ShareDatasetRequest,
    UpdateDatasetRequest,
} from "@/services/models"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { IconSearch, IconShare, IconTrash, IconEdit, IconCopyPlus } from "@tabler/icons-react"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"

interface DatasetPageProps {
    datasets: Dataset[]
    onFetchFileMetadata: (shareId: string, fileId: string) => Promise<FileMetadataResponse>
    onDeleteDataset: (id: string) => Promise<void>
    onDeleteDatasetItems: (datasetId: string, fileIds: string[]) => Promise<void>
    onFetchDatasetItems: (datasetId: string, page: number, pageSize: number) => Promise<DatasetItemsResponse>
    onUpdateDataset: (datasetId: string, payload: UpdateDatasetRequest) => Promise<unknown>
    onSearchDataset: (datasetId: string, payload: DatasetSearchRequest) => Promise<DatasetSearchResponse>
    onNerSearchDataset: (datasetId: string, payload: DatasetNerSearchRequest) => Promise<DatasetNerSearchResponse>
    onCreateSubset: (datasetId: string, payload: CreateSubsetRequest) => Promise<unknown>
    onListDatasetShares: (datasetId: string) => Promise<DatasetShareResponse[]>
    onShareDataset: (datasetId: string, payload: ShareDatasetRequest) => Promise<DatasetShareResponse>
    onUpdateDatasetShare: (datasetId: string, shareId: string, permission?: DatasetPermission | null, expiresAt?: string | null) => Promise<DatasetShareResponse>
    onRevokeDatasetShare: (datasetId: string, shareId: string) => Promise<void>
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
    onUpdateDataset,
    onSearchDataset,
    onNerSearchDataset,
    onCreateSubset,
    onListDatasetShares,
    onShareDataset,
    onUpdateDatasetShare,
    onRevokeDatasetShare,
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

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editName, setEditName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editIsPublic, setEditIsPublic] = useState(false)
    const [editAclOverride, setEditAclOverride] = useState(false)

    useEffect(() => {
        if (!dataset) return
        setEditName(dataset.name)
        setEditDescription(dataset.description ?? "")
        setEditIsPublic(dataset.is_public)
        setEditAclOverride(dataset.acl_override_enabled)
    }, [dataset])

    const handleUpdateDatasetMetadata = async () => {
        if (!dataset) return
        try {
            await onUpdateDataset(dataset.id, {
                name: editName,
                description: editDescription || null,
                is_public: editIsPublic,
                acl_override_enabled: editAclOverride,
            })
            toast.success("Dataset updated")
            setIsEditDialogOpen(false)
        } catch {
            toast.error("Failed to update dataset")
        }
    }

    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<DatasetSearchResponse | null>(null)
    const [searchLoading, setSearchLoading] = useState(false)

    const handleDatasetSearch = async () => {
        if (!dataset || !searchQuery.trim()) return
        setSearchLoading(true)
        try {
            const response = await onSearchDataset(dataset.id, { query: searchQuery.trim(), page: 1, page_size: 20 })
            setSearchResults(response)
        } catch {
            toast.error("Dataset search failed")
        } finally {
            setSearchLoading(false)
        }
    }

    const [isNerDialogOpen, setIsNerDialogOpen] = useState(false)
    const [nerQuery, setNerQuery] = useState("")
    const [nerResults, setNerResults] = useState<DatasetNerSearchResponse | null>(null)
    const [nerLoading, setNerLoading] = useState(false)

    const handleDatasetNerSearch = async () => {
        if (!dataset || !nerQuery.trim()) return
        setNerLoading(true)
        try {
            const response = await onNerSearchDataset(dataset.id, { q: nerQuery.trim(), limit: 20 })
            setNerResults(response)
        } catch {
            toast.error("Dataset NER search failed")
        } finally {
            setNerLoading(false)
        }
    }

    const [isSubsetDialogOpen, setIsSubsetDialogOpen] = useState(false)
    const [subsetName, setSubsetName] = useState("")
    const [subsetDescription, setSubsetDescription] = useState("")

    const handleCreateSubset = async () => {
        if (!dataset) return
        if (!subsetName.trim()) {
            toast.error("Subset name is required")
            return
        }
        if (selectedIds.size === 0) {
            toast.error("Select at least one file for subset creation")
            return
        }

        try {
            await onCreateSubset(dataset.id, {
                name: subsetName.trim(),
                description: subsetDescription.trim() || null,
                file_ids: Array.from(selectedIds),
            })
            toast.success("Subset dataset created")
            setIsSubsetDialogOpen(false)
            setSubsetName("")
            setSubsetDescription("")
        } catch {
            toast.error("Failed to create subset")
        }
    }

    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
    const [shares, setShares] = useState<DatasetShareResponse[]>([])
    const [shareTarget, setShareTarget] = useState("")
    const [sharePermission, setSharePermission] = useState<DatasetPermission>("read")
    const [shareExpiresAt, setShareExpiresAt] = useState("")
    const [sharesLoading, setSharesLoading] = useState(false)

    const loadShares = useCallback(async () => {
        if (!dataset) return
        setSharesLoading(true)
        try {
            const response = await onListDatasetShares(dataset.id)
            setShares(response)
        } catch {
            toast.error("Failed to load dataset shares")
        } finally {
            setSharesLoading(false)
        }
    }, [dataset, onListDatasetShares])

    useEffect(() => {
        if (!isShareDialogOpen) return
        loadShares()
    }, [isShareDialogOpen, loadShares])

    const handleAddShare = async () => {
        if (!dataset) return
        if (!shareTarget.trim()) {
            toast.error("Username is required")
            return
        }
        try {
            await onShareDataset(dataset.id, {
                username: shareTarget.trim(),
                permission: sharePermission,
                expires_at: shareExpiresAt ? new Date(shareExpiresAt).toISOString() : undefined,
            })
            setShareTarget("")
            setShareExpiresAt("")
            await loadShares()
            toast.success("Dataset shared")
        } catch {
            toast.error("Failed to share dataset")
        }
    }

    const handlePermissionChange = async (shareId: string, permission: DatasetPermission) => {
        if (!dataset) return
        try {
            await onUpdateDatasetShare(dataset.id, shareId, permission)
            await loadShares()
            toast.success("Share permission updated")
        } catch {
            toast.error("Failed to update share")
        }
    }

    const handleRevokeShare = async (shareId: string) => {
        if (!dataset) return
        try {
            await onRevokeDatasetShare(dataset.id, shareId)
            await loadShares()
            toast.success("Share revoked")
        } catch {
            toast.error("Failed to revoke share")
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
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                                    <IconEdit className="mr-2 size-4" />
                                    Edit
                                </Button>
                                <Button variant="outline" onClick={() => setIsSearchDialogOpen(true)}>
                                    <IconSearch className="mr-2 size-4" />
                                    Search
                                </Button>
                                <Button variant="outline" onClick={() => setIsNerDialogOpen(true)}>
                                    <IconSearch className="mr-2 size-4" />
                                    NER Search
                                </Button>
                                <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
                                    <IconShare className="mr-2 size-4" />
                                    Shares
                                </Button>
                                <Button variant="outline" onClick={() => setIsSubsetDialogOpen(true)} disabled={selectedIds.size === 0}>
                                    <IconCopyPlus className="mr-2 size-4" />
                                    Subset ({selectedIds.size})
                                </Button>
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Dataset</DialogTitle>
                        <DialogDescription>Update dataset metadata and visibility.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="dataset-name">Name</Label>
                            <Input id="dataset-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dataset-description">Description</Label>
                            <Textarea id="dataset-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <Label htmlFor="dataset-public">Public Dataset</Label>
                            <Switch id="dataset-public" checked={editIsPublic} onCheckedChange={setEditIsPublic} />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <Label htmlFor="dataset-acl">ACL Override</Label>
                            <Switch id="dataset-acl" checked={editAclOverride} onCheckedChange={setEditAclOverride} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateDatasetMetadata}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Search Dataset</DialogTitle>
                        <DialogDescription>Run full-text search scoped to this dataset.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search query"
                            />
                            <Button onClick={handleDatasetSearch} disabled={searchLoading || !searchQuery.trim()}>
                                {searchLoading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                        <div className="rounded-md border max-h-72 overflow-auto">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>Filename</TableHead>
                                        <TableHead>Path</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {searchResults?.results?.length ? (
                                        searchResults.results.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell className="font-medium">{row.filename}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground truncate max-w-[280px]">{row.file_path}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                                                {searchLoading ? "Searching..." : "No results"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isNerDialogOpen} onOpenChange={setIsNerDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>NER Search</DialogTitle>
                        <DialogDescription>Find named entities scoped to this dataset.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                value={nerQuery}
                                onChange={(e) => setNerQuery(e.target.value)}
                                placeholder="Entity search term"
                            />
                            <Button onClick={handleDatasetNerSearch} disabled={nerLoading || !nerQuery.trim()}>
                                {nerLoading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                        <div className="rounded-md border p-3 max-h-72 overflow-auto">
                            <pre className="text-xs whitespace-pre-wrap">
                                {nerResults ? JSON.stringify(nerResults, null, 2) : "No results"}
                            </pre>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isSubsetDialogOpen} onOpenChange={setIsSubsetDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Subset Dataset</DialogTitle>
                        <DialogDescription>
                            Create a new dataset from {selectedIds.size} selected file(s).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subset-name">Subset Name</Label>
                            <Input id="subset-name" value={subsetName} onChange={(e) => setSubsetName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subset-description">Description</Label>
                            <Textarea id="subset-description" value={subsetDescription} onChange={(e) => setSubsetDescription(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubsetDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateSubset}>Create Subset</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Dataset Shares</DialogTitle>
                        <DialogDescription>Grant, update, or revoke access to this dataset.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="sm:col-span-1">
                                <Label htmlFor="share-target">Username</Label>
                                <Input id="share-target" value={shareTarget} onChange={(e) => setShareTarget(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="share-permission">Permission</Label>
                                <select
                                    id="share-permission"
                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                    value={sharePermission}
                                    onChange={(e) => setSharePermission(e.target.value as DatasetPermission)}
                                >
                                    <option value="read">read</option>
                                    <option value="write">write</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="share-expires">Expires At</Label>
                                <Input id="share-expires" type="date" value={shareExpiresAt} onChange={(e) => setShareExpiresAt(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleAddShare}>Add Share</Button>
                        </div>
                        <div className="rounded-md border max-h-72 overflow-auto">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Permission</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sharesLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading...</TableCell>
                                        </TableRow>
                                    ) : shares.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No shares configured</TableCell>
                                        </TableRow>
                                    ) : (
                                        shares.map((share) => (
                                            <TableRow key={share.id}>
                                                <TableCell>
                                                    {share.username ?? share.entra_user_id ?? share.entra_group_id ?? "Unknown"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary">{share.permission}</Badge>
                                                        <select
                                                            className="h-8 rounded-md border bg-background px-2 text-xs"
                                                            value={share.permission}
                                                            onChange={(e) => handlePermissionChange(share.id, e.target.value as DatasetPermission)}
                                                        >
                                                            <option value="read">read</option>
                                                            <option value="write">write</option>
                                                            <option value="admin">admin</option>
                                                        </select>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {share.expires_at ? new Date(share.expires_at).toLocaleDateString() : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="destructive" size="sm" onClick={() => handleRevokeShare(share.id)}>
                                                        Revoke
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
