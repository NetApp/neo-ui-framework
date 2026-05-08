// Copyright 2025 NetApp, Inc. All Rights Reserved.
import React from "react"
import { HashRouter, Routes, Route } from "react-router-dom"

import { ThemeProvider } from "@/components/navs/theme-provider"
import { AppSidebar } from "@/components/sidebars/sidebar"
import { SiteHeader } from "@/components/sidebars/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"

// import Connector from "@/components/pages/connector"
const Monitoring = React.lazy(() => import("@/components/pages/monitoring"))
const Shares = React.lazy(() => import("@/components/pages/shares"))
const Files = React.lazy(() => import("@/components/pages/files"))
const Tasks = React.lazy(() => import("@/components/pages/tasks"))
const Users = React.lazy(() => import("@/components/pages/users"))
const Help = React.lazy(() => import("@/components/pages/help"))
const Logs = React.lazy(() => import("@/components/pages/logs"))
const Settings = React.lazy(() => import("@/components/pages/settings"))
const MyDatasets = React.lazy(() => import("@/components/pages/my-datasets"))
const ContentSearch = React.lazy(() => import("@/components/pages/content-search"))
const DatasetPage = React.lazy(() => import("@/components/pages/dataset-page"))


import LoginPage from "@/components/pages/login-page"
import { useNeoApi } from "@/hooks/useNeoApi"
import { SetupWizardDialog } from "@/components/dialogs/setup-wizard-dialog"

function RouteFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}

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
              cacheStats={state.cacheStats}
            />
            <React.Suspense fallback={<RouteFallback />}>
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
                      onFetchDatasets={handlers.handleFetchDatasets}
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
                      datasets={state.datasets}
                      onContentSearch={handlers.handleContentSearch}
                      onCreateDataset={handlers.handleCreateDataset}
                      onAddToDataset={handlers.handleAddDatasetItems}
                      onFetchDatasets={handlers.handleFetchDatasets}
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
                      onDeleteDatasetItems={handlers.handleDeleteDatasetItems}
                      onFetchDatasetItems={handlers.handleFetchDatasetItems}
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
                <Route
                  path="/logs"
                  element={<Logs operations={state.operations} monitoringOverview={state.monitoring.overview} />}
                />
                <Route
                  path="/users"
                  element={
                    <Users
                      users={state.users}
                      me={state.me}
                      onAddUser={handlers.handleAddUser}
                      onChangePassword={handlers.handleChangePassword}
                      onRefresh={handlers.handleRefresh}
                      onLinkEntra={handlers.handleLinkEntraIdentity}
                      onUnlinkEntra={handlers.handleUnlinkEntraIdentity}
                      monitoringOverview={state.monitoring.overview}
                    />
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Settings
                      monitoringOverview={state.monitoring.overview}
                      state={state}
                      handlers={handlers}
                    />
                  }
                />
                <Route path="/help" element={<Help />} />
              </Routes>
            </React.Suspense>
          </SidebarInset>
        </HashRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App