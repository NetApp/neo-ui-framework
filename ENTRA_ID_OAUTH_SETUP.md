# Entra ID OAuth Frontend Implementation - Setup Guide

## Overview

This guide covers the frontend OAuth 2.0 implementation for Entra ID login in the Neo UI. The implementation is nearly complete - just a few manual configuration steps are needed.

## What's Been Created

### 1. **OAuth Service** (`src/services/entra-id-auth.ts`)
- Handles PKCE (Proof Key for Code Exchange) 
- Manages OAuth flow (authorization code exchange)
- Secure token storage in sessionStorage
- State validation for CSRF protection

### 2. **OAuth Hook** (`src/hooks/useEntraIdAuth.ts`)
- React hook for OAuth state management
- Token storage and retrieval
- Auth flow initiation

### 3. **OAuth Callback Page** (`src/components/pages/oauth-callback.tsx`)
- Handles redirect from Entra ID
- Exchanges authorization code for access token
- Error handling and user feedback

### 4. **Updated Login Page** (`src/components/pages/login-page.tsx`)
- Added "Sign in with Entra ID" button
- Entra ID token exchange handling
- Error display for both local and OAuth auth

### 5. **Environment Configuration** (`.env.example`)
- Template for required environment variables

---

## Manual Configuration Steps

### Step 1: Update App.tsx

Add the OAuth callback route handling. Find the App component and update it as follows:

**File**: `src/App.tsx`

**Update the imports:**
```typescript
import LoginPage from "@/components/pages/login-page"
import OAuthCallbackPage from "@/components/pages/oauth-callback"  // Add this line
import { useNeoApi } from "@/hooks/useNeoApi"
import { SetupWizardDialog } from "@/components/dialogs/setup-wizard-dialog"
```

**Update the App component's login page rendering** (currently around line 43-56):

Replace:
```typescript
if (!state.token) {
  return (
    <ThemeProvider>
      <LoginPage
        onConnect={handlers.handleConnect}
        onOAuthLogin={handlers.handleOAuthLogin}
      />
      <SetupWizardDialog
        open={state.setupStatus?.setup_complete === false}
        onOpenChange={() => { }}
        onComplete={() => window.location.reload()}
      />
    </ThemeProvider>
  )
}
```

With:
```typescript
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
        onOpenChange={() => { }}
        onComplete={() => window.location.reload()}
      />
    </ThemeProvider>
  )
}
```

### Step 2: Create Environment Variables File

Create `.env.local` in your project root with Entra ID OAuth configuration:

```bash
# Copy from .env.example and fill in your values
cp .env.example .env.local
```

**Edit `.env.local`:**
```env
# Azure AD Tenant ID (get from Azure Portal)
VITE_ENTRA_TENANT_ID=your-tenant-id

# Application (Client) ID from Azure App Registration
VITE_ENTRA_CLIENT_ID=your-client-id

# API Server URL
VITE_API_URL=http://localhost:8000/api

# OAuth Redirect URI (must match Azure App Registration)
# For development: http://localhost:5173/auth/callback
# For production: https://your-domain.com/auth/callback
VITE_ENTRA_REDIRECT_URI=http://localhost:5173/auth/callback

# Optional: Token audience
VITE_ENTRA_AUDIENCE=api://your-client-id

# Enable/disable Entra ID  (default: true)
VITE_ENABLE_ENTRA_ID=true
```

### Step 3: Update Handlers in useNeoApi

The hook needs a handler for Entra ID token exchange. Find the `useNeoApi.ts` file and add:

**File**: `src/hooks/useNeoApi.ts`

In the `handlers` object (around line 1470-1480), add:

```typescript
handleEntraIdLogin: useCallback(async (entraToken: string) => {
  appLogger.info("Exchanging Entra ID token for Neo API token")
  
  try {
    // The Entra ID token can be used directly as a Bearer token
    // or exchanged at the /token endpoint if you have a bridge flow
    // For now, use it directly
    const token = entraToken
    
    // Get user information using the Entra ID token
    const data = await api.fetchSystemData(token)
    
    applySystemData(data)
    setToken(token)
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
}, [applySystemData, clearSystemData])
```

And add it to the handlers return object:
```typescript
handlers: {
  // ... existing handlers ...
  handleEntraIdLogin,
  // ... rest of handlers ...
}
```

### Step 4: Azure App Registration Setup

Follow the guide in `ENTRA_ID_LOGIN_ANALYSIS.md` under "Required Azure App Registration Setup" to:

1. Create/update your app registration in Azure Portal
2. Configure redirect URIs
3. Add API permissions
4. Generate a client secret
5. Get your tenant ID and client ID

### Step 5: Configure Backend OAuth

Once the Azure app is configured, set up MCP OAuth on the backend:

```bash
# Make an API request to configure MCP OAuth
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

## Testing the Implementation

### Development Testing

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Test local login first:**
   - Verify local username/password login works
   - Make sure you can access the app normally

3. **Test Entra ID login:**
   - Click "Sign in with Entra ID" button
   - You should be redirected to Entra ID login
   - After logging in, you'll be redirected to `/auth/callback`
   - The page should exchange the code for a token
   - You should be logged into the app

4. **Test token exchange:**
   - Open browser DevTools (F12) → Application → Session Storage
   - Look for `entra_oauth_token` and `entra_oauth_state` keys
   - Verify the token structure

5. **Test error handling:**
   - Try canceling the Entra ID login
   - Try with invalid credentials
   - Verify error messages appear correctly

### Production Testing

1. Update `VITE_ENTRA_REDIRECT_URI` to your production domain
2. Add the production domain to Azure App Registration redirect URIs
3. Test the full OAuth flow in a staging environment
4. Verify tokens persist across page reloads (sessionStorage)

---

## Troubleshooting

### "OAuth is not configured" Error

**Cause**: Environment variables not set  
**Fix**: 
- Ensure `.env.local` exists with all required variables
- Restart dev server after updating env vars
- Check that variable names are correct (must start with `VITE_`)

### Redirect URI mismatch error from Entra ID

**Cause**: Redirect URI in app doesn't match Azure configuration  
**Fix**:
- Verify `VITE_ENTRA_REDIRECT_URI` matches Azure App Registration
- For development: use `http://localhost:5173/auth/callback`
- For production: use your actual domain

### Token not being stored

**Cause**: Browser privacy mode or sessionStorage disabled  
**Fix**:
- Test in normal browsing mode (not private/incognito)
- Check browser console for sessionStorage errors
- Ensure cookies/storage are not blocked

### "State parameter mismatch" error

**Cause**: State validation failed (CSRF attack prevention)  
**Fix**:
- This is rare, usually means:
  - Manual URLs being constructed
  - Session was cleared between redirect steps
  - Clock skew between client/server
- Try clearing sessionStorage and logging in again

### User not found after Entra ID login

**Cause**: Entra ID user doesn't exist in Neo system  
**Fix**:
- Admin needs to create user in Neo with matching Entra ID object ID
- Or implement auto-user-creation (requires backend changes)
- Check if user email matches

---

## Security Considerations

### ✅ What's Already Secured

1. **PKCE**: Authorization code interception prevention
2. **State Parameter**: CSRF attack prevention  
3. **Nonce**: ID token replay attack prevention
4. **SessionStorage**: Tokens cleared on browser close
5. **HTTPS Required**: In production, ensure all URLs are HTTPS

### ⚠️ Additional Recommendations

1. **Implement token refresh**: If tokens expire, implement refresh flow
2. **Validate token signature**: Optional - already done by API
3. **Add token revocation**: Call logout on server when user logs out
4. **Monitor for token leaks**: Check logs for suspicious token usage

---

## API Integration Points

### Endpoints Used

1. **`GET /authorize`** - Redirect to Entra ID
2. **`POST /token`** - Exchange code for token
3. **`GET /oauth/callback`** - Receive callback from Entra ID
4. **`GET /api/v1/users/me`** - Get current user info
5. **`POST /logout`** - Invalidate token on logout

### Token Format

The token returned is a JWT with claims including:
- `sub`: Subject (user ID)
- `email`: User email
- `name`: User display name
- `oid`: Entra ID object ID
- `tid`: Tenant ID

---

## Next Steps

1. ✅ Complete Azure App Registration setup
2. ✅ Update `src/App.tsx` with OAuth callback route
3. ✅ Create `.env.local` with configuration
4. ✅ Add handler to `useNeoApi.ts`
5. ✅ Test local login first
6. ✅ Test Entra ID login flow
7. ✅ Deploy to staging
8. ✅ Test in production environment

---

## FAQ

**Q: Can I use this for both local and Entra ID auth?**  
A: Yes! Users can choose between local login or Entra ID at the login screen.

**Q: What happens if both local and Entra ID accounts exist?**  
A: Currently they're separate. Consider implementing account linking for better UX.

**Q: How long are tokens valid?**  
A: Set in Azure AD (default 1 hour). Implement refresh token flow for longer sessions.

**Q: Can I restrict login to certain Entra ID groups?**  
A: Yes, add group claims validation in the token exchange handler.

**Q: What if Entra ID OAuth fails?**  
A: User can fall back to local username/password login.

---

## Support

For issues related to:
- **OAuth flow**: Check browser console for errors, review `entra-id-auth.ts`
- **Token exchange**: Check `useNeoApi.ts` handler implementation
- **Azure configuration**: See Azure App Registration setup in ENTRA_ID_LOGIN_ANALYSIS.md
- **Backend OAuth**: See API documentation for `/api/v1/setup/mcp`
