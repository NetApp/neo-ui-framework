// Copyright 2025 NetApp, Inc. All Rights Reserved.
import React from "react"
import { HashRouter, Routes, Route } from "react-router-dom"

import { ThemeProvider } from "@/components/navs/theme-provider"
import { AppSidebar } from "@/components/sidebars/sidebar"
import { SiteHeader } from "@/components/sidebars/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// import Connector from "@/components/pages/connector"
import Monitoring from "@/components/pages/monitoring"
import Shares from "@/components/pages/shares"
import Files from "@/components/pages/files"
import Tasks from "@/components/pages/tasks"
import Users from "@/components/pages/users"
import Help from "@/components/pages/help"
import Logs from "@/components/pages/logs"
import Settings from "@/components/pages/settings"
const MyDatasets = React.lazy(() => import("@/components/pages/my-datasets"))
const ContentSearch = React.lazy(() => import("@/components/pages/content-search"))
const DatasetPage = React.lazy(() => import("@/components/pages/dataset-page"))

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { IconAlertTriangle } from "@tabler/icons-react"

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
            datasets={state.datasets}
          />
          <SidebarInset>
            <SiteHeader
              onConnect={handlers.handleConnect}
              onRefresh={handlers.handleRefresh}
              isConnected={!!state.token}
              cacheStats={state.cacheStats}
            />
            {!state.token && (
              <div className="px-4 pt-4 lg:px-6 lg:pt-6">
                <Alert variant="destructive">
                  <IconAlertTriangle className="h-4 w-4" />
                  <AlertTitle>Authentication Required</AlertTitle>
                  <AlertDescription>
                    Some resources on this page require valid authentication. Please log in.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <Routes>
              <Route
                path="/"
                element={
                  <Monitoring
                    databaseSize={state.databaseSize}
                    monitoring={state.monitoring}
                    onFetchMonitoring={handlers.handleFetchMonitoring}
                    cacheStats={state.cacheStats}
                    onRetryWorkItems={handlers.handleRetryWorkItems}
                    health={state.health}
                    license={state.license}
                    version={state.version}
                    helmChartVersion={state.helmChartVersion}
                  />
                }
              />
              {/* <Route
                path="/connector"
                element={
                  <Connector
                    health={state.health}
                    license={state.license}
                    version={state.version}
                    helmChartVersion={state.helmChartVersion}
                    monitoringOverview={state.monitoring.overview}
                  />
                }
              /> */}
              <Route
                path="/monitoring"
                element={
                  <Monitoring
                    databaseSize={state.databaseSize}
                    monitoring={state.monitoring}
                    onFetchMonitoring={handlers.handleFetchMonitoring}
                    cacheStats={state.cacheStats}
                    onRetryWorkItems={handlers.handleRetryWorkItems}
                    health={state.health}
                    license={state.license}
                    version={state.version}
                    helmChartVersion={state.helmChartVersion}
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
                    monitoringOverview={state.monitoring.overview}
                    isAdmin={state.me?.is_admin ?? false}
                  />
                }
              />
              <Route
                path="/my-datasets/data-corpus"
                element={
                  <Files
                    files={state.files}
                    shares={state.shares}
                    onSelectShare={handlers.handleSelectFilesShare}
                    onFetchFileMetadata={handlers.handleFetchFileMetadata}
                    onSearchFiles={handlers.handleSearchFiles}
                    onPageChange={handlers.handleFilesPageChange}
                    onCreateDataset={handlers.handleCreateDataset}
                    onRefresh={handlers.handleRefresh}
                    monitoringOverview={state.monitoring.overview}
                    cacheStats={state.cacheStats}
                  />
                }
              />
              <Route
                path="/my-datasets/my-datasets"
                element={
                  <MyDatasets
                    datasets={state.datasets}
                    onFetchFileMetadata={handlers.handleFetchFileMetadata}
                    onDeleteDataset={handlers.handleDeleteDataset}
                    monitoringOverview={state.monitoring.overview}
                    cacheStats={state.cacheStats}
                  />
                }
              />
              <Route
                path="/my-datasets/content-search"
                element={
                  <ContentSearch
                    shares={state.shares}
                    onContentSearch={handlers.handleContentSearch}
                    onCreateDataset={handlers.handleCreateDataset}
                    monitoringOverview={state.monitoring.overview}
                    version={state.version}
                  />
                }
              />
              <Route
                path="/my-datasets/:datasetId"
                element={
                  <DatasetPage
                    datasets={state.datasets}
                    onFetchFileMetadata={handlers.handleFetchFileMetadata}
                    onDeleteDataset={handlers.handleDeleteDataset}
                  />
                }
              />
              <Route
                path="/tasks"
                element={
                  <Tasks
                    tasks={state.monitoring.tasks}
                    taskStats={state.monitoring.taskStats}
                    aclCacheStats={state.monitoring.aclCacheStats}
                    onFetchTasks={handlers.handleFetchTasks}
                    onDeleteTask={handlers.handleDeleteTask}
                    monitoringOverview={state.monitoring.overview}
                  />
                }
              />
              <Route path="/logs" element={<Logs operations={state.operations} monitoringOverview={state.monitoring.overview} />} />
              <Route path="/users" element={
                <Users
                  users={state.users}
                  me={state.me}
                  onAddUser={handlers.handleAddUser}
                  onChangePassword={handlers.handleChangePassword}
                  onRefresh={handlers.handleRefresh}
                  monitoringOverview={state.monitoring.overview}
                />
              } />
              <Route path="/settings" element={
                <Settings
                  monitoringOverview={state.monitoring.overview}
                  cacheStats={state.cacheStats}
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