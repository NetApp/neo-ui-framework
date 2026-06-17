// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import "@/i18n"

import { SettingsProvider } from "@/context/settings-context"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)
