import { useState, useCallback } from "react"
import type {
    SharesResponse,
    ContentSearchRequest,
    ContentSearchResponse,
    MonitoringOverviewResponse,
    FileEntry,
    VersionResponse
} from "@/services/models"
import {
    IconSearch,
    IconFilter,
    IconFileTypePdf,
    IconFileTypeDoc,
    IconFileTypeXls,
    IconFileText,
    IconClock,
    IconDatabase,
    IconPlus,
    IconAlertCircle
} from "@tabler/icons-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { toast } from "sonner"
import { OverviewCard } from "@/components/cards/overview-card"
import { CreateDatasetDialog } from "@/components/dialogs/create-dataset-dialog"

interface ContentSearchProps {
    shares: SharesResponse[] | null
    onContentSearch: (payload: ContentSearchRequest) => Promise<ContentSearchResponse>
    onCreateDataset: (name: string, files: FileEntry[]) => void
    monitoringOverview: MonitoringOverviewResponse | null
    version: VersionResponse | null
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
    pdf: <IconFileTypePdf className="h-4 w-4 text-red-500" />,
    doc: <IconFileTypeDoc className="h-4 w-4 text-blue-500" />,
    docx: <IconFileTypeDoc className="h-4 w-4 text-blue-500" />,
    xls: <IconFileTypeXls className="h-4 w-4 text-green-500" />,
    xlsx: <IconFileTypeXls className="h-4 w-4 text-green-500" />,
    txt: <IconFileText className="h-4 w-4 text-gray-500" />,
}

export default function ContentSearch({ shares, onContentSearch, onCreateDataset, monitoringOverview, version }: ContentSearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<ContentSearchResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [createDatasetDialogOpen, setCreateDatasetDialogOpen] = useState(false)

    // Filters
    const [selectedShare, setSelectedShare] = useState<string>("all")
    const [fileType, setFileType] = useState<string>("all")
    const [sortBy, setSortBy] = useState<"relevance" | "modified_time">("relevance")

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setResults(null)

        try {
            const payload: ContentSearchRequest = {
                query,
                sort_by: sortBy,
                page: 1,
                page_size: 100,
            }

            if (selectedShare !== "all") {
                payload.share_ids = [selectedShare]
            }

            if (fileType !== "all") {
                payload.file_types = [fileType]
            }

            const response = await onContentSearch(payload)
            setResults(response)
        } catch (error) {
            toast.error("Search failed. Please try again.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [query, selectedShare, fileType, sortBy, onContentSearch])

    const handleClearSearch = () => {
        setQuery("")
        setResults(null)
        setSelectedShare("all")
        setFileType("all")
        setSortBy("relevance")
        setFiltersOpen(false)
    }

    const handleCreateDataset = async (name: string) => {
        if (!results?.results) return

        const files: FileEntry[] = results.results.map(r => ({
            id: r.id,
            file_path: r.file_path,
            unc_path: r.unc_path,
            filename: r.filename,
            size: r.size,
            created_at: new Date().toISOString(), // Fallback as not returned by search
            modified_time: r.modified_time,
            accessed_at: new Date().toISOString(), // Fallback as not returned by search
            is_directory: false,
            file_type: r.file_type,
            indexed_at: r.indexed_at,
            share_id: r.share_id
        }))

        onCreateDataset(name, files)
        toast.success(`Dataset "${name}" created`)
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <OverviewCard
                overview={monitoringOverview}
                title="Content Search"
                description="Search across all your indexed documents."
                showCacheStats={false}
            />

            {/* Version Check Alert */}
            {(() => {
                if (!version?.version) return null
                // Simple version check assuming semantic versioning format x.y.z
                // We want to show alert if version < 3.0.5
                // A robust semantic version comparison is ideal but for specific requirement a direct check can work if limited
                // Or better, a small helper.

                const currentVersion = version.version.split('-')[0] // remove prerelease tag if any
                const targetVersion = "3.0.5"

                // Helper to compare versions
                const compareVersions = (v1: string, v2: string) => {
                    const parts1 = v1.split('.').map(Number)
                    const parts2 = v2.split('.').map(Number)

                    for (let i = 0; i < 3; i++) {
                        const p1 = parts1[i] || 0
                        const p2 = parts2[i] || 0

                        if (p1 > p2) return 1
                        if (p1 < p2) return -1
                    }
                    return 0
                }

                if (compareVersions(currentVersion, targetVersion) < 0) {
                    return (
                        <Alert variant="destructive">
                            <IconAlertCircle className="h-4 w-4" />
                            <AlertTitle>Feature Unavailable</AlertTitle>
                            <AlertDescription>
                                Feature only available starting with Neo Connector version 3.0.5
                            </AlertDescription>
                        </Alert>
                    )
                }
                return null
            })()}

            <div className="w-full space-y-6">
                {/* Search Input Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search Content</CardTitle>
                        <CardDescription>
                            Perform full-text search across all your indexed documents.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search for documents (e.g., 'invoice 2024', 'project alpha')..."
                                        className="pl-9"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Searching..." : "Search"}
                                </Button>
                                {results && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClearSearch}
                                        disabled={loading}
                                    >
                                        Clear search
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                >
                                    <IconFilter className="mr-2 h-4 w-4" />
                                    Filters
                                </Button>
                            </div>

                            {filtersOpen && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="share-filter">Share</Label>
                                        <Select value={selectedShare} onValueChange={setSelectedShare}>
                                            <SelectTrigger id="share-filter">
                                                <SelectValue placeholder="All Shares" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Shares</SelectItem>
                                                {shares?.map((share) => (
                                                    <SelectItem key={share.id} value={share.id}>
                                                        {share.share_path}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type-filter">File Type</Label>
                                        <Select value={fileType} onValueChange={setFileType}>
                                            <SelectTrigger id="type-filter">
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="pdf">PDF</SelectItem>
                                                <SelectItem value="docx">Word (DOCX)</SelectItem>
                                                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                                                <SelectItem value="txt">Text (TXT)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sort-filter">Sort By</Label>
                                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                            <SelectTrigger id="sort-filter">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="relevance">Relevance</SelectItem>
                                                <SelectItem value="modified_time">Date Modified</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Results Section */}
                {loading && (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                )}

                {results && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Found {results.total_count} results in {results.search_time_ms}ms
                            </p>
                            {results.database_type && (
                                <Badge variant="outline" className="text-xs">
                                    <IconDatabase className="mr-1 h-3 w-3" />
                                    {results.database_type}
                                </Badge>
                            )}
                        </div>

                        <div className="flex justify-end mb-4">
                            <Button variant="default" onClick={() => setCreateDatasetDialogOpen(true)}>
                                <IconPlus className="mr-2 h-4 w-4" />
                                Create dataset
                            </Button>
                        </div>

                        {results.results.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <IconSearch className="h-12 w-12 mb-4 opacity-20" />
                                    <p className="text-lg font-medium">No results found</p>
                                    <p className="text-sm">Try adjusting your search terms or filters.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {results.results.map((result) => (
                                    <Card key={result.id} className="overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    {FILE_TYPE_ICONS[result.file_type] || <IconFileText className="h-4 w-4 text-gray-500" />}
                                                    <CardTitle className="text-base font-medium truncate" title={result.filename}>
                                                        {result.filename}
                                                    </CardTitle>
                                                </div>
                                                <Badge variant={result.relevance_score > 0.5 ? "default" : "secondary"}>
                                                    Score: {result.relevance_score.toFixed(2)}
                                                </Badge>
                                            </div>
                                            <CardDescription className="flex items-center gap-4 text-xs mt-1">
                                                <span className="truncate max-w-[300px]" title={result.unc_path}>
                                                    {result.unc_path}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <IconClock className="h-3 w-3" />
                                                    {new Date(result.modified_time).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                <span>{(result.size / 1024).toFixed(1)} KB</span>
                                            </CardDescription>
                                        </CardHeader>
                                        {result.snippet && (
                                            <CardContent>
                                                <div
                                                    className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md font-mono whitespace-pre-wrap [&_b]:text-red-500 [&_b]:font-bold"
                                                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                                                />
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateDatasetDialog
                open={createDatasetDialogOpen}
                onOpenChange={setCreateDatasetDialogOpen}
                onSave={handleCreateDataset}
            />
        </div>
    )
}
