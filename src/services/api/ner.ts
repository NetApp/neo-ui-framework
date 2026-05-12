import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "@/services/api/base"

export interface NEREntity {
  text: string
  type: string
  confidence?: number
}

export interface NERResultResponse {
  id: string
  file_id: string
  share_id: string
  filename?: string
  file_path?: string
  entities?: Record<string, string[]>
  classifications?: Record<string, unknown>
  structured_data?: Record<string, unknown>
  schema_name: string
  schema_version: string
  confidence_threshold: number
  processing_time_ms?: number
  analyzed_at: string
}

export interface NERStatsResponse {
  total_entities: number
  total_files_processed: number
  entity_types: Record<string, number>
  processing_enabled: boolean
  total_files_analyzed?: number
  files_pending_analysis?: number
  files_failed_analysis?: number
  avg_processing_time_ms?: number
  entity_counts?: Record<string, number>
  classification_distribution?: Record<string, Record<string, number>>
  last_analysis_at?: string
}

export interface NERSchemaConfig {
  name: string
  version: string
  description?: string
  entity_types?: string[]
  entity_descriptions?: Record<string, string>
  classifications?: Record<string, unknown>
  structured_extraction?: Record<string, string[]>
  confidence_threshold: number
  created_at: string
  updated_at: string
}

export interface NERSettings {
  enabled?: boolean
  model?: string | null
  batch_size?: number
  confidence_threshold?: number
  device?: string | null
}

export interface EntityAggregateItem {
  value: string
  entity_type: string
  document_count: number
  mention_count: number
}

export interface EntitySearchResult {
  results: EntityAggregateItem[]
  count: number
  next_cursor?: string
  match_mode: string
  query: string
  entity_type?: string
}

export class NERApiClient extends BaseApiClient {
  async getFileNERResults(token: string, fileId: string): Promise<NERResultResponse> {
    try {
      return await this.requestWithToken<NERResultResponse>(
        this.buildApiV1Path(`/ner/files/${fileId}`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.getFileNERResults", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getShareNERResults(
    token: string,
    shareId: string,
    page: number = 1,
    pageSize: number = 100,
    entityType?: string
  ): Promise<{
    results: NERResultResponse[]
    total_count: number
    page: number
    page_size: number
  }> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      })

      if (entityType) {
        params.append("entity_type", entityType)
      }

      return await this.requestWithToken<{
        results: NERResultResponse[]
        total_count: number
        page: number
        page_size: number
      }>(
        this.buildApiV1Path(`/ner/shares/${shareId}/results?${params}`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.getShareNERResults", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getNERStats(token: string): Promise<NERStatsResponse> {
    try {
      return await this.requestWithToken<NERStatsResponse>(
        this.buildApiV1Path(`/ner/stats`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.getNERStats", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getShareNERStats(token: string, shareId: string): Promise<NERStatsResponse> {
    try {
      return await this.requestWithToken<NERStatsResponse>(
        this.buildApiV1Path(`/ner/shares/${shareId}/stats`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.getShareNERStats", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getNERStatus(token: string): Promise<Record<string, unknown>> {
    try {
      return await this.requestWithToken<Record<string, unknown>>(
        this.buildApiV1Path(`/ner/status`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.getNERStatus", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getNERSchemas(token: string): Promise<{ schemas: NERSchemaConfig[] }> {
    try {
      return await this.requestWithToken<{ schemas: NERSchemaConfig[] }>(
        this.buildApiV1Path(`/ner/schemas`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.getNERSchemas", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async searchEntities(
    token: string,
    query: string,
    options?: {
      entityType?: string
      shareId?: string
      shareIds?: string
      matchMode?: "substring" | "exact" | "prefix"
      limit?: number
      cursor?: string
    }
  ): Promise<EntitySearchResult> {
    try {
      const params = new URLSearchParams({
        q: query,
      })

      if (options?.entityType) {
        params.append("entity_type", options.entityType)
      }
      if (options?.shareId) {
        params.append("share_id", options.shareId)
      }
      if (options?.shareIds) {
        params.append("share_ids", options.shareIds)
      }
      if (options?.matchMode) {
        params.append("match_mode", options.matchMode)
      }
      if (options?.limit) {
        params.append("limit", String(options.limit))
      }
      if (options?.cursor) {
        params.append("cursor", options.cursor)
      }

      return await this.requestWithToken<EntitySearchResult>(
        this.buildApiV1Path(`/ner/entities/search?${params}`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.searchEntities", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getEntityAggregates(
    token: string,
    options?: {
      entityType?: string
      shareId?: string
      shareIds?: string
      limit?: number
    }
  ): Promise<{ results: EntityAggregateItem[] }> {
    try {
      const params = new URLSearchParams()

      if (options?.entityType) {
        params.append("entity_type", options.entityType)
      }
      if (options?.shareId) {
        params.append("share_id", options.shareId)
      }
      if (options?.shareIds) {
        params.append("share_ids", options.shareIds)
      }
      if (options?.limit) {
        params.append("limit", String(options.limit))
      }

      return await this.requestWithToken<{ results: EntityAggregateItem[] }>(
        this.buildApiV1Path(`/ner/entities/aggregate?${params}`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.getEntityAggregates", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async countEntityMentions(
    token: string,
    query: string,
    options?: {
      entityType?: string
      shareId?: string
      shareIds?: string
      matchMode?: "exact" | "prefix" | "substring"
    }
  ): Promise<{ approximate_document_count: number }> {
    try {
      const params = new URLSearchParams({
        q: query,
      })

      if (options?.entityType) {
        params.append("entity_type", options.entityType)
      }
      if (options?.shareId) {
        params.append("share_id", options.shareId)
      }
      if (options?.shareIds) {
        params.append("share_ids", options.shareIds)
      }
      if (options?.matchMode) {
        params.append("match_mode", options.matchMode)
      }

      return await this.requestWithToken<{ approximate_document_count: number }>(
        this.buildApiV1Path(`/ner/entities/count?${params}`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.countEntityMentions", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getPendingNER(
    token: string,
    options?: {
      shareId?: string
      limit?: number
    }
  ): Promise<{ pending_files: string[] }> {
    try {
      const params = new URLSearchParams()

      if (options?.shareId) {
        params.append("share_id", options.shareId)
      }
      if (options?.limit) {
        params.append("limit", String(options.limit))
      }

      return await this.requestWithToken<{ pending_files: string[] }>(
        this.buildApiV1Path(`/ner/pending?${params}`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.getPendingNER", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async triggerShareReanalysis(
    token: string,
    shareId: string,
    force: boolean = false
  ): Promise<void> {
    try {
      const params = new URLSearchParams()
      if (force) {
        params.append("force", "true")
      }

      await this.requestWithToken<void>(
        this.buildApiV1Path(`/ner/shares/${shareId}/reanalyze?${params}`),
        token,
        {
          method: "POST",
        }
      )
    } catch (error) {
      appLogger.error("NERApiClient.triggerShareReanalysis", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getNERSettings(token: string): Promise<NERSettings> {
    try {
      return await this.requestWithToken<NERSettings>(
        this.buildApiV1Path(`/ner/settings`),
        token
      )
    } catch (error) {
      appLogger.error("NERApiClient.getNERSettings", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async updateNERSettings(token: string, settings: NERSettings): Promise<NERSettings> {
    try {
      return await this.requestWithToken<NERSettings>(
        this.buildApiV1Path(`/ner/settings`),
        token,
        {
          method: "PUT",
          body: JSON.stringify(settings),
        }
      )
    } catch (error) {
      appLogger.error("NERApiClient.updateNERSettings", error instanceof Error ? error.message : String(error))
      throw error
    }
  }
}
