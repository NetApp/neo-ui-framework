# Entra ID UI Login via MCP OAuth - Analysis & Implementation Plan

## Executive Summary

**Feasibility: YES - HIGHLY DOABLE** ✅

The NetApp API already has comprehensive OAuth 2.0 infrastructure and Entra ID integration for MCP clients. This can be extended to support Entra ID authentication for UI users with minimal changes.

---

## Current OAuth/Entra ID Capabilities in API

### 1. **MCP OAuth Setup Endpoints**

#### `/api/v1/setup/mcp` - Configure MCP OAuth (POST/GET)
- **Purpose**: Configure OAuth 2.0 credentials for MCP client authentication
- **Requires**: 
  - `tenant_id`: Azure AD Tenant ID
  - `client_id`: Application (client) ID
  - `client_secret`: Client secret value
  - `audience`: Token audience (optional, defaults to client_id)
- **Status**: Configurable via API

#### `/api/v1/setup/mcp/api-key` - MCP API Key (POST/GET/DELETE)
- **Purpose**: Allows API key based authentication as alternative to OAuth
- **Returns**: Generated secure key (shown only once)
- **Use Case**: For non-interactive OAuth flows

### 2. **OAuth 2.0 Authorization Flow Endpoints**

The API implements a **full OAuth 2.0 Authorization Code flow**:

| Endpoint | Purpose | Current Use |
|----------|---------|-------------|
| `/.well-known/oauth-authorization-server` | OAuth metadata (RFC8414) | MCP clients |
| `/.well-known/openid-configuration` | OpenID Connect discovery | MCP clients |
| `/.well-known/jwks.json` | JWT public key set | Token validation |
| `/authorize` | OAuth authorization endpoint | Redirect to Entra ID |
| `/token` | Token exchange endpoint | Get JWT tokens |
| `/oauth/callback` | Callback from Entra ID | Handle auth code |
| `/userinfo` | OpenID UserInfo endpoint | Get user claims |
| `/register` | Dynamic client registration | RFC 7591 support |

### 3. **Standard OAuth Endpoints**

#### `/token` (POST)
- **Supports**:
  - OAuth 2.0 Authorization Code flow (exchanges code for tokens)
  - Password grant (local user authentication)
  - PKCE (Proof Key for Code Exchange) for enhanced security
- **Returns**: JWT access token + token type

#### `/authorize` (GET)
- **Parameters**:
  - `response_type`: code
  - `client_id`: Your app registration
  - `redirect_uri`: Where to send auth code
  - `scope`: openid profile email (OpenID Connect)
  - `state`: CSRF protection
  - `code_challenge`/`code_challenge_method`: PKCE
  - `nonce`: Replay protection
  - `prompt`: UI hint (login, consent, etc.)
- **Behavior**: Redirects to Microsoft Entra ID for user authentication

#### `/oauth/callback` (GET)
- **Receives**: Authorization code from Entra ID
- **Returns**: Forwards code to client UI
- **Handles**: Error responses from Entra ID

### 4. **Protected Resource Metadata Endpoints** (RFC 9728)

- `/.well-known/oauth-protected-resource/mcp`
- `/.well-known/oauth-protected-resource`
- `/mcp/.well-known/oauth-protected-resource`

These provide OAuth Protected Resource metadata needed for client authorization.

### 5. **Current Authentication Methods**

The API supports:
1. **OAuth2 Password Bearer** (local users via `/token` POST)
2. **JWT Bearer Token** (in Authorization header)
3. **OAuth 2.0 Code Flow** (redirect-based for MCP/UI)
4. **API Keys** (for MCP non-interactive auth)

---

## Current UI Login System

### Current Implementation
- **File**: [src/components/pages/login-page.tsx](src/components/pages/login-page.tsx)
- **Method**: Likely local username/password or basic auth
- **Token Storage**: JWT in localStorage/sessionStorage

### What Needs Changing

1. **Login Form**: Add "Login with Entra ID" button
2. **OAuth Flow**: Implement Authorization Code flow client-side
3. **Token Exchange**: Use `/token` endpoint to exchange code for JWT
4. **User Sync**: Link Entra ID user to local user (or create on first login)

---

## Implementation Plan

### Phase 1: Infrastructure Validation ✅
- [x] Confirm MCP OAuth setup is available in API
- [x] Verify OAuth endpoints are implemented
- [x] Check JWT token format and claims

### Phase 2: Frontend Implementation (2-3 days)
**Files to Create/Modify:**

1. **Create**: `src/services/entra-id-auth.ts`
   - OAuth flow orchestration
   - PKCE implementation
   - Token management
   - Silent token refresh

2. **Modify**: `src/components/pages/login-page.tsx`
   - Add "Sign in with Entra ID" button
   - Show local vs SSO options
   - Handle OAuth redirect callback

3. **Create**: `src/hooks/useEntraAuth.ts`
   - OAuth state management
   - Token refresh logic
   - User session management

4. **Modify**: `src/services/neo-api.tsx`
   - Add Entra ID user info fetch
   - Handle token refresh in API calls
   - Add authorization header middleware

5. **Create**: `src/types/auth.ts`
   - OAuth token response types
   - User claim types
   - Entra ID user object types

### Phase 3: Backend Configuration (1 day)
**Setup Steps:**

1. Configure MCP OAuth via API:
   ```bash
   POST /api/v1/setup/mcp
   {
     "tenant_id": "your-tenant-id",
     "client_id": "your-ui-app-client-id",
     "client_secret": "your-ui-app-client-secret",
     "audience": "api://your-ui-app-client-id"
   }
   ```

2. Azure App Registration Requirements:
   - Redirect URIs: 
     - `http://localhost:5173/auth-callback` (dev)
     - `https://your-domain.com/auth-callback` (prod)
   - API Permissions: User.Read, OpenID, Profile, Email
   - Implicit grant: Enable ID tokens for SPA

3. Create or link Entra ID users to local users:
   - Option A: Auto-create on first Entra ID login
   - Option B: Require admin linking of Entra ID → local user
   - Option C: Hybrid - auto-create if allowed by policy

### Phase 4: Testing & Documentation (2-3 days)
**Test Scenarios:**

1. Entra ID login creates user automatically
2. Entra ID user can access all shares
3. Token refresh works seamlessly
4. Logout clears session properly
5. PKCE prevents token interception
6. Multiple browser tabs stay in sync

**Documentation:**
- Entra ID setup guide for admins
- User login instructions
- Troubleshooting guide

---

## Technical Architecture

### OAuth 2.0 Authorization Code Flow (with PKCE)

```
┌─────────┐                                    ┌────────────┐
│   UI    │                                    │  Entra ID  │
│(Browser)│                                    │   (Azure)  │
└────┬────┘                                    └─────┬──────┘
     │                                               │
     │ 1. User clicks "Sign in with Entra"         │
     │ (Generate code_challenge, state, nonce)     │
     │ 2. Redirect to /authorize + code_challenge │
     ├──────────────────────────────────────────────>
     │                                               │
     │                                  3. User logs in
     │                                               │
     │ 4. Redirect back to /oauth/callback?code=..&state=..
     │<──────────────────────────────────────────────┤
     │                                               │
     │ 5. UI exchanges code + code_verifier         │
     │    at /token endpoint                         │
     ├─────────────────────────────┐               │
     │                             │               │
     │                    6. Calls /token           │
     │                       (code, code_verifier)  │
     │                             │               │
     │ 7. Get JWT access_token ←───┘               │
     │                                               │
     │ 8. Store token, call /api/v1/users/me       │
     │    to get user profile                       │
     │                                               │
```

### Token Storage & Refresh Strategy

```typescript
// Token stored in sessionStorage (cleared on browser close)
{
  access_token: "eyJ0eXAiOiJKV1QiLCJhbGc...",
  token_type: "bearer",
  expires_in: 3600,
  scope: "openid profile email",
  id_token: "eyJ0eXAiOiJKV1QiLCJhbGc..." // Contains user claims
}

// Refresh logic:
- On app load: Check token expiry
- If < 5 min to expiry: Start refresh flow
- During API calls: If 401 received, refresh token
- On logout: Clear token and redirect to /logout
```

---

## Data Model Changes

### New Fields in `UserResponse` (Already Supported)

```typescript
{
  id: integer,
  username: string,
  email: string,
  is_active: boolean,
  is_admin: boolean,
  created_at: datetime,
  last_login: datetime,
  
  // NEW/EXISTING Entra ID fields:
  entra_object_id: string | null,      // User's Entra ID object ID
  entra_tenant_id: string | null,      // Tenant where user exists
  entra_display_name: string | null,   // User's display name from Entra
  entra_linked_at: datetime | null     // When Entra ID was linked
}
```

**Good News**: The API already has these fields! (See `UserResponse` in openapi.json)

### User Creation on First Entra Login

```sql
INSERT INTO users (
  username, 
  email, 
  entra_object_id, 
  entra_tenant_id, 
  entra_display_name,
  entra_linked_at,
  is_active,
  created_at
) VALUES (
  ${entraDisplayName},
  ${entraEmail},
  ${objectId},
  ${tenantId},
  ${entraDisplayName},
  NOW(),
  true,
  NOW()
)
```

---

## Security Considerations

### 1. **PKCE (Proof Key for Code Exchange)**
- **Why**: Prevents authorization code interception in SPA
- **Implementation**: Already supported by endpoints
- **Required**: For public clients (SPAs) per OAuth 2.0 best practices

### 2. **State Parameter**
- **Why**: Prevents CSRF attacks
- **Implementation**: Generate random string, validate on callback
- **Storage**: sessionStorage (scoped to single tab)

### 3. **Nonce Parameter**
- **Why**: Prevents ID token replay attacks
- **Implementation**: Included in /authorize request, validated in JWT
- **Format**: Random string, included in JWT claims

### 4. **Token Storage**
- **Current**: sessionStorage (cleared on browser close)
- **Recommendation**: Keep in sessionStorage (more secure than localStorage)
- **Refresh**: Use refresh token if API supports it (check /token response)

### 5. **Token Validation**
- **Where**: On UI load and before API calls
- **What to check**:
  - Signature via `/well-known/jwks.json`
  - Expiry time (exp claim)
  - Issuer matches Entra ID
  - Audience matches your app

### 6. **ACL Implications**
- **Current**: Files accessed via `/api/v1/shares/{share_id}/files`
- **With Entra ID**: Need to map Entra ID object ID to file ACLs
- **Backend**: May need enhancement if currently using local usernames

---

## Alternative Approaches Considered

### Option A: Use OAuth via UI (RECOMMENDED)
- ✅ User-friendly
- ✅ Uses existing OAuth infrastructure
- ✅ Leverages PKCE for security
- ✅ Integrates with Entra ID seamlessly
- ⚠️ Requires frontend OAuth library

### Option B: Backend-Mediated OAuth
- ✅ Simpler frontend
- ⚠️ Backend becomes security bottleneck
- ⚠️ Session-based auth (less RESTful)
- ⚠️ More complex token refresh

### Option C: SAML 2.0 Integration
- ✅ Enterprise-standard
- ⚠️ Not currently implemented
- ⚠️ Requires new backend support
- ⚠️ More complex setup

**Recommendation**: Go with **Option A** - it's already partially implemented and most secure.

---

## Required Azure App Registration Setup

### Prerequisites
- Azure AD admin access
- Tenant ID known
- Domain/URL where UI will be hosted

### Steps

1. **Create App Registration** in Azure Portal
   - Name: "NetApp NEO UI"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: "Web" → `https://your-domain.com/auth-callback`

2. **Configure API Permissions**
   - Add: "Microsoft Graph" → "Delegated"
   - Permissions: `User.Read`, `openid`, `profile`, `email`

3. **Generate Client Secret**
   - Create new secret (copy immediately!)
   - Store securely (e.g., env var)

4. **Configure Token Settings**
   - ID tokens: Check "enable"
   - Access tokens: Check "enable"

5. **CORS / API Exposure** (if using direct OAuth flow)
   - Add scope: `api://<client-id>/access_as_user`

### Environment Variables

```bash
VITE_ENTRA_TENANT_ID=your-tenant-id
VITE_ENTRA_CLIENT_ID=your-ui-app-client-id
VITE_ENTRA_API_URL=https://your-api-domain/api
VITE_ENTRA_REDIRECT_URI=https://your-domain.com/auth-callback
```

---

## Implementation Roadmap

### Week 1: Setup & Planning
- [ ] Get Azure AD tenant/app registration details
- [ ] Verify API OAuth endpoints working
- [ ] Set up environment variables
- [ ] Create implementation branch

### Week 2: Frontend Development
- [ ] Build OAuth client library (`entra-id-auth.ts`)
- [ ] Create login UI with Entra button
- [ ] Implement authorization code flow
- [ ] Add token refresh logic
- [ ] Build auth callback handler

### Week 3: Integration & Testing
- [ ] Integrate with existing user service
- [ ] Test end-to-end OAuth flow
- [ ] Test token refresh
- [ ] Test error scenarios
- [ ] Performance testing

### Week 4: Documentation & Deployment
- [ ] Write admin setup guide
- [ ] Write user documentation
- [ ] Security audit
- [ ] Staging deployment
- [ ] Production deployment

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Token expiry during long operations | Medium | Low | Implement token refresh middleware |
| PKCE not enforced by API | Low | Medium | Verify endpoint accepts code_challenge |
| User not found after Entra login | Medium | Medium | Implement auto-user-creation or linking |
| Multiple Entra IDs per local user | Low | Medium | Enforce 1:1 mapping, add UI controls |
| ACL resolution with Entra IDs | Medium | High | Verify API resolves Entra object IDs in ACLs |
| Cross-domain CORS issues | Medium | Low | Configure CORS in API |

---

## Success Criteria

- [ ] Users can log in with Entra ID from login page
- [ ] Session persists across page reloads
- [ ] Token automatically refreshes when expired
- [ ] User profile displays Entra ID information
- [ ] File access respects Entra ID groups
- [ ] Logout clears all session data
- [ ] Works in all supported browsers
- [ ] No console errors related to auth
- [ ] < 500ms additional login time vs local auth

---

## Files to Review Before Starting

1. [src/components/pages/login-page.tsx](src/components/pages/login-page.tsx) - Current login UI
2. [src/services/neo-api.tsx](src/services/neo-api.tsx) - Current API service
3. [src/context/settings-context.tsx](src/context/settings-context.tsx) - Auth context structure
4. [src/hooks/useNeoApi.ts](src/hooks/useNeoApi.ts) - API hook patterns

---

## Conclusion

**The implementation is highly feasible.** The backend already has:
- ✅ Complete OAuth 2.0 Authorization Code flow
- ✅ Entra ID integration configured
- ✅ PKCE support
- ✅ User Entra ID field mapping
- ✅ OpenID Connect endpoints

**What's needed on frontend:**
- OAuth flow orchestration library
- Login UI with Entra ID button
- Token refresh middleware
- Callback handler

**Estimated effort: 1-2 weeks of development + testing**
