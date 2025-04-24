"use client"

import { SpeedTest } from "./speed-test"
import { IpScanner } from "./ip-scanner"
import { NpmScanner } from "./npm-scanner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function NetworkTestDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Network Testing Tools</h1>
        <p className="text-muted-foreground">
          Comprehensive network analysis, speed testing, and security scanning tools
        </p>
      </div>

      <Tabs defaultValue="speed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="speed">Speed Test</TabsTrigger>
          <TabsTrigger value="ip">IP Scanner</TabsTrigger>
          <TabsTrigger value="npm">NPM Security</TabsTrigger>
        </TabsList>

        <TabsContent value="speed">
          <SpeedTest />
        </TabsContent>

        <TabsContent value="ip">
          <IpScanner />
        </TabsContent>

        <TabsContent value="npm">
          <NpmScanner />
        </TabsContent>
      </Tabs>
    </div>
  )
}