import { useCallback, useRef, useState } from "react"
import { 
  HashRouter,
  Routes,
  Route
} from "react-router-dom"

import { ThemeProvider } from "./components/navs/theme-provider"

import { AppSidebar } from "./components/sidebars/sidebar"
import { SiteHeader } from "./components/sidebars/header"
import {
  SidebarInset,
  SidebarProvider,
} from "./components/ui/sidebar"

import Dashboard from "./components/pages/dashboard"
import Shares from "./components/pages/shares"
import Files from "./components/pages/files"
import Operations from "./components/pages/operations"
import Users from "./components/pages/users"
import Help from "./components/pages/help"

import { 
  NeoApiService, 
  type HealthResponse, 
  type LicenseResponse, 
  type OperationResponse, 
  type UserResponse,
  type MeResponse,
  type VersionResponse,
  type SharesResponse,
  type FilesResponse,
  type ShareDetailsResponse,
  AuthenticationError,
} from "./components/services/neo-api"
import type { ConnectionCredentials } from "./components/dialogs/connect-dialog"
import { toast } from "sonner"

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [license, setLicense] = useState<LicenseResponse | null>(null)
  const [version, setVersion] = useState<VersionResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[] | null>(null)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [operations, setOperations] = useState<OperationResponse[] | null>(null)
  const [shares, setShares] = useState<SharesResponse[] | null>(null)
  const [files, setFiles] = useState<FilesResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const apiRef = useRef(new NeoApiService())

  const applySystemData = useCallback((data: {
    health: HealthResponse
    license: LicenseResponse
    version: VersionResponse
    users: UserResponse[]
    me: MeResponse
    operations: OperationResponse[]
    shares: SharesResponse[]
    files: FilesResponse | null
  }) => {
    setHealth(data.health)
    setLicense(data.license)
    setVersion(data.version)
    setUsers(data.users)
    setMe(data.me)
    setOperations(data.operations)
    setShares(data.shares)
    setFiles(data.files)
  }, [])

  const clearSystemData = useCallback(() => {
    setHealth(null)
    setLicense(null)
    setVersion(null)
    setUsers(null)
    setMe(null)
    setOperations(null)
    setShares(null)
    setFiles(null)
  }, [])

  const handleConnect = useCallback(async (credentials: ConnectionCredentials) => {
    console.log("Connecting to NetApp Neo API endpoint")

    try {
      const api = apiRef.current
      const token = await api.authenticate(credentials.username, credentials.password)
      const data = await api.fetchSystemData(token)

      applySystemData(data)
      setToken(token)
    } catch (error) {
      clearSystemData()
      setToken(null)
      throw error
    }
  }, [applySystemData, clearSystemData])

  const handleRefresh = useCallback(async () => {
    if (!token) {
      throw new AuthenticationError()
    }

    const api = apiRef.current

    try {
      const data = await api.fetchSystemData(token)
      applySystemData(data)
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
      }
      throw error
    }
  }, [applySystemData, clearSystemData, token])

  const handleDeleteShare = useCallback(async (shareId: number) => {
    if (!token) {
      throw new AuthenticationError()
    }

    const api = apiRef.current

    try {
      await api.deleteShare(token, shareId)
      const data = await api.fetchSystemData(token)
      applySystemData(data)
      toast.success("Share deleted!")
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
      }
      toast.error("Share deletion failed!")
      throw error
    }
  }, [applySystemData, clearSystemData, token])

  const handleAddShare = useCallback(
    async (share: {
      share_path: string
      username: string
      password: string
      crawl_schedule: string
      rules: {
        exclude_patterns: string[]
        include_patterns: string[]
        max_file_size: number
        min_file_size: number
        persist_file_content: boolean
      }
      realm: string
      use_kerberos: string
      workgroup: string
      resolve_order: string
    }) => {
      if (!token) {
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        await api.createShare(token, share)
        const data = await api.fetchSystemData(token)
        applySystemData(data)
        toast.success("Share added!")
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Share creation failed!")
        throw error
      }
    },
    [applySystemData, clearSystemData, token]
  )

  const handleUpdateShare = useCallback(
    async (
      shareId: number,
      share: {
        share_path: string
        username: string
        password: string
        crawl_schedule: string
        rules: Record<string, unknown>
        realm: string
        use_kerberos: string
        workgroup: string
        resolve_order: string
      }
    ) => {
      if (!token) {
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        await api.updateShare(token, shareId, share)
        const data = await api.fetchSystemData(token)
        applySystemData(data)
        toast.success("Share updated!")
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Share update failed!")
        throw error
      }
    },
    [applySystemData, clearSystemData, token]
  )

  const handleStartCrawl = useCallback(
    async (shareId: number) => {
      if (!token) {
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        await api.startShareCrawl(token, shareId)
        const data = await api.fetchSystemData(token)
        applySystemData(data)
        return true
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        return false
      }
    },
    [applySystemData, clearSystemData, token]
  )

  const handleFetchShareDetails = useCallback(
    async (shareId: number): Promise<ShareDetailsResponse> => {
      if (!token) {
        throw new AuthenticationError()
      }

      const api = apiRef.current
      return api.getShareDetails(token, shareId)
    },
    [token]
  )

  const handleAddUser = useCallback(
    async (user: {
      id: number
      username: string
      password: string
      email?: string
      is_active: boolean
      is_admin: boolean
    }) => {
      if (!token) {
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        await api.createUser(token, user)
        const data = await api.fetchSystemData(token)
        applySystemData(data)
        toast.success("User created!")
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("User creation failed!")
        throw error
      }
    },
    [applySystemData, clearSystemData, token]
  )

  const handleChangePassword = useCallback(
    async (payload: { current_password: string; new_password: string }) => {
      if (!token) {
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        await api.changeMyPassword(token, payload)
        toast.success("Password updated!")
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Password update failed!")
        throw error
      }
    },
    [clearSystemData, token]
  )

  return (
    <ThemeProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "12rem",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <HashRouter>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader onConnect={handleConnect} onRefresh={handleRefresh} isConnected={!!token} />
            <Routes>
              <Route path="/" element={<Help />} />
              <Route 
                path="/dashboard" 
                element={<Dashboard health={health} license={license} version={version} />} 
              />
              <Route 
                path="/shares"
                element={
                  <Shares
                    shares={shares}
                    onDeleteShare={handleDeleteShare}
                    onAddShare={handleAddShare}
                    onUpdateShare={handleUpdateShare}
                    onStartCrawl={handleStartCrawl}
                    onFetchShareDetails={handleFetchShareDetails}
                  />
                }
              />
              <Route path="/files" element={<Files files={files} />} />
              <Route path="/operations" element={<Operations operations={operations}/>} />
              <Route
                path="/users"
                element={
                  <Users
                    users={users}
                    me={me}
                    onAddUser={handleAddUser}
                    onChangePassword={handleChangePassword}
                  />
                }
              />
              <Route path="/help" element={<Help />} />
            </Routes>
          </SidebarInset>
        </HashRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App