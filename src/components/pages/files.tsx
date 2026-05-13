// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef
} from "react"

import { useTranslation } from "react-i18next"

import {
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react"

import {
  IconFileSearch,
  IconPlus,
  IconRefresh
} from "@tabler/icons-react"

import {
  toast
} from "sonner"

import type {
  FileMetadataResponse,
  FilesResponse,
  SharesResponse,
  FileSearchParams,
  FileSearchResponse,
  MonitoringOverviewResponse,
  FileEntry,
  CreateDatasetRequest,
} from "@/services/neo-api"
import type { CreateDatasetFormValues } from "@/components/dialogs/create-dataset-dialog"
import { OverviewCard } from "@/components/cards/overview-card"

import {
  FilesTable
} from "@/components/data-tables/filesT"

import {
  SearchFilesDialog
} from "@/components/dialogs/search-files-dialog"

import {
  CreateDatasetDialog
} from "@/components/dialogs/create-dataset-dialog"

import {
  cn
} from "@/lib/utils"
import { useSettings } from "@/context/settings-context"

import {
  Button
} from "@/components/ui/button"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

interface FilesProps {
  files: FilesResponse | null
  shares: SharesResponse[] | null
  onSelectShare: (shareId: string | null) => Promise<void> // Update type to accept null
  onFetchFileMetadata: (shareId: string, fileId: string) => Promise<FileMetadataResponse> // Fix parameter order
  onSearchFiles: (params: FileSearchParams) => Promise<FileSearchResponse>
  onPageChange?: (page: number) => Promise<void>
  onCreateDataset: (payload: Omit<CreateDatasetRequest, "file_ids">, files: FileEntry[]) => Promise<void>
  onRefresh: () => Promise<void>
  monitoringOverview: MonitoringOverviewResponse | null
  cacheStats?: {
    sizeBytes: number
    items: number
  }
}

const NONE_VALUE = "__none__"
const ALL_VALUE = "__all__"

export default function Files({
  files,
  shares,
  onSelectShare,
  onFetchFileMetadata,
  onSearchFiles,
  onPageChange,
  onCreateDataset,
  onRefresh,
  monitoringOverview,
  cacheStats,
}: FilesProps) {
  const { t } = useTranslation()
  const { contentVisibilityEnabled } = useSettings()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<string>(NONE_VALUE)
  const [loading, setLoading] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [createDatasetDialogOpen, setCreateDatasetDialogOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<FileSearchResponse | null>(null)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Pagination state - track cursor for keyset pagination
  const [paginationMode, setPaginationMode] = useState<"offset" | "keyset">("offset")

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<FileMetadataResponse | null>(null)

  const options = useMemo(
    () =>
      (shares ?? []).map((share) => ({
        value: String(share.id),
        label: share.share_path || `Share #${share.id}`,
      })),
    [shares]
  )

  const onSelectShareRef = useRef(onSelectShare)
  onSelectShareRef.current = onSelectShare

  useEffect(() => {
    // Reset to "No selection" on mount to clear previous state
    onSelectShareRef.current(null).catch(console.error)
  }, [])

  useEffect(() => {
    if (!shares?.length) {
      setValue(NONE_VALUE)
      return
    }

    if (value !== NONE_VALUE && value !== ALL_VALUE) {
      const exists = options.some((option) => option.value === value)
      if (!exists) {
        setValue(NONE_VALUE)
      }
    }
  }, [options, shares, value])

  const currentLabel =
    value === ALL_VALUE
      ? "All shares"
      : value === NONE_VALUE
        ? "Select share…"
        : options.find((option) => option.value === value)?.label ?? "Select share…"

  const emptyMessage = loading
    ? "Loading files…"
    : isSearchMode
      ? "No files match the current search."
      : value === NONE_VALUE
        ? "Select a share to view files."
        : "No files available."

  const hasShares = Boolean(options.length)

  const handleSelect = async (nextValue: string) => {
    setIsSearchMode(false)
    setSearchResults(null)
    const resolved = nextValue
    setValue(resolved)
    setOpen(false)

    const shouldLoad = resolved !== NONE_VALUE
    if (shouldLoad) {
      setLoading(true)
    }

    try {
      if (resolved === NONE_VALUE) {
        await onSelectShare(null) // This now works with updated type
      } else if (resolved === ALL_VALUE) {
        await onSelectShare("all")
      } else {
        await onSelectShare(resolved)
      }
    } finally {
      if (shouldLoad) {
        setLoading(false)
      }
    }
  }

  const handleSearch = async (params: FileSearchParams) => {
    setLoading(true)
    setIsSearchMode(true)
    
    // Reset pagination state for new search
    setPaginationMode("offset")

    try {
      const results = await onSearchFiles(params)
      setSearchResults(results)
      setSearchDialogOpen(false)
      
      // Auto-detect pagination mode from results
      if (results.next_cursor) {
        setPaginationMode("keyset")
      }
      
      if (!results.total_count) {
        toast.info("No files matched your search")
      }
    } catch (error) {
      console.error("Search failed", error)
      toast.error(error instanceof Error ? error.message : "Failed to search files")
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setIsSearchMode(false)
    setSearchResults(null)
  }

  const handleRefreshTable = async () => {
    if (isSearchMode) {
      toast.info("Clear search to refresh the selected share table")
      return
    }

    setIsRefreshing(true)
    setLoading(true)

    try {
      await onRefresh()

      if (value === NONE_VALUE) {
        await onSelectShare(null)
      } else if (value === ALL_VALUE) {
        await onSelectShare("all")
      } else {
        await onSelectShare(value)
      }
    } catch {
      toast.error("Failed to refresh files")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleCreateDataset = async (values: CreateDatasetFormValues) => {
    if (searchResults?.files) {
      await onCreateDataset(
        {
          name: values.name,
          description: values.description,
          is_public: values.is_public,
          acl_override_enabled: values.acl_override_enabled,
        },
        searchResults.files
      )
      toast.success(`Dataset "${values.name}" created`)
    }
  }

  const displayFiles = useMemo<FilesResponse | null>(() => {
    if (isSearchMode && searchResults) {
      // Detect pagination mode from next_cursor
      const isKeysetMode = !!searchResults.next_cursor
      if (isKeysetMode) {
        setPaginationMode("keyset")
      }
      
      return {
        share_id: "__search__",
        path: "Search results",
        files: searchResults.files,
        total_count: searchResults.total_count,
        total_size: searchResults.total_size,
        page: searchResults.page,
        page_size: searchResults.page_size,
        total_pages: searchResults.total_pages,
        has_next: searchResults.has_next,
        has_previous: searchResults.has_previous,
        next_cursor: searchResults.next_cursor,
        content_truncated: searchResults.content_truncated,
        truncated_file_count: searchResults.truncated_file_count,
        max_content_length_applied: searchResults.max_content_length_applied,
        response_size_warning: searchResults.response_size_warning,
      }
    }

    return files
      ? {
        ...files,
        files: files.files.map((file) => ({
          ...file,
          unc_path:
            file.unc_path ||
            shares?.find((s) => String(s.id) === file.share_id)?.share_path ||
            "",
        })),
      }
      : null
  }, [files, isSearchMode, searchResults, shares])

  const selectedShareId =
    value === ALL_VALUE || value === NONE_VALUE ? undefined : value

  const handlePageChange = async (page: number) => {
    if (onPageChange) {
      setLoading(true)
      try {
        await onPageChange(page)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleFileClick = useCallback(async (file: FileEntry) => {
    // Determine effective share ID similar to how FilesTable did it
    const effectiveShareId = selectedShareId ?? file.share_id

    if (!effectiveShareId || effectiveShareId === "__search__") {
      // For search results, file.id is available for direct lookup
      if (!file.id) {
        toast.error("File ID not available for this file")
        return
      }
      // Will use direct file lookup fallback
    }

    setSheetOpen(true)
    setMetadataLoading(true)
    setMetadataError(null)
    setMetadata(null)

    try {
      const data = await onFetchFileMetadata(effectiveShareId || "__search__", file.id)
      setMetadata(data)
    } catch (error) {
      setMetadataError(error instanceof Error ? error.message : "Failed to load file metadata.")
    } finally {
      setMetadataLoading(false)
    }
  }, [selectedShareId, onFetchFileMetadata])

  const metadataWithoutContent = useMemo(() => {
    if (!metadata) return null
    const { content, content_chunks, ...rest } = metadata
    return rest
  }, [metadata])

  const metadataContent = useMemo(() => {
    if (!metadata || !contentVisibilityEnabled) return null

    if (metadata.content) {
      return metadata.content
    }

    if (metadata.content_chunks?.length) {
      return metadata.content_chunks.join("")
    }

    return null
  }, [metadata, contentVisibilityEnabled])

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <OverviewCard
                overview={monitoringOverview}
                title={t("indexOverviewTitle", { ns: "pages" })}
                variant="files"
                cacheStats={cacheStats}
                showCacheStats={false}
              />
            </div>
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between sm:w-[260px]"
                      disabled={!hasShares && value !== NONE_VALUE}
                      aria-busy={loading}
                    >
                      {hasShares ? currentLabel : "No shares available"}
                      {loading ? (
                        <Loader2 className="ml-2 size-4 animate-spin opacity-70" />
                      ) : (
                        <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Search share…" className="h-9" />
                      <CommandList>
                        <CommandEmpty>No shares found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value={NONE_VALUE} onSelect={(currentValue) => void handleSelect(currentValue)}>
                            Show none
                            <Check
                              className={cn(
                                "ml-auto size-4",
                                value === NONE_VALUE ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                          <CommandItem value={ALL_VALUE} onSelect={(currentValue) => void handleSelect(currentValue)}>
                            All shares
                            <Check
                              className={cn(
                                "ml-auto size-4",
                                value === ALL_VALUE ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        </CommandGroup>
                        {options.length ? (
                          <CommandGroup heading="Shares">
                            {options.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={(currentValue) => void handleSelect(currentValue)}
                              >
                                {option.label}
                                <Check
                                  className={cn(
                                    "ml-auto size-4",
                                    value === option.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ) : null}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {isSearchMode ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleClearSearch}>
                      Clear search
                    </Button>
                    <Button variant="default" size="sm" onClick={() => setCreateDatasetDialogOpen(true)}>
                      <IconPlus className="mr-2 size-4" />
                      Create dataset
                    </Button>
                  </>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button variant="default" onClick={() => setSearchDialogOpen(true)}>
                  <IconFileSearch className="mr-2 size-4" />
                  Filter files
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshTable}
                  disabled={isRefreshing || loading}
                  aria-label="Refresh files"
                >
                  <IconRefresh className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {isSearchMode ? (
              <div className="mb-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Showing search results across all accessible shares.
                </p>
                {paginationMode === "keyset" && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    ⚡ Using optimized keyset pagination (cursor-based) for better performance
                  </p>
                )}
                {displayFiles?.response_size_warning && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ {displayFiles.response_size_warning}
                  </p>
                )}
              </div>
            ) : files?.share_id ? (
              <p className="mb-2 text-sm text-muted-foreground">
                Showing files for:{" "}
                <span className="font-medium">
                  {files.path || shares?.find((s) => String(s.id) === files.share_id)?.share_path} ({files.share_id})
                </span>
              </p>
            ) : null}

            <FilesTable
              files={displayFiles}
              loading={loading}
              emptyMessage={emptyMessage}
              shareId={selectedShareId}
              onPageChange={handlePageChange}
              onFileClick={handleFileClick}
            />
          </div>
        </div>
      </div>

      <SearchFilesDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSearch={handleSearch}
        allowContentVisibility={contentVisibilityEnabled}
      />

      <CreateDatasetDialog
        open={createDatasetDialogOpen}
        onOpenChange={setCreateDatasetDialogOpen}
        onSave={handleCreateDataset}
      />

      <Sheet open={sheetOpen} onOpenChange={(open) => {
        setSheetOpen(open)
        if (!open) {
          setMetadata(null)
          setMetadataError(null)
          setMetadataLoading(false)
        }
      }}>
          <SheetContent side="top" hideCloseButton className="max-h-[95vh] flex flex-col p-0 gap-0">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              <SheetHeader className="mb-4 p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle>File details</SheetTitle>
                    <SheetDescription>
                      Detailed information about the selected file
                    </SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button size="sm">Close</Button>
                  </SheetClose>
                </div>
              </SheetHeader>

              <Separator className="mb-6" />

              <div className="space-y-4">
                {metadataLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Spinner className="size-6" />
                  </div>
                ) : metadataError ? (
                  <p className="text-sm text-destructive">{metadataError}</p>
                ) : metadata ? (
                <dl className="grid grid-cols-1 gap-y-3 text-sm text-muted-foreground sm:grid-cols-3 sm:gap-x-6">
                  <div>
                    <dt className="font-medium text-foreground">Filename</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.filename}</pre></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">File type</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.file_type || "—"}</pre></dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="font-medium text-foreground">File path</dt>
                    <dd className="break-words p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.file_path}</pre></dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="font-medium text-foreground">UNC path</dt>
                    <dd className="break-words p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.unc_path}</pre></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Size</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.size.toLocaleString()} bytes</pre></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">File ID</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.id}</pre></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Created</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(metadata.created_at).toLocaleString()}</pre></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Modified</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(metadata.modified_time).toLocaleString()}</pre></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Accessed</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(metadata.accessed_at).toLocaleString()}</pre></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Indexed</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.indexed_at ? new Date(metadata.indexed_at).toLocaleString() : "—"}</pre></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Conversion (ms)</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.conversion_duration_ms}</pre></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Extractor</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.extractor_used || "—"}</pre></dd>
                  </div>
                  <div className="sm:col-span-3">
                    <dt className="font-medium text-foreground">ACL principals</dt>
                    <dd className="p-1">
                      <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                        {metadata.acl_principals?.length ? metadata.acl_principals.join(", ") : "N/A"}
                      </pre>
                    </dd>
                  </div>
                  <div className="sm:col-span-3">
                    <dt className="font-medium text-foreground">Resolved principals</dt>
                    <dd className="p-1">
                      {metadata.resolved_principals?.length ? (
                        <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                          {JSON.stringify(metadata.resolved_principals, null, 2)}
                        </pre>
                      ) : (
                        <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">"N/A"</pre>
                      )}
                    </dd>
                  </div>
                  {contentVisibilityEnabled ? (
                    <div className="sm:col-span-3">
                      <dt className="font-medium text-foreground">Content</dt>
                      <dd className="p-1">
                        <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap break-words">
                          {metadataContent || "—"}
                        </pre>
                      </dd>
                    </div>
                  ) : null}
                  <div className="sm:col-span-3">
                    <dt className="font-medium text-foreground">All Fields</dt>
                    <dd className="p-1">
                      <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(contentVisibilityEnabled ? metadata : metadataWithoutContent, null, 2)}
                      </pre>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No details available.</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
