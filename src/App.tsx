import { 
  HashRouter,
  Routes,
  Route
} from "react-router-dom"

import { ThemeProvider } from "./components/navs/theme-provider"

import { AppSidebar } from "@/components/sidebars/sidebar"
import { SiteHeader } from "@/components/sidebars/header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import WelcomePage from "./components/pages/welcome"
import Dashboard from "./components/pages/dashboard"
import Shares from "./components/pages/shares"
import Files from "./components/pages/files"
import Operations from "./components/pages/operations"
import Help from "./components/pages/help"

function App() {
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
            <SiteHeader />
                <Routes>
                  <Route path="/" element={<Help />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/shares" element={<Shares />} />
                  <Route path="/files" element={<Files />} />
                  <Route path="/operations" element={<Operations />} />
                  <Route path="/help" element={<Help />} />
                </Routes>
          </SidebarInset>
        </HashRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App