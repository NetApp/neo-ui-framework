// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useMemo } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import type { FileMetadataResponse, FileEntry } from "@/services/neo-api"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"

interface FileDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedFile: FileEntry | null
  metadata: FileMetadataResponse | null
  loading: boolean
  error?: string | null
  contentLoading?: boolean
  contentVisibilityEnabled?: boolean
}

export function FileDetailsSheet({
  open,
  onOpenChange,
  selectedFile,
  metadata,
  loading,
  error,
  contentLoading = false,
  contentVisibilityEnabled = false,
}: FileDetailsSheetProps) {
  const metadataWithoutContent = useMemo(() => {
    if (!metadata) return null
    const { content, content_chunks, ...rest } = metadata as FileMetadataResponse & { content?: unknown; content_chunks?: unknown }
    return rest
  }, [metadata])

  const metadataContent = useMemo(() => {
    if (!metadata || !contentVisibilityEnabled) return null
    return (metadata as FileMetadataResponse & { content?: string }).content || null
  }, [metadata, contentVisibilityEnabled])

  const hasContent = contentVisibilityEnabled && metadata

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" hideCloseButton className="max-h-[95vh] flex flex-col p-0 gap-0">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <SheetHeader className="mb-4 p-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <SheetTitle>File details</SheetTitle>
                <SheetDescription>
                  {selectedFile?.filename}
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button size="sm">Close</Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="mt-4 flex-1 flex flex-col">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner className="size-8" />
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : hasContent ? (
              <Tabs defaultValue="details" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-4 flex-1 flex flex-col data-[state='inactive']:hidden">
                  {metadata ? (
                    <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
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
                      {metadata.is_directory !== undefined && (
                        <div>
                          <dt className="font-medium text-foreground">Directory</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.is_directory ? "Yes" : "No"}</pre></dd>
                        </div>
                      )}
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
                      {metadata.indexed_at && (
                        <div>
                          <dt className="font-medium text-foreground">Indexed</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.indexed_at ? new Date(metadata.indexed_at).toLocaleString() : "—"}</pre></dd>
                        </div>
                      )}
                      {metadata.conversion_duration_ms !== undefined && (
                        <div>
                          <dt className="font-medium text-foreground">Conversion (ms)</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.conversion_duration_ms}</pre></dd>
                        </div>
                      )}
                      {metadata.extractor_used && (
                        <div>
                          <dt className="font-medium text-foreground">Extractor</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.extractor_used || "—"}</pre></dd>
                        </div>
                      )}
                      {metadata.acl_principals && (
                        <div className="sm:col-span-3">
                          <dt className="font-medium text-foreground">ACL principals</dt>
                          <dd className="p-1">
                            <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                              {metadata.acl_principals?.length ? metadata.acl_principals.join(", ") : "N/A"}
                            </pre>
                          </dd>
                        </div>
                      )}
                      {metadata.resolved_principals && (
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
                      )}
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
                    <p className="text-center text-muted-foreground">No metadata available</p>
                  )}
                </TabsContent>
                <TabsContent value="content" className="mt-4 flex-1 flex flex-col data-[state='inactive']:hidden">
                  {contentLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner className="size-8" />
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md font-mono whitespace-pre-wrap [&_b]:text-red-500 [&_b]:font-bold">
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {metadataContent || "*No content available*"}
                      </Markdown>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : metadata ? (
              <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
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
                {metadata.is_directory !== undefined && (
                  <div>
                    <dt className="font-medium text-foreground">Directory</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.is_directory ? "Yes" : "No"}</pre></dd>
                  </div>
                )}
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
                {metadata.indexed_at && (
                  <div>
                    <dt className="font-medium text-foreground">Indexed</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.indexed_at ? new Date(metadata.indexed_at).toLocaleString() : "—"}</pre></dd>
                  </div>
                )}
                {metadata.conversion_duration_ms !== undefined && (
                  <div>
                    <dt className="font-medium text-foreground">Conversion (ms)</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.conversion_duration_ms}</pre></dd>
                  </div>
                )}
                {metadata.extractor_used && (
                  <div>
                    <dt className="font-medium text-foreground">Extractor</dt>
                    <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.extractor_used || "—"}</pre></dd>
                  </div>
                )}
                {metadata.acl_principals && (
                  <div className="sm:col-span-3">
                    <dt className="font-medium text-foreground">ACL principals</dt>
                    <dd className="p-1">
                      <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                        {metadata.acl_principals?.length ? metadata.acl_principals.join(", ") : "N/A"}
                      </pre>
                    </dd>
                  </div>
                )}
                {metadata.resolved_principals && (
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
                )}
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
  )
}
