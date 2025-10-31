export interface HealthResponse {
  status: string
  version: string
  timestamp: string
  components: {
    database: { status: string; error: string | null }
    filesystem: { status: string; error: string | null }
    shares: { active_count: number; errors: string[] }
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
  latest?: string
}

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

export interface OperationResponse {
  id: number
  operation_type: string
  status: string
  details: string
  timestamp: string
  username: string
}

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
}

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

export interface TokenResponse {
  access_token: string
  token_type: string
}