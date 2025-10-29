import { useCallback, useState } from "react"
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
  type VersionResponse,
  type SharesResponse,
  type FilesResponse
} from "./components/services/neo-api"
import type { ConnectionCredentials } from "./components/dialogs/connect-dialog"

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [license, setLicense] = useState<LicenseResponse | null>(null)
  const [version, setVersion] = useState<VersionResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[] | null>(null)
  const [operations, setOperations] = useState<OperationResponse[] | null>(null)
  const [shares, setShares] = useState<SharesResponse[] | null>(null)
  const [files, setFiles] = useState<FilesResponse[] | null>(null)

  const handleConnect = useCallback(async (credentials: ConnectionCredentials) => {
    console.log('Connecting to NetApp Neo API endpoint')
    
    try {
      const api = new NeoApiService()
      
      // Authenticate and get token
      console.log('Authenticating...')
      const token = await api.authenticate(credentials.username, credentials.password)
      console.log('Token received:', token.substring(0, 20) + '...')
      
      // Fetch all system data
      console.log('Fetching system data...')
      const data = await api.fetchSystemData(token)
      console.log('System data received:', data)
      
      setHealth(data.health)
      setLicense(data.license)
      setVersion(data.version)
      setUsers(data.users)
      setOperations(data.operations)
      setShares(data.shares)
      setFiles(data.files)
    } catch (error) {
      console.error('Connection error:', error)
      // Re-throw to let the dialog handle it
      throw error
    }
  }, [])

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
            <SiteHeader onConnect={handleConnect} isConnected={!!health} />
            <Routes>
              <Route path="/" element={<Help />} />
              <Route 
                path="/dashboard" 
                element={<Dashboard health={health} license={license} version={version} />} 
              />
              <Route path="/shares" element={<Shares shares={shares} />} />
              <Route path="/files" element={<Files files={files}/>} />
              <Route path="/operations" element={<Operations operations={operations}/>} />
              <Route path="/users" element={<Users users={users} />} />
              <Route path="/help" element={<Help />} />
            </Routes>
          </SidebarInset>
        </HashRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App