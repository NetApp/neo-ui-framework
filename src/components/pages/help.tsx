// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { 
  IconLogin, 
  IconRefresh,
  IconExternalLink,
  IconQuestionMark,
  IconShield,
  IconBook,
} from "@tabler/icons-react"

import { 
  Button 
} from "@/components/ui/button"

export default function Help() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">

            <Card className="mb-6 overflow-hidden border-border/60 bg-gradient-to-br from-background via-muted/30 to-background">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Neo UI Help Center</Badge>
                  <Badge variant="secondary">Private Preview</Badge>
                </div>
                <CardTitle className="text-2xl tracking-tight md:text-3xl">Operate Neo UI with Confidence</CardTitle>
                <CardDescription className="max-w-3xl text-sm md:text-base">
                  Find onboarding guidance, key capabilities, and support resources for NetApp Neo for M365 Copilot.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pb-6 md:grid-cols-3">
                <Button asChild variant="outline" className="justify-between">
                  <a href="https://netapp.github.io/Innovation-Labs/projects/mlai/neo/core/quick-start.html" target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-2"><IconBook className="size-4" /> Quickstart</span>
                    <IconExternalLink className="size-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <a href="https://netapp.github.io/Innovation-Labs/projects/mlai/neo/core/troubleshooting.html" target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-2"><IconQuestionMark className="size-4" /> Troubleshooting</span>
                    <IconExternalLink className="size-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <a href="https://netapp.github.io/Innovation-Labs/projects/mlai/neo/core/security.html" target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-2"><IconShield className="size-4" /> Security</span>
                    <IconExternalLink className="size-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full rounded-xl border px-4 md:px-6" defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-base font-semibold md:text-lg">Using Neo UI</AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm md:text-base">
                  <p>
                    Neo UI is a stateless web interface for managing a Neo instance: configure shares, schedule crawls,
                    search content, monitor status, and review logs.
                  </p>
                  <p className="font-medium">To get started:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>
                      Click <Button variant="outline" size="icon" className="mx-1 hidden sm:inline-flex"><IconLogin className="size-4" /></Button>
                      in the top-right or bottom-left corner and sign in with admin credentials.
                    </li>
                    <li>
                      Use <Button variant="outline" size="icon" className="mx-1 hidden sm:inline-flex"><IconRefresh className="size-4" /></Button>
                      in the header to refresh page data.
                    </li>
                    <li>When your token expires, sign in again to continue.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-base font-semibold md:text-lg">About NetApp Neo</AccordionTrigger>
                <AccordionContent className="space-y-5 text-sm md:text-base">
                  <p>
                    NetApp Neo for M365 Copilot is a containerized solution that connects NetApp data platforms to
                    Microsoft M365 Copilot without requiring data migration or architecture changes.
                  </p>
                  <p className="rounded-md border bg-muted/40 p-3 text-muted-foreground">
                    <span className="font-semibold text-foreground">Preview notice:</span> NetApp Neo for M365 Copilot is currently in
                    Private Preview and requires a valid license. You can request access via the Early Access Program (EAP).
                  </p>

                  <div>
                    <h3 className="text-base font-semibold md:text-lg">Key Features</h3>
                    <ul className="mt-3 ml-6 list-disc space-y-2">
                      <li>OCR and optimized extraction for complex documents</li>
                      <li>GPU acceleration for faster extraction and conversion</li>
                      <li>Containerized deployment in minutes</li>
                      <li>Support for SMB file shares across NetApp and compatible non-NetApp sources</li>
                      <li>No data migration required</li>
                      <li>Item-level permission preservation during Graph transfer</li>
                      <li>REST API-driven integration and management</li>
                      <li>Filtering by file type, size, and date</li>
                      <li>Parallelized extraction, conversion, and transfer</li>
                      <li>Large-document chunking for Graph ingestion limits</li>
                      <li>Offline licensing support</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold md:text-lg">Getting Started</h3>
                    <ul className="mt-3 ml-6 list-disc space-y-2">
                      <li>
                        Follow the
                        <a
                          href="https://github.com/NetApp/Innovation-Labs/blob/main/netapp-neo/USER_QUICKSTART_M365.md"
                          rel="noopener noreferrer"
                          target="_blank"
                          className="ml-1 underline underline-offset-4"
                        >
                          Neo v3.x User Quickstart for M365
                        </a>
                        .
                      </li>
                      <li>
                        For legacy deployments, use
                        <a
                          href="https://github.com/NetApp/Innovation-Labs/blob/main/netapp-neo/DEPLOY-V2.md"
                          rel="noopener noreferrer"
                          target="_blank"
                          className="ml-1 underline underline-offset-4"
                        >
                          Neo v2.x User Quickstart for M365
                        </a>
                        .
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-base font-semibold md:text-lg">Support Resources</AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm md:text-base">
                  <p>
                    Need assistance? Reach out via your NetApp representative or open a
                    <a
                      href="https://github.com/NetApp/Innovation-Labs/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 underline underline-offset-4"
                    >
                      GitHub issue
                    </a>
                    .
                  </p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>
                      Review known issues and resolution steps in
                      <a
                        href="https://netapp.github.io/Innovation-Labs/projects/mlai/neo/core/troubleshooting.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 underline underline-offset-4"
                      >
                        Troubleshooting
                      </a>
                      .
                    </li>
                    <li>
                      Find security and disclosure information in
                      <a
                        href="https://netapp.github.io/Innovation-Labs/projects/mlai/neo/core/security.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 underline underline-offset-4"
                      >
                        Security Information
                      </a>
                      .
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
}
