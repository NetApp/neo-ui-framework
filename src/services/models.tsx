// Copyright 2025 NetApp, Inc. All Rights Reserved.
export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface ConnectionCredentials {
  endpoint?: string
  username: string
  password: string
}

export interface SetupStatusResponse { // only for v3
  setup_complete: boolean
  database_configured: boolean
  database_url_environment_set: boolean
  config_storage: string
  steps_completed: string[]
  required_steps: string[]
  optional_steps: string[]
  message: string
  persistence_info: {
    database_url_set: boolean
    persistent: boolean
    message: string
    license_reconfiguration_mode: boolean
  }
  connector_id: string | null
}

export interface SetupLicenseRequest {
  license_key: string
}

export interface SetupLicenseResponse {
  success: boolean
  message: string
}

export interface SetupGraphRequest {
  tenant_id: string
  client_id: string
  client_secret: string
  connector_id: string
  connector_name: string
  connector_description: string
}

export interface SetupGraphConfigResponse {
  graph_configured: boolean
  tenant_id: string
  client_id: string
  client_secret_set: boolean
  connector_id: string
  connector_name: string
  connector_description: string
  message: string
}

export interface SetupProxyRequest {
  proxy_url: string
  proxy_username?: string
  proxy_password?: string
}

export interface SetupProxyResponse {
  success: boolean
  message: string
}

export interface SetupProxyConfigResponse {
  proxy_configured: boolean
  proxy_url: string | null
  proxy_username: string | null
  proxy_password_set: boolean
  message: string
}

export interface SetupSslConfigResponse {
  verify_ssl: boolean
  timeout: number
  custom_ca_certificate_configured: boolean
  allow_legacy_certificates: boolean
  message: string
}

export interface SetupGraphResponse {
  success: boolean
  message: string
}

export interface SetupResetResponse {
  success: boolean
  message: string
}

export interface SetupFactoryResetRequest {
  confirm: boolean
  preserve_encryption_key: boolean
}

export interface SetupCompleteResponse {
  success: boolean
  message: string
  configured_steps: string[]
  restart_countdown_seconds: number
  database_url_configured: boolean
  note?: string
}

export interface InitialCredentialsResponse {
  username: string
  password: string
  message: string
}

export interface MonitoringData {
  // Add properties here if needed, or leave it effectively empty for now
  [key: string]: unknown
}

export interface ReadyResponse { // only for v3
  ready: boolean
  checks: {
    database: boolean
    graph_connector?: boolean
    crawler: boolean
    task_manager: boolean
  }
  timestamp: string
}

// Dashboard Page Models 
export interface HealthResponse {
  status: string
  service?: string
  version?: string
  timestamp?: string
  worker_url?: string
  components?: Record<string, string>
}

export interface LicenseResponse {
  message: string
  details: {
    connection_id: string
    days_remaining: number
  } | null
}

export interface VersionResponse {
  version: string
  build_date?: string
  name?: string
}

export interface HelmChartVersionResponse {
  chart_name: string
  chart_version: string
  app_version: string
}

export interface DatabaseSizeResponse { // only for v3
  database_file_path: string
  database_file_size_bytes: number
  database_file_size_mb: number
  database_size_info: string
  table_statistics: {
    shares: {
      row_count: number
    }
    file_metadata: {
      row_count: number
      total_file_size_bytes: number
      total_content_size_bytes: number
    }
    operations_log: {
      row_count: number
      total_content_size_bytes: number
      total_content_size_mb: number
      field_breakdown: {
        operation_type_size_bytes: number
        status_size_bytes: number
        details_size_bytes: number
        metadata_size_bytes: number
        username_size_bytes: number
      }
    }
    users: {
      row_count: number
    }
  }
  total_files_tracked: number
  total_file_content_size_bytes: number
  total_file_content_size_mb: number
  total_original_file_size_bytes: number
  total_original_file_size_mb: number
  timestamp: string
}

// Shares Page Models
export interface SharesResponse {
  id: string
  share_path: string
  username: string
  status: string
  last_crawled: string
  last_crawl_file_count: number
  protocol?: "smb" | "nfs" | "s3"
}

export interface ShareDetailsResponse {
  id: string
  share_path: string
  username: string
  created_at: string
  last_crawled: string
  last_crawl_duration_ms: number
  last_crawl_file_count: number
  crawl_schedule: string
  rules: Record<string, unknown>
  status: string
  error_message: string
  last_connection_attempt: string
  realm: string
  use_kerberos: string
  workgroup: string
  resolve_order: string
  // S3 fields
  s3_bucket?: string
  s3_endpoint_url?: string
  s3_region?: string
  s3_use_ssl?: boolean
  // NFS fields
  nfs_version?: string
  nfs_security?: string
  nfs_mount_options?: string
}

export interface NFSShareCreateRequest {
  protocol: 'nfs'
  share_path: string
  nfs_version?: string
  nfs_security?: string
  nfs_mount_options?: string
  username?: string
  password?: string
  crawl_schedule?: string
  rules?: Record<string, unknown>
}

// Files Page Models
export interface FilesResponse {
  share_id: string
  path: string
  files: FileEntry[]
  total_count: number | null
  total_size: number | null
  page: number
  page_size: number
  total_pages: number | null
  has_next: boolean
  has_previous: boolean
}

export interface FileSearchParams {
  path?: string
  filename?: string
  file_type?: string
  accessed_at_after?: string
  accessed_at_before?: string
  modified_time_after?: string
  modified_time_before?: string
  created_at_after?: string
  created_at_before?: string
  size_min?: number
  size_max?: number
  sort_by?: "modified_time" | "created_at" | "accessed_at" | "filename" | "size" | "share_name"
  sort_order?: "asc" | "desc"
  page?: number
  page_size?: number
  query?: string
  share_id?: string
}

export interface FileEntry {
  id: string
  file_path: string
  unc_path: string
  filename: string
  size: number
  created_at: string
  modified_time: string
  accessed_at: string
  is_directory: boolean
  file_type: string
  indexed_at: string
  share_id?: string
  share_name?: string
  share_path?: string
}

export interface FileSearchResponse {
  files: FileEntry[]
  total_count: number | null
  total_size: number | null
  page: number
  page_size: number
  total_pages: number | null
  has_next: boolean
  has_previous: boolean
}

export interface FileMetadataResponse {
  id: string
  file_path: string
  unc_path: string
  filename: string
  size: number
  created_at: string
  modified_time: string
  accessed_at: string
  is_directory: boolean
  file_type: string
  content: string
  content_chunks: string[]
  conversion_duration_ms: number
  extractor_used: string
  indexed_at: string
  acl_principals: string[]
  resolved_principals: Record<string, unknown>[]
}

// Operations Page Models
export interface OperationResponse {
  id: number
  operation_type: string
  status: string
  details: string
  timestamp: string
  // user_id not included to avoid looking up user info separately
  username: string
}


// Monitoring Page Models
export interface MonitoringOverviewResponse { // only for v3
  work_queue: {
    total_items?: number
    pending_items?: number
    claimed_items?: number
    processing_items?: number
    failed_items?: number
    abandoned_items?: number
    total_pending?: number
    total_claimed?: number
    total_processing?: number
    total_completed?: number
    total_failed?: number
    total_abandoned?: number
    average_processing_time_ms?: number | null
    oldest_pending_age_seconds?: number | null
  }
  ennumeration: {
    active_enumerations: Array<{
      additionalProp1: Record<string, unknown>
    }>
    enumeration_queue_depth: {
      additionalProp1: number
      additionalProp2: number
      additionalProp3: number
    }
    completed_enumerations_last_24h: number
    avg_enumeration_duration_seconds: number
  }
  workers: {
    total_workers: number
    active_workers: number
    stopping_workers: number
    stopped_workers: number
    workers: {
      additionalProp1: Record<string, unknown>
    }
  }
  graph_rate_limit: {
    requests_made: number
    requests_remaining: number
    reset_time: string
    rate_limited: boolean
    backoff_until: string
  }
  timestamp: string
}

export interface MonitoringWorkerResponse { // only for v3
  total_items: number
  pending_items: number
  claimed_items: number
  processing_items: number
  completed_items: number
  failed_items: number
  abandoned_items: number
}

export interface MonitoringEnumerationResponse {  // only for v3
  active_enumerations: Array<{
    additionalProp1: Record<string, unknown>
  }>
  enumeration_queue_depth: {
    additionalProp1: number
    additionalProp2: number
    additionalProp3: number
  }
  completed_enumerations_last_24h: number
  avg_enumeration_duration_seconds: number
}

export interface MonitoringWorkersResponse { // only for v3
  total_workers: number
  active_workers: number
  stale_workers?: number
  stopping_workers?: number
  stopped_workers?: number
  workers: Array<{
    instance_id?: string
    hostname?: string
    last_heartbeat?: string
    status?: string
  }>
}

export interface MonitoringGraphRateLimitResponse { // only for v3
  requests_made: number
  requests_remaining: number
  reset_time: string
  rate_limited: boolean
  backoff_until: string
}

export interface MonitoringFailedItemsResponse { // only for v3
  total_failed_items: number
  failed_items: {
    id: string
    share_id: string
    file_inventory_id: string
    work_type: string
    priority: number
    retry_count: number
    max_retries: number
    error_message: string
    created_at: string
    started_at: string
    completed_at: string
    claimed_by: string
    file_path: string
    filename: string
  }[]
  failure_summary: {
    additionalProp1: number
    additionalProp2: number
    additionalProp3: number
  }
  retry_summary: {
    additionalProp1: number
    additionalProp2: number
    additionalProp3: number
  }
}

export interface TasksResponse { // only for v3
  id: string
  name: string
  status: string
  created_at: string
  started_at: string | null
  completed_at: string | null
  error: string | null
  result: {
    status?: string
    share_id?: string
    retry_result?: string | null
    total_shares?: number
    scheduled_count?: number
    reset_count?: number
    connector_id?: string
    [key: string]: unknown
  } | null
  progress: string | null
  share_id?: string | null
  metadata: Record<string, unknown>
  cancellation_requested: boolean
}

export interface TasksListResponse { // only for v3
  tasks: TasksResponse[]
  count: number
  filter: {
    status: string | null
    limit: number
  }
}

export interface TaskStatisticsResponse { // only for v3
  total_tasks: number
  by_status: {
    pending: number
    running: number
    completed: number
    failed: number
    cancelled: number
  }
  running_task_ids: number[]
}

export interface AclCacheStatisticsResponse {
  size: number
  max_size: number
  hits: number
  misses: number
  evictions: number
  hit_rate: number
  total_requests: number
  capacity_used_percent: number
  status: "cold" | "warm" | "hot"
  recommendations: string[]
}

// Users Page Models
export interface UserResponse {
  id: number
  username: string
  email: string | null
  is_active: boolean
  is_admin: boolean
  created_at: string
  last_login: string | null
  entra_object_id?: string | null
  entra_display_name?: string | null
}

// Content Search Models
export interface ContentSearchRequest {
  query: string
  share_ids?: string[]
  file_types?: string[]
  modified_after?: string
  modified_before?: string
  sort_by?: "relevance" | "modified_time" | "filename" | "size"
  page?: number
  page_size?: number
}

export interface ContentSearchResult {
  id: string
  share_id: string
  filename: string
  file_path: string
  unc_path: string
  size: number
  modified_time: string
  file_type: string
  indexed_at: string
  relevance_score: number
  snippet?: string
  created_at?: string
  accessed_at?: string
}

export interface ContentSearchResponse {
  results: ContentSearchResult[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
  query: string
  search_time_ms: number
  database_type?: string
}

export interface CreateDatasetRequest {
  name: string
  description?: string
  file_ids: string[]
  is_public?: boolean
  acl_override_enabled?: boolean
}

export interface DatasetResponse {
  id: string
  name: string
  description?: string
  file_ids: string[]
  is_public: boolean
  acl_override_enabled: boolean
  created_at: string
}

export interface DatasetItem {
  id: string
  file_id: string
  filename: string
  file_path: string
  unc_path: string
  share_id: string
  share_name: string
  size: number
  modified_time: string
  file_type: string
  added_at: string
  added_by_username: string | null
  position: number | null
  notes: string | null
}

export interface DatasetItemsResponse {
  items: DatasetItem[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface DatasetListItem {
  id: string
  name: string
  description?: string
  owner_id: number
  owner_username: string
  is_public: boolean
  acl_override_enabled: boolean
  item_count: number
  created_at: string
  updated_at: string
  expires_at: string
  expires_in_hours: number
  source_query: Record<string, unknown>
  user_permission: string
  metadata: Record<string, unknown>
}

export interface DatasetListResponse {
  datasets: DatasetListItem[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface Dataset {
  id: string
  name: string
  description?: string
  owner_id?: number
  owner_username?: string
  is_public: boolean
  acl_override_enabled: boolean
  item_count?: number
  files: FileEntry[]
  createdAt: string
  updatedAt?: string
  expiresAt?: string
  expiresInHours?: number
  userPermission?: string
}

export interface MeResponse {
  id: number
  username: string
  email: string | null
  is_active: boolean
  is_admin: boolean
  created_at: string
  last_login: string | null
  entra_object_id?: string | null
  entra_display_name?: string | null
}

export interface Body_configure_oauth_api_v1_setup_oauth_post {
  tenant_id?: string
  client_id?: string
  client_secret?: string
  audience?: string
  enabled?: boolean
}

export interface EntraLinkRequest {
  user_id: number
}

export interface EntraLinkResponse {
  success: boolean
  message: string
  user_id: number
  username: string
  entra_object_id: string
  entra_display_name?: string
}

export interface EntraUnlinkRequest {
  user_id: number
}

export interface EntraUnlinkResponse {
  success: boolean
  message: string
  user_id: number
}

export interface GroupsResponse {
  object_id: string
  groups: string[]
  groups_count: number
}

export interface OAuthConfigResponse {
  enabled: boolean
  provider?: string
  tenant_id?: string
  client_id?: string
  audience?: string
  authorization_endpoint?: string
  token_endpoint?: string
}

export interface SetupOAuthResponse {
  success: boolean
  message: string
}

export interface UserInfoResponse {
  object_id: string
  tenant_id: string
  display_name?: string
  email?: string
  upn?: string
  groups_count?: number
}

export interface McpInfoResponse {
  name: string
  version: string
  protocol_version: string
  transport: string
  oauth_enabled: boolean
  tools: string[]
  endpoints: {
    mcp: string
    oauth_metadata: string
  }
}
