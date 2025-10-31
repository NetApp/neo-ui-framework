"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { IconFileSearch } from "@tabler/icons-react"
import { toast } from "sonner"

import type {
  FileMetadataResponse,
  FilesResponse,
  SharesResponse,
  FileSearchParams,
  FileSearchResponse,
} from "../services/neo-api"
import { FilesTable } from "../data-tables/files"
import { SearchFilesDialog } from "../dialogs/search-files-dialog"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

interface FilesProps {
  files: FilesResponse | null
  shares: SharesResponse[] | null
  onSelectShare: (shareId: string | "all" | null) => Promise<void>
  onFetchFileMetadata: (shareId: string, fileId: string) => Promise<FileMetadataResponse>
  onSearchFiles: (params: FileSearchParams) => Promise<FileSearchResponse>
}

const NONE_VALUE = "__none__"
const ALL_VALUE = "__all__"

export default function Files({ files, shares, onSelectShare, onFetchFileMetadata, onSearchFiles }: FilesProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<string>(NONE_VALUE)
  const [loading, setLoading] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
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
        await onSelectShare(null)
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
        toast.info("No files matched your search.")
      }
    } catch (error) {
      console.error("Search failed", error)
      toast.error(error instanceof Error ? error.message : "Failed to search files.")
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setIsSearchMode(false)
    setSearchResults(null)
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
  }, [files, isSearchMode, searchResults])

  const selectedShareId =
    value === ALL_VALUE || value === NONE_VALUE ? undefined : value

  const tableShareId = isSearchMode ? undefined : selectedShareId
  const metadataHandler =
    isSearchMode || selectedShareId ? onFetchFileMetadata : undefined

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end sm:gap-3">
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
                  <Button variant="outline" size="sm" onClick={handleClearSearch}>
                    Clear search
                  </Button>
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
            ) : files?.path ? (
              <p className="mb-2 text-sm text-muted-foreground">
                Showing files for:{" "}
                <span className="font-medium">
                  {files.path} ({files.share_id})
                </span>
              </p>
            ) : null}

            <FilesTable
              files={displayFiles}
              loading={loading}
              emptyMessage={emptyMessage}
              onFetchFileMetadata={metadataHandler}
              shareId={tableShareId}
            />
          </div>
        </div>
      </div>

      <SearchFilesDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSearch={handleSearch}
      />
    </div>
  )
}
