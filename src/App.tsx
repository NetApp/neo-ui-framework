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
import Page from "./components/pages/dashboard"

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <HashRouter>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
                <Routes>
                  <Route path="/" element={<WelcomePage />} />
                  <Route path="/dashboard" element={<Page />} />
                </Routes>
          </SidebarInset>
        </HashRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App