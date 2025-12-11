"use client"

import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react"

import {
  IconFileSearch,
  IconPlus
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
  FileEntry
} from "@/services/neo-api"
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

interface FilesProps {
  files: FilesResponse | null
  shares: SharesResponse[] | null
  onSelectShare: (shareId: string | null) => Promise<void> // Update type to accept null
  onFetchFileMetadata: (shareId: string, fileId: string) => Promise<FileMetadataResponse> // Fix parameter order
  onSearchFiles: (params: FileSearchParams) => Promise<FileSearchResponse>
  onPageChange?: (page: number) => Promise<void>
  onCreateDataset: (name: string, files: FileEntry[]) => void
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
  // onRefresh, // Unused
  monitoringOverview,
  cacheStats,
}: FilesProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<string>(NONE_VALUE)
  const [loading, setLoading] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [createDatasetDialogOpen, setCreateDatasetDialogOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<FileSearchResponse | null>(null)
  const [isSearchMode, setIsSearchMode] = useState(false)

  const options = useMemo(
    () =>
      (shares ?? []).map((share) => ({
        value: String(share.id),
        label: share.share_path || `Share #${share.id}`,
      })),
    [shares]
  )

  useEffect(() => {
    // Reset to "No selection" on mount to clear previous state
    onSelectShare(null).catch(console.error)
  }, [onSelectShare])

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

    try {
      const results = await onSearchFiles(params)
      setSearchResults(results)
      setSearchDialogOpen(false)
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

  const handleCreateDataset = async (name: string) => {
    if (searchResults?.files) {
      onCreateDataset(name, searchResults.files)
      toast.success(`Dataset "${name}" created`)
    }
  }

  const displayFiles = useMemo<FilesResponse | null>(() => {
    if (isSearchMode && searchResults) {
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

  // Fix: Always provide the metadata handler when we have onFetchFileMetadata
  // For "All shares" or search mode, the FilesTable will use the file's share_id
  // Fix: The parameter order should match what FilesTable expects
  const metadataHandler = (shareId: string, fileId: string) => onFetchFileMetadata(shareId, fileId)

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

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <OverviewCard
                overview={monitoringOverview}
                title="Data Corpus Overview"
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

              <Button variant="outline" onClick={() => setSearchDialogOpen(true)}>
                <IconFileSearch className="mr-2 size-4" />
                Search files
              </Button>
            </div>

            {isSearchMode ? (
              <p className="mb-2 text-sm text-muted-foreground">
                Showing search results across all accessible shares.
              </p>
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
              onFetchFileMetadata={metadataHandler}
              shareId={selectedShareId}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <SearchFilesDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSearch={handleSearch}
      />

      <CreateDatasetDialog
        open={createDatasetDialogOpen}
        onOpenChange={setCreateDatasetDialogOpen}
        onSave={handleCreateDataset}
      />
    </div>
  )
}
