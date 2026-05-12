import { useEffect, useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNeoApi } from "@/hooks/useNeoApi"
import { NeoApiService } from "@/services/neo-api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { AlertTriangle, RefreshCw } from "lucide-react"
import type { SharesResponse } from "@/services/models"

interface EntityAggregate {
  value: string
  entity_type: string
  document_count: number
  mention_count: number
}

interface NERStats {
  total_entities: number
  total_files_processed: number
  entity_types: Record<string, number>
  processing_enabled: boolean
}

interface AnalyzeResult {
  success: boolean
  message: string
}

export default function EntitiesPage() {
  const { t } = useTranslation()
  const { state } = useNeoApi()
  const token = state.token
  const api = new NeoApiService()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<NERStats | null>(null)
  const [entities, setEntities] = useState<EntityAggregate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEntityType, setSelectedEntityType] = useState<string>("")
  const [entityTypes, setEntityTypes] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<EntityAggregate[]>([])
  const [searching, setSearching] = useState(false)

  // Analyze drawer state
  const [isAnalyzeDrawerOpen, setIsAnalyzeDrawerOpen] = useState(false)
  const [shares, setShares] = useState<SharesResponse[]>([])
  const [selectedShareId, setSelectedShareId] = useState<string>("")
  const [forceReanalyze, setForceReanalyze] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null)
  const [loadingShares, setLoadingShares] = useState(false)

  // Fetch NER stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return

      try {
        setLoading(true)
        const statsData = await api.getNERStats(token)
        setStats(statsData)

        // Extract unique entity types
        const types = Object.keys(statsData.entity_types || {})
        setEntityTypes(types)

        // Fetch entity aggregates
        const aggregates = await api.getEntityAggregates(token, {
          limit: 50,
        })
        setEntities(aggregates.results || [])
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch NER statistics"
        setError(message)
        console.error("Error fetching NER stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token])

  // Fetch shares when drawer opens
  useEffect(() => {
    const fetchShares = async () => {
      if (!token || !isAnalyzeDrawerOpen) return

      try {
        setLoadingShares(true)
        const sharesData = await api.getShares(token)
        setShares(Array.isArray(sharesData) ? sharesData : [])
        // Auto-select first share if available
        if (Array.isArray(sharesData) && sharesData.length > 0 && !selectedShareId) {
          setSelectedShareId(sharesData[0].id)
        }
      } catch (err) {
        console.error("Error fetching shares:", err)
      } finally {
        setLoadingShares(false)
      }
    }

    fetchShares()
  }, [token, isAnalyzeDrawerOpen])

  // Handle entity search
  const handleSearch = async () => {
    if (!token || !api || !searchQuery.trim()) return

    try {
      setSearching(true)
      const results = await api.searchEntities(token, searchQuery, {
        entityType: selectedEntityType || undefined,
        matchMode: "substring",
        limit: 50,
      })
      setSearchResults(results.results || [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to search entities"
      setError(message)
      console.error("Error searching entities:", err)
    } finally {
      setSearching(false)
    }
  }

  // Handle share reanalysis
  const handleAnalyzeShare = async () => {
    if (!token || !selectedShareId) return

    try {
      setIsAnalyzing(true)
      setAnalyzeResult(null)
      await api.triggerShareReanalysis(token, selectedShareId, forceReanalyze)
      setAnalyzeResult({
        success: true,
        message: t("analyzeShareSuccess", { ns: "entities", defaultValue: "Share analysis started successfully" }),
      })
      // Close drawer after success
      setTimeout(() => {
        setIsAnalyzeDrawerOpen(false)
        setSelectedShareId("")
        setForceReanalyze(false)
        setAnalyzeResult(null)
      }, 2000)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("analyzeShareError", { ns: "entities", defaultValue: "Failed to start share analysis" })
      setAnalyzeResult({
        success: false,
        message,
      })
      console.error("Error analyzing share:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Chart data for entity type distribution
  const chartData = useMemo(() => {
    if (!stats || !stats.entity_types) return []
    return Object.entries(stats.entity_types).map(([type, count]) => ({
      name: type,
      count: count,
    }))
  }, [stats])

  // Display results
  const displayResults = searchQuery.trim() ? searchResults : entities

  if (!token) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>Please log in to access entities discovery.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("entitiesTitle", { defaultValue: "Entities" })}
            </h1>
            <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-400">
              Tech Preview
            </span>
          </div>
          <Button
            onClick={() => setIsAnalyzeDrawerOpen(true)}
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("analyzeButton", { ns: "entities", defaultValue: "Analyze" })}
          </Button>
        </div>
        <p className="text-muted-foreground">
          {t("entitiesDescription", {
            defaultValue: "Discover named entities and relationships in your documents",
          })}
        </p>
        <Alert className="mt-4 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 !text-amber-500" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">Tech Preview</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Named Entity Recognition is an early-access feature. Results may be incomplete or change in future releases.
          </AlertDescription>
        </Alert>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Entities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_entities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Files Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_files_processed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Entity Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entityTypes.length}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Entity Type Distribution Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Entity Type Distribution</CardTitle>
            <CardDescription>
              Number of entities by type across all documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Entities</CardTitle>
          <CardDescription>
            Find specific entities and see which documents mention them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for an entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Searching...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {entityTypes.length > 0 && (
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by entity type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type} ({stats?.entity_types[type] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Entities Table */}
      {displayResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {searchQuery.trim() ? "Search Results" : "Top Entities"}
            </CardTitle>
            <CardDescription>
              Showing {displayResults.length} entities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Entity</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Documents
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Mentions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayResults.map((entity, idx) => (
                    <tr
                      key={`${entity.value}-${entity.entity_type}-${idx}`}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{entity.value}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {entity.entity_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {entity.document_count}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {entity.mention_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {displayResults.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery.trim()
              ? "No entities found matching your search."
              : "No entities have been discovered yet. Entities will appear here once NER processing completes on your shares."}
          </CardContent>
        </Card>
      )}

      {/* Analyze Drawer */}
      <Drawer open={isAnalyzeDrawerOpen} onOpenChange={setIsAnalyzeDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {t("analyzeShareTitle", { ns: "entities", defaultValue: "Analyze Share" })}
            </DrawerTitle>
            <DrawerDescription>
              {t("analyzeShareDescription", { ns: "entities", defaultValue: "Trigger NER analysis for a specific share" })}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 py-6 space-y-6">
            {analyzeResult && (
              <Alert variant={analyzeResult.success ? "default" : "destructive"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {analyzeResult.success
                    ? t("success", { ns: "entities", defaultValue: "Success" })
                    : t("error", { ns: "entities", defaultValue: "Error" })}
                </AlertTitle>
                <AlertDescription>{analyzeResult.message}</AlertDescription>
              </Alert>
            )}

            {loadingShares ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-5 w-5" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="share-select">
                    {t("selectShare", { ns: "entities", defaultValue: "Select Share" })}
                  </Label>
                  <Select value={selectedShareId} onValueChange={setSelectedShareId}>
                    <SelectTrigger id="share-select">
                      <SelectValue placeholder={t("selectSharePlaceholder", { ns: "entities", defaultValue: "Choose a share..." })} />
                    </SelectTrigger>
                    <SelectContent>
                      {shares.map((share) => (
                        <SelectItem key={share.id} value={share.id}>
                          {share.share_path || share.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Switch
                    id="force-reanalyze"
                    checked={forceReanalyze}
                    onCheckedChange={setForceReanalyze}
                  />
                  <div className="flex-1">
                    <Label htmlFor="force-reanalyze" className="text-sm font-medium cursor-pointer">
                      {t("forceReanalyze", { ns: "entities", defaultValue: "Force Reanalysis" })}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("forceReanalyzeDescription", { ns: "entities", defaultValue: "Reanalyze all files, even if they have existing NER results" })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter>
            <Button
              onClick={handleAnalyzeShare}
              disabled={isAnalyzing || !selectedShareId || loadingShares}
            >
              {isAnalyzing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t("analyzing", { ns: "entities", defaultValue: "Analyzing..." })}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("startAnalysis", { ns: "entities", defaultValue: "Start Analysis" })}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAnalyzeDrawerOpen(false)}
              disabled={isAnalyzing}
            >
              {t("cancel", { ns: "entities", defaultValue: "Cancel" })}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
