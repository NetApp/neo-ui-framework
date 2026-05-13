# Files.tsx Page vs Files API - Gap Assessment

**Assessment Date:** May 13, 2026  
**Assessed Version:** OpenAPI 4.1.2-aide.1  
**Page Location:** [src/components/pages/files.tsx](src/components/pages/files.tsx)  
**API Service:** [src/services/api/files.ts](src/services/api/files.ts)

---

## Executive Summary

The `files.tsx` page implements basic file listing and search functionality but significantly underutilizes the capabilities provided by the Files API. The main gaps are:

1. **Search Implementation** - Using simple parameter filtering instead of full-text search API
2. **Pagination Strategy** - Missing support for efficient keyset-based pagination for large datasets
3. **Field Selection** - No implementation of selective field retrieval to optimize response sizes
4. **File Access Patterns** - Missing direct file lookup endpoint usage
5. **NER Search** - No integration with Named Entity Recognition search for dataset context
6. **Content Optimization** - Not leveraging `include_counts` parameter to avoid expensive aggregates

---

## Current Implementation Analysis

### Page Features (files.tsx)

| Feature | Implemented | Method | Status |
|---------|---|---|---|
| **Share Selection** | ✓ | Dropdown with single/all/none options | ✓ Working |
| **File Listing** | ✓ | Pagination with page/page_size | ⚠️ Offset-only (no keyset) |
| **Search Files** | ✓ | `onSearchFiles` callback | ⚠️ Not full-text search |
| **File Metadata** | ✓ | Sheet drawer with metadata display | ✓ Working |
| **Dataset Creation** | ✓ | From search results or selected files | ✓ Working |
| **Content Visibility** | ✓ | Toggle for file content display | ✓ Working |
| **Refresh Files** | ✓ | Refresh button to reload current view | ✓ Working |
| **ACL Resolution** | ✓ | Display resolved principals | ✓ Working |

### API Endpoints Available

#### File Listing Endpoints
```
GET /api/v1/shares/{share_id}/files                    # Per-share listing
GET /api/v1/files                                       # Cross-share listing (with filters)
```

#### File Retrieval Endpoints
```
GET /api/v1/shares/{share_id}/files/{file_id}          # Share-scoped file lookup
GET /api/v1/shares/{share_id}/files/metadata            # Legacy metadata endpoint (query params)
GET /api/v1/files/{file_id}                             # Direct file lookup (no share_id)
```

#### Search Endpoint
```
POST /api/v1/search                                     # Full-text search with advanced filtering
```

#### Field Control Parameters
```
?fields=field1,field2,field3                           # Comma-separated field names
?field_set=minimal|standard|metadata|security|full    # Predefined field sets
```

#### Pagination Options
```
?page=1&page_size=100                                  # OFFSET pagination
?after_modified_time=2024-01-01T00:00:00Z              # Keyset pagination (cursor-based)
```

#### Optimization Parameters
```
?include_content=true|false                            # Include/exclude file content
?include_counts=true|false                             # Include total_count/total_size aggregates
```

---

## Gap Analysis: Detailed Breakdown

### 1. CRITICAL: Full-Text Search Not Implemented

**Status:** ❌ **NOT IMPLEMENTED**

**Current Behavior:**
- `FilesApiClient.searchFiles()` uses GET `/api/v1/files?filename=...&file_type=...`
- Simple substring matching for filename, no full-text indexing
- Limited to individual field filtering

**API Capability Available:**
```
POST /api/v1/search
{
  "query": "natural language search",
  "share_ids": ["optional", "filter"],
  "file_types": ["pdf", "docx"],
  "modified_after": "2024-01-01T00:00:00Z",
  "modified_before": "2024-12-31T23:59:59Z",
  "page": 1,
  "page_size": 100,
  "sort_by": "relevance|modified_time|filename|size",
  "sort_order": "asc|desc",
  "search_mode": "natural|boolean"  # MySQL only
}
```

**Impact:**
- Users cannot search across file content (only filenames)
- No relevance scoring in results
- No advanced search operators (boolean search)
- Poor user experience for content discovery

**Recommendation:** 
- Add dedicated "Full-Text Search" option in search dialog
- Implement relevance-based sorting
- Show content snippet previews in results

---

### 2. HIGH: No Keyset Pagination Support

**Status:** ⚠️ **PARTIALLY AVAILABLE, NOT USED**

**Current Behavior:**
- `getFiles()` uses offset pagination: `page=1&page_size=100`
- At deep pages (e.g., page 1000), query becomes very slow
- Backend documentation states keyset is "~300x faster than OFFSET at deep pages"

**API Capability Available:**
```
GET /api/v1/files?after_modified_time=2024-01-15T10:30:00Z&page_size=100
```
Returns rows with `modified_time < 2024-01-15T10:30:00Z`, ordered by modified_time DESC

**Impact:**
- Slow performance for users navigating to later pages (billion-row scale)
- Pagination feels sluggish on large datasets
- Backend warns about performance at deep pages

**Implementation Requirement:**
1. Track `next_cursor` from API response
2. Use cursor as `after_modified_time` parameter instead of page number
3. Update pagination UI to use "Next/Previous" instead of page numbers (or dual mode)

---

### 3. MEDIUM: Field Selection Not Implemented

**Status:** ⚠️ **API SUPPORTS, NOT USED**

**Current Behavior:**
- Always retrieves all available fields for every file
- No field filtering mechanism in UI
- Response size grows linearly with dataset size

**API Capability Available:**

**Option A: Explicit Field Selection**
```
GET /api/v1/shares/{share_id}/files?fields=id,filename,size,modified_time,file_type
```

**Option B: Predefined Field Sets**
```
GET /api/v1/files?field_set=minimal        # id, filename, file_type
GET /api/v1/files?field_set=standard       # + size, modified_time
GET /api/v1/files?field_set=metadata       # + created_at, accessed_at, acl_principals
GET /api/v1/files?field_set=security       # focused on ACL fields
GET /api/v1/files?field_set=full           # all fields
```

**Impact:**
- Unnecessarily large API responses
- Higher bandwidth usage
- Slower serialization/deserialization
- Particularly problematic for billion-row queries

**Recommendation:**
- Default to `field_set=standard` in file listings
- Use `field_set=full` only when opening file metadata sheet
- Implement field selector in table toolbar for power users

---

### 4. HIGH: Direct File Lookup Not Used

**Status:** ⚠️ **API ENDPOINT EXISTS, NOT USED**

**Current Behavior:**
- When opening file metadata, always calls: `GET /api/v1/shares/{shareId}/files/metadata?file_id={fileId}`
- Requires knowing share_id upfront
- Couple's file retrieval to share context

**API Capability Available:**
```
GET /api/v1/files/{file_id}                  # Direct lookup, no share_id needed
?fields=...&field_set=...&include_content=true
```

**Use Case:**
- When file_id is known but share_id is not (e.g., from search results across shares)
- Dataset operations that reference files by ID
- MCP tools that work with file IDs directly

**Current Workaround in Code:**
```typescript
const effectiveShareId = selectedShareId ?? file.share_id
if (!effectiveShareId) toast.error("Share information not available")
```

**Recommendation:**
- Use direct lookup `GET /api/v1/files/{fileId}` as fallback when share_id missing
- Simplifies search result handling for cross-share queries
- Removes dependency on share context

---

### 5. MEDIUM: Content Inclusion Optimization Missing

**Status:** ⚠️ **PARAMETER EXISTS, NOT OPTIMIZED**

**Current Behavior:**
- `getFiles()` always sets: `include_content=false` (good!)
- But always includes all other metadata
- No optimization for billion-row queries

**API Capability Available:**
```
GET /api/v1/files?include_counts=false     # Skip expensive COUNT aggregates
                                            # Useful at billion-row scale
                                            # Backend returns null for total_count/total_size
```

**Backend Documentation:**
> "Include total_count + total_size; set false at billion-row scale to avoid the cross-partition aggregate"

**Impact:**
- At scale, `COUNT(*)` queries become the bottleneck
- UI can still paginate without total counts
- Significant performance improvement for large deployments

**Recommendation:**
- For initial listing, use `include_counts=false`
- Lazy-load total counts on-demand if user requests them
- Document count limitations in UI

---

### 6. MEDIUM: File Type Filtering Not Fully Exposed

**Status:** ⚠️ **API SUPPORTS, LIMITED UI**

**Current Behavior:**
- Search dialog might have file type filter (needs verification)
- Not clear if passed to API correctly

**API Capability Available:**
```
GET /api/v1/files?file_type=pdf,docx,xlsx
```

**Recommendation:**
- Add file type chips/tags to search dialog
- Pass `file_type` parameter to backend
- Show available file type filters from dataset

---

### 7. LOW: Sort/Order Options Not Exposed

**Status:** ⚠️ **API SUPPORTS, NOT IN LISTING**

**Current Behavior:**
- File listings show default sort order
- No sort UI controls visible

**API Capability in Search:**
```
POST /api/v1/search
{
  "sort_by": "relevance|modified_time|filename|size",
  "sort_order": "asc|desc"
}
```

**Current API for Listing:**
- GET `/api/v1/files` doesn't document sort parameters
- Likely sorted by modified_time DESC by default (keyset cursor suggests this)

**Recommendation:**
- Add sort menu to file table header
- Expose `modified_time`, `filename`, `size` sort options
- Integrate with keyset pagination if available

---

## Implementation Priority Matrix

| Gap | Severity | Effort | Impact | Priority |
|-----|----------|--------|--------|----------|
| Full-text search | CRITICAL | Medium | High | **P0** |
| Keyset pagination | HIGH | Medium | High | **P1** |
| Direct file lookup | HIGH | Low | Medium | **P1** |
| Field selection | MEDIUM | Medium | Medium | **P2** |
| Include counts optimization | MEDIUM | Low | Medium | **P2** |
| File type filtering | MEDIUM | Low | Low | **P3** |
| Sort/order controls | LOW | Low | Low | **P3** |

---

## Alignment with OpenAPI Spec

### ✅ Correctly Implemented
- Basic file listing (GET `/api/v1/shares/{share_id}/files`)
- Cross-share listing (GET `/api/v1/files`)
- Metadata retrieval with content inclusion toggle
- Pagination with page/page_size
- Share selection (single/all)

### ⚠️ Partially Implemented
- File search (simple filters only, no full-text)
- Field control (no field_set parameter used)
- Content handling (works, but not optimized)

### ❌ Not Implemented
- Full-text search API (POST `/api/v1/search`)
- Keyset pagination (cursor-based)
- Direct file lookup (GET `/api/v1/files/{file_id}`)
- Search result sorting
- NER search in datasets
- Content optimization flags

---

## Related Endpoints Not Leveraged

These endpoints exist in the API but are not used by files.tsx:

```
POST /api/v1/search                         # Full-text search
GET /api/v1/files/{file_id}                 # Direct file lookup
POST /api/v1/datasets/{id}/search           # Dataset-scoped search
POST /api/v1/datasets/{id}/ner-search       # NER entity search
```

---

## Recommendation Summary

### Short-term Fixes (P0-P1)
1. **Implement full-text search** using POST `/api/v1/search` endpoint
   - Add search mode toggle (filename vs full-text)
   - Display relevance scores
   - Show content snippets
   
2. **Add direct file lookup fallback** when share_id unavailable
   - Use GET `/api/v1/files/{file_id}` for cross-share search results
   
3. **Implement keyset pagination** for better performance
   - Track cursor from responses
   - Use `after_modified_time` parameter

### Medium-term Enhancements (P2)
1. **Field set selection** to optimize response sizes
   - Default to `field_set=standard` in listings
   - Use `field_set=full` for metadata sheets

2. **Content count optimization** for billion-row scale
   - Use `include_counts=false` by default
   - Lazy-load totals on demand

### Long-term Considerations (P3)
1. **Sort/order controls** in file table
2. **File type filtering** in search
3. **NER search integration** for dataset discovery

---

## Related Memory Notes
- `/memories/repo/files-openapi-alignment.md` - Previous alignment assessment
- `/memories/repo/content-visibility-setting.md` - Content visibility feature
- `/memories/repo/i18n-assessment.md` - Internationalization notes
