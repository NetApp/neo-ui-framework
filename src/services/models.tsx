export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface ConnectionCredentials {
  endpoint?: string
  username: string
  password: string
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
  version: string
  timestamp: string
  components: {
    database: { 
      status: string; 
      error: string | null 
    }
    filesystem: { 
      status: string; 
      error: string | null 
    }
    graph_connector?: { // only for v3
      status: string
      error: string | null
    }
    shares: { 
      active_count: number
      errors: string[] 
    }
  }
  metrics: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
  }
}

export interface LicenseResponse {
  message: string
  details: {
    connection_id: string
    days_remaining: number
  }
}

export interface VersionResponse {
  version: string
  build_date?: string
  name?: string
  latest?: string
}

export interface DatabaseSizeResponse { // only for v3
  database_file_path: string
  database_file_size_bytes: number
  database_file_size_mb: number
  database_size_info: string
  table_statistics: {
    shares: {
      rows_count: number
    }
    file_metadata: {
      rows_count: number
      total_file_size_bytes: number
      total_content_size_bytes: number
    }
    operations_log: {
      rows_count: number
      total_content_size_bytes: number
      total_content_sizemb: number
      field_breakdown: {
        operation_type_size_bytes: number
        status_size_bytes: number
        details_size_bytes: number
        metadata_size_bytes: number
        username_size_bytes: number
      }
    }
    users: {
      rows_count: number
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
}

// Files Page Models
export interface FilesResponse {
  share_id: string
  path: string
  files: FileEntry[]
  total_count: number
  total_size: number
  page: number
  page_size: number
  total_pages: number
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
  total_count: number
  total_size: number
  page: number
  page_size: number
  total_pages: number
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

// User Page models
export interface UserResponse {
  id: number
  username: string
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  last_login: string
}

export interface MeResponse {
  id: number
  username: string
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  last_login: string
}