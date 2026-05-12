# Entra ID OAuth - Code Snippets to Add

This file contains exact code snippets to add to your existing files.

## 1. Update App.tsx

### Add Import
**Location**: After line 26 (after existing imports)

```typescript
import OAuthCallbackPage from "@/components/pages/oauth-callback"
```

### Update App Component
**Location**: Replace the login section (around line 41-57)

**BEFORE:**
```typescript
function App() {
  const { state, handlers } = useNeoApi()

  if (!state.token) {
    return (
      <ThemeProvider>
        <LoginPage
          onConnect={handlers.handleConnect}
          onOAuthLogin={handlers.handleOAuthLogin}
        />
        <SetupWizardDialog
          open={state.setupStatus?.setup_complete === false}
          onOpenChange={() => { }} // Controlled by state
          onComplete={() => window.location.reload()}
        />
      </ThemeProvider>
    )
  }
  // ... rest of component
}
```

**AFTER:**
```typescript
function App() {
  const { state, handlers } = useNeoApi()

  if (!state.token) {
    return (
      <ThemeProvider>
        <HashRouter>
          <Routes>
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={
              <LoginPage
                onConnect={handlers.handleConnect}
                onOAuthLogin={handlers.handleOAuthLogin}
                onEntraIdLogin={handlers.handleEntraIdLogin}
              />
            } />
          </Routes>
        </HashRouter>
        <SetupWizardDialog
          open={state.setupStatus?.setup_complete === false}
          onOpenChange={() => { }} // Controlled by state
          onComplete={() => window.location.reload()}
        />
      </ThemeProvider>
    )
  }
  // ... rest of component
}
```

---

## 2. Add Handler to useNeoApi.ts

### Add Handler Function
**Location**: After the `handleLogout` function (around line 1340)

```typescript
const handleEntraIdLogin = useCallback(
  async (entraAccessToken: string) => {
    appLogger.info("Exchanging Entra ID OAuth token for Neo API session")

    // Clear any existing state before attempting new login
    clearSystemData()
    apiRef.current.clearCache()
    setToken(null)

    try {
      const api = apiRef.current
      
      // For Entra ID login, the access token from OAuth can be used directly
      // as it's issued by our API's /token endpoint with PKCE validation
      const newToken = entraAccessToken
      
      // Fetch system data using the Entra ID token
      const data = await api.fetchSystemData(newToken)

      applySystemData(data)
      setToken(newToken)
      setCacheStats(api.getCacheStats())
      
      if (data.me) {
        toast.success(`Welcome, ${data.me.username}`)
      } else {
        toast.success("Welcome")
      }
      
      appLogger.info("Successfully logged in with Entra ID", undefined, {
        userId: data.me?.id,
        username: data.me?.username,
      })
    } catch (error) {
      clearSystemData()
      setToken(null)

      // Provide user-friendly error messages
      if (error instanceof AuthenticationError) {
        toast.error(error.message)
      } else if (error instanceof Error) {
        toast.error(`Entra ID login failed: ${error.message}`)
      } else {
        toast.error("Entra ID login failed. Please try again")
      }

      appLogger.error(
        "Entra ID login failed",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  },
  [applySystemData, clearSystemData]
)
```

### Add to Handlers Return Object
**Location**: In the handlers object return (around line 1390+)

Find this section:
```typescript
  return {
    state: {
      // ... state properties
    },
    handlers: {
      handleConnect,
      handleRefresh,
      // ... other handlers
      handleLogout,
      // ADD THE NEW HANDLER HERE:
      handleEntraIdLogin,
      // ... rest of handlers
    },
  }
}
```

So the full handlers object should include:
```typescript
handlers: {
  handleConnect,
  handleRefresh,
  handleDeleteShare,
  handleAddShare,
  handleUpdateShare,
  handleStartCrawl,
  handleFetchShareDetails,
  handleAddUser,
  handleChangePassword,
  handleFetchFileMetadata,
  handleSelectFilesShare,
  handleSearchFiles,
  handleFetchMonitoring,
  handleFetchTasks,
  handleDeleteTask,
  handleLogout,
  handleEntraIdLogin,  // ADD THIS
  handleFilesPageChange,
  // ... rest of handlers
}
```

---

## 3. Create .env.local File

**Location**: Project root (same level as package.json)

**Content**:
```env
# Entra ID OAuth Configuration
VITE_ENTRA_TENANT_ID=your-azure-ad-tenant-id-here

VITE_ENTRA_CLIENT_ID=your-app-client-id-here

VITE_API_URL=http://localhost:8000/api

VITE_ENTRA_REDIRECT_URI=http://localhost:5173/auth/callback

# Optional
VITE_ENTRA_AUDIENCE=api://your-app-client-id-here

VITE_ENABLE_ENTRA_ID=true
```

Replace:
- `your-azure-ad-tenant-id-here` → Your actual Azure AD tenant ID (e.g., "contoso.onmicrosoft.com" or UUID)
- `your-app-client-id-here` → Your app registration's client ID from Azure Portal
- Port numbers → Adjust if your dev/prod servers run on different ports

---

## 4. Configure Backend OAuth (One-time)

Once you have Azure App Registration details, configure the backend:

```bash
curl -X POST http://localhost:8000/api/v1/setup/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "tenant_id": "your-tenant-id",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "audience": "api://your-client-id"
  }'
```

Or if setup mode is enabled:
```bash
curl -X POST http://localhost:8000/api/v1/setup/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-id",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "audience": "api://your-client-id"
  }'
```

---

## Testing Your Implementation

### 1. Verify Environment Variables Are Loaded
Open DevTools console and check:
```javascript
console.log(import.meta.env.VITE_ENTRA_TENANT_ID)
console.log(import.meta.env.VITE_ENTRA_CLIENT_ID)
console.log(import.meta.env.VITE_ENTRA_REDIRECT_URI)
```

Should show your actual values (not "undefined").

### 2. Verify OAuth Service Initialized
In console:
```javascript
import { entraIdOAuthService } from './src/services/entra-id-auth.ts'
console.log(entraIdOAuthService.isConfigured())
```

Should return `true` if configured correctly.

### 3. Test OAuth Flow
1. Click "Sign in with Entra ID" button
2. You should be redirected to Entra ID login
3. After authentication, redirected to `http://localhost:5173/auth/callback?code=...&state=...`
4. Should automatically exchange code and log you in

### 4. Check SessionStorage
Open DevTools → Application → Session Storage:
- Should see `entra_oauth_token` key with access token
- Should see `entra_oauth_state` cleared after use

---

## Troubleshooting Code Additions

### If "handleEntraIdLogin is not a function"
- Ensure you added the handler function
- Ensure you added it to the handlers return object
- Make sure the function name matches exactly (case-sensitive)
- Restart dev server

### If "OAuthCallbackPage is not defined"
- Check import statement is correct: `import OAuthCallbackPage from "@/components/pages/oauth-callback"`
- Verify file exists at `src/components/pages/oauth-callback.tsx`
- Restart dev server

### If "HashRouter is not defined"
- Ensure HashRouter is imported from react-router-dom at top of App.tsx
- It should already be imported, but check it's there

### If redirect loop
- Check your redirect URI matches exactly in:
  1. `.env.local` (`VITE_ENTRA_REDIRECT_URI`)
  2. Azure App Registration
  3. Backend OAuth config
- All three must match exactly

---

## Summary of Changes

| File | Type | Location | Change |
|------|------|----------|--------|
| `src/App.tsx` | Modify | Line 26 | Add OAuthCallbackPage import |
| `src/App.tsx` | Modify | Line 41-57 | Wrap LoginPage in HashRouter with callback route |
| `src/hooks/useNeoApi.ts` | Add | After handleLogout | Add handleEntraIdLogin function |
| `src/hooks/useNeoApi.ts` | Modify | Handlers return | Add handleEntraIdLogin to object |
| `.env.local` | Create | Project root | Add OAuth configuration |
| Backend API | Configure | One-time | Call `/api/v1/setup/mcp` endpoint |

---

## Files Already Created

These files are complete and ready to use:
- ✅ `src/services/entra-id-auth.ts`
- ✅ `src/hooks/useEntraIdAuth.ts`
- ✅ `src/components/pages/oauth-callback.tsx`
- ✅ `src/components/pages/login-page.tsx` (updated)
- ✅ `.env.example`
- ✅ Documentation files

No changes needed to these files!
