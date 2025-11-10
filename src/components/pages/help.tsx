"use client"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { 
  IconLogin, 
  IconRefresh 
} from "@tabler/icons-react"

import { 
  Button 
} from "@/components/ui/button"

export default function Help() {
  
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
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">

          <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-xl">Neo UI</AccordionTrigger>
              <AccordionContent>
                <p>The Neo UI provides a basic stateless user-friendly interface for managing a Neo instance to help you easily 
                  configure shares, schedule crawls, search files, monitor status, and view logs.</p>
                <br /><p>To start using Neo UI:</p>
                <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>Simply click the icon <Button variant="outline" size="icon" className="hidden sm:inline-flex"><IconLogin /></Button> 
                  either at the top right corner or bottom left corner, and enter the admin credentials to get started.</li>
                  <li>Once you've entered the credentials, pages can easily be refreshed by clicking 
                    <Button variant="outline" size="icon" className="hidden sm:inline-flex"><IconRefresh /></Button> in the top right corner.</li>
                  <li>If the token expires, enter your credentials again.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-xl">NetApp Neo</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4">
                <p>NetApp Neo for M365 Copilot is a containerized solution that
                enables you to connect any NetApp platform to Microsoft M365 Copilot without 
                the need to migrate or rearchitect your existing data architecture.</p>
                <p className="text-muted-foreground"><b>NetApp Neo for M365 Copilot is currently 
                  in Private Preview. This means that the connector is not yet fully supported 
                  and may have some limitations. The connector requires a license to activate. 
                  You can request access to the connector by joining the Early Access Program (EAP).</b></p>
                <p><h3 className="text-lg font-semibold">Key Features</h3>
                <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>OCR and Optimized Extraction – automatically extracts accurate text from 
                    complex documents, making search and discovery faster (the only connector 
                    offering this)</li>
                  <li>GPU Support – leverages GPU acceleration for 2–5× faster data extraction 
                    and conversion (a world-first for a Copilot connector)</li>
                  <li>Containerized Deployment – deploys in under three minutes</li>
                  <li>Multiple Source Support – handles SMB file shares (v3.1.1–v2.0), including ANF, AWS FSxN, 
                    GCVN, CVO, ONTAP-based systems (FAS, AFF, Select, etc.), and any compatible non-NetApp share</li>
                  <li>No Data Migration Required – connects existing NetApp storage to M365 Copilot</li>
                  <li>Item-Level Permissioning – preserves permissions when transferring converted files to Microsoft Graph</li>
                  <li>API Interface – RESTful API simplifies integration and management, replacing the M365 Search and Intelligence UI</li>
                  <li>Enhanced Filtering – filters by file type, size, and date</li>
                  <li>Parallelization – uses multiple threads for faster extraction, conversion, and transfer</li>
                  <li>Large Document Chunking – splits large files for ingestion beyond the 3.8 MB Microsoft Graph limit</li>
                  <li>Offline Licensing – licenses without internet connectivity</li>
                </ul></p>
                <p><h3 className="text-lg font-semibold">Getting Started</h3>
                <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>With the <a href="https://github.com/NetApp/Innovation-Labs/blob/main/netapp-neo/USER_QUICKSTART_M365.md"
                  rel="noopener noreferrer" target="_blank" className="text-muted-foreground">Neo v3.x User Quickstart for M365</a> guide for a step-by-step guide to 
                    deploying the connector and connecting your first share.</li>
                  <li>With the <a href="https://github.com/NetApp/Innovation-Labs/blob/main/netapp-neo/DEPLOY-V2.md"
                  rel="noopener noreferrer" target="_blank" className="text-muted-foreground">Neo v2.x (phasing out) User Quickstart for M365</a> guide for a step-by-step 
                    guide to deploying the connector and connecting your first share.</li>
                </ul></p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-xl">Get Help</AccordionTrigger>
              <AccordionContent>
                <p>If you need assistance, please reach out to the Innovation-Labs team via your NetApp representative
                  or via a <a href="https://github.com/NetApp/Innovation-Labs/issues" target="_blank" rel="noopener noreferrer" className="text-muted-foreground">GitHub issue</a>.</p><br/>
                <p>We also have a two resources found helpful:
                  <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                    <li>Most frequently asked questions are available in our <a href="https://github.com/NetApp/Innovation-Labs/blob/main/netapp-neo/FAQ.md" target="_blank" rel="noopener noreferrer" className="text-muted-foreground">NEO FAQ</a></li>
                    <li>All relevant security information is available in the <a href="https://github.com/NetApp/Innovation-Labs/blob/main/netapp-neo/SECURITY.md" target="_blank" rel="noopener noreferrer" className="text-muted-foreground">Security Information</a> document.</li>
                  </ul>
                </p>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
          </div>
        </div>
      </div>
    </div>
    </SidebarInset>
    </SidebarProvider>
      
  )
}
