# Caching Mechanism Analysis

## Executive Summary
The `neo-ui-framework` implements a client-side caching mechanism using an in-memory `DataLoader` service. This service caches API responses based on unique keys derived from the request parameters (token, share ID, page number, etc.). The caching strategy for the data corpus (Files) is primarily **on-demand (lazy loading)** and **page-based**, rather than pre-fetching the entire dataset.

## Detailed Analysis

### 1. Does the interface pre-cache the full pagination list for the data corpus at loading time?
**Answer: No.**

*   **Mechanism**: The application does **not** fetch the list of all files at application startup or when the session is restored.
*   **Evidence**:
    *   The `fetchSystemData` function in `NeoApiService` (used during initialization) explicitly returns `files: null` and does not invoke the file search/list endpoints.
    *   File data is only requested when `handleSelectFilesShare` is triggered, typically via user interaction (selecting a share or the "All shares" view).
    *   Even when triggered, the request is specific to a page (defaulting to page 1) and a page size (default 100). There is no loop or background process to iterate through all pages and cache them.

### 2. Does the interface cache the full pagination list when navigating with or without content?
**Answer: No, it strictly caches individual pages.**

*   **Mechanism**: The interface caches the *results of specific pagination requests*. It does not cache the "full" list of all files unless the user manually navigates to every single page.
*   **Behavior**:
    *   When a user visits Page 1, the response for Page 1 is cached.
    *   When the user navigates to Page 2, a new request is made and cached.
    *   If the user navigates back to Page 1, the cached response is used (provided it hasn't expired or been evicted).
    *   The `DataLoader` key for file lists includes the page number `page` and `pageSize`, ensuring unique cache entries for each slice of data (e.g., `files:token:shareId:1:100`).

### 3. Does the caching for the pagination list include the content?
**Answer: No.**

*   **Mechanism**: The pagination list endpoints (`/files` or `/search/files`) return an array of `FileEntry` objects.
*   **Data Structure**:
    *   The `FileEntry` interface contains metadata such as filename, path, size, file type, and timestamps.
    *   It does **not** contain the actual file content (text or bytes).
*   **Content Retrieval**: File content is only fetched when specifically requested via `getFileMetadata` (which returns `FileMetadataResponse`), and this is a separate cache entry (`fileMetadata:token:shareId:fileId`).

## Technical Details

### DataLoader Service
*   **Implementation**: `src/services/data-loader.ts`
*   **Strategy**: In-memory LRU (Least Recently Used) cache.
*   **TTL (Time To Live)**: Defaults to 30 seconds for general data, but `filesTtl` (configurable, default 10 minutes) is used for file-related requests.
*   **Eviction**: Based on entry size and a maximum cache size limit (default 100MB).

### API Models
*   **File List**: Returns `FilesResponse { files: FileEntry[], ... }`.
    *   `FileEntry` fields: `id`, `file_path`, `filename`, `size`, `created_at`, `modified_time`, `accessed_at`, `is_directory`, `file_type`.
*   **File Content**: Returns `FileMetadataResponse`.
    *   Fields: `content`, `content_chunks`, plus metadata.
