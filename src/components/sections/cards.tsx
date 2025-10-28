import {
  Card,
  // CardAction,
  CardDescription,
  CardHeader,
  // CardTitle,
} from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { 
//   Dialog, 
//   DialogContent, 
//   DialogDescription, 
//   DialogFooter, 
//   DialogHeader, 
//   DialogTitle 
// } from "@/components/ui/dialog"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { IconRefresh } from "@tabler/icons-react"

// import { useEffect, useState, useCallback } from "react"


export function SectionCards() {

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Health</CardDescription>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>License</CardDescription>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Version</CardDescription>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Latest</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}