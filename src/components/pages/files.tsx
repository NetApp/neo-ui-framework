"use client"

import {
  SidebarInset,
  SidebarProvider,
} from "../ui/sidebar"

import {
  IconShieldCheck,
  IconBolt,
  IconCertificate
} from "@tabler/icons-react"

export default function Files() {
  
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >      
    <SidebarInset>
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col items-center w-full">
        <div className="text-center mb-10 mt-0">
          <h1 className="text-4xl font-bold mb-4">Neo</h1>
          <p className="text-muted-foreground text-xl text-justif">
            NEO allows organizations to securely connect their data to Gen AI such as M365 <br />Copilot without the need to perform migration or change existing security policies.
          </p>
        </div>
        <div className="rounded-xl shadow-lg p-8 flex flex-col items-center w-full max-w-2xl">
          <div className="flex flex-col md:flex-row justify-center gap-8 mb-6 w-full">
            <div className="flex flex-col items-center flex-1">
              <div className="bg-blue-100 rounded-full p-4 mb-2">
                <IconShieldCheck size={40} className="text-blue-600" />
              </div>
              <div className="font-bold mb-2">Secure Connection</div>
              <div className="text-sm text-center">Connect your data securely<br />without migration</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="bg-green-100 rounded-full p-4 mb-2">
                <IconBolt size={40} className="text-green-600" />
              </div>
              <div className="font-bold mb-2">Fast Integration</div>
              <div className="text-sm text-center">Quick setup with existing<br />infrastructure</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="bg-purple-100 rounded-full p-4 mb-2">
                <IconCertificate size={40} className="text-purple-600" />
              </div>
              <div className="font-bold mb-2">Policy Compliance</div>
              <div className="text-sm text-center">Maintain existing security<br />policies</div>
            </div>
          </div>
          {/* Removed Get Started button */}
        </div>
      </div>
    </div>
    </SidebarInset>
    </SidebarProvider>
      
  )
}
