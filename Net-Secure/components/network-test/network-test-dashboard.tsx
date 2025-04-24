"use client"

import { SpeedTest } from "./speed-test"
import { IpScanner } from "./ip-scanner"
import { NetworkTestErrorBoundary } from "./error-boundary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function NetworkTestDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Network Testing Tools</h1>
        <p className="text-muted-foreground">
          Comprehensive network analysis and speed testing tools
        </p>
      </div>

      <NetworkTestErrorBoundary>
        <Tabs defaultValue="speed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="speed">Speed Test</TabsTrigger>
            <TabsTrigger value="ip">IP Scanner</TabsTrigger>
          </TabsList>

          <TabsContent value="speed">
            <SpeedTest />
          </TabsContent>

          <TabsContent value="ip">
            <IpScanner />
          </TabsContent>
        </Tabs>
      </NetworkTestErrorBoundary>
    </div>
  )
}