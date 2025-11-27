import { HashRouter, Routes, Route } from "react-router-dom"

import { ThemeProvider } from "@/components/navs/theme-provider"
import { AppSidebar } from "@/components/sidebars/sidebar"
import { SiteHeader } from "@/components/sidebars/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import Connector from "@/components/pages/connector"
import Monitoring from "@/components/pages/monitoring"
import Shares from "@/components/pages/shares"
import Files from "@/components/pages/files"
import Tasks from "@/components/pages/tasks"
import Users from "@/components/pages/users"
import Help from "@/components/pages/help"
import Logs from "@/components/pages/logs"

import { useNeoApi } from "@/hooks/useNeoApi"

function App() {
  const { state, handlers } = useNeoApi()

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
          <AppSidebar
            me={state.me}
            isConnected={!!state.token}
            onConnect={handlers.handleConnect}
            onLogout={handlers.handleLogout}
          />
          <SidebarInset>
            <SiteHeader
              onConnect={handlers.handleConnect}
              onRefresh={handlers.handleRefresh}
              isConnected={!!state.token}
            />
            <Routes>
              <Route
                path="/"
                element={
                  <Connector
                    health={state.health}
                    license={state.license}
                    version={state.version}
                    helmChartVersion={state.helmChartVersion}
                  />
                }
              />
              <Route
                path="/connector"
                element={
                  <Connector
                    health={state.health}
                    license={state.license}
                    version={state.version}
                    helmChartVersion={state.helmChartVersion}
                  />
                }
              />
              <Route
                path="/monitoring"
                element={
                  <Monitoring
                    databaseSize={state.databaseSize}
                    monitoring={state.monitoring}
                    onFetchMonitoring={handlers.handleFetchMonitoring}
                  />
                }
              />
              <Route
                path="/shares"
                element={
                  <Shares
                    shares={state.shares}
                    onDeleteShare={handlers.handleDeleteShare}
                    onAddShare={handlers.handleAddShare}
                    onUpdateShare={handlers.handleUpdateShare}
                    onStartCrawl={handlers.handleStartCrawl}
                    onFetchShareDetails={handlers.handleFetchShareDetails}
                    onRefresh={handlers.handleRefresh}
                  />
                }
              />
              <Route
                path="/files"
                element={
                  <Files
                    files={state.files}
                    shares={state.shares}
                    onSelectShare={handlers.handleSelectFilesShare}
                    onFetchFileMetadata={handlers.handleFetchFileMetadata}
                    onSearchFiles={handlers.handleSearchFiles}
                    onPageChange={handlers.handleFilesPageChange}
                    onRefresh={handlers.handleRefresh}
                  />
                }
              />
              <Route
                path="/tasks"
                element={
                  <Tasks
                    tasks={state.monitoring.tasks}
                    taskStats={state.monitoring.taskStats}
                    onFetchTasks={handlers.handleFetchTasks}
                    onDeleteTask={handlers.handleDeleteTask}
                  />
                }
              />
              <Route path="/logs" element={<Logs operations={state.operations} />} />
              <Route path="/users" element={
                <Users
                  users={state.users}
                  me={state.me}
                  onAddUser={handlers.handleAddUser}
                  onChangePassword={handlers.handleChangePassword}
                  onRefresh={handlers.handleRefresh}
                />
              } />
              <Route path="/help" element={<Help />} />
            </Routes>
          </SidebarInset>
        </HashRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App