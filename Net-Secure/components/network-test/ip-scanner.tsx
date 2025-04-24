"use client"

import { useState } from "react"
import { Shield, Search, Lock, AlertTriangle, Globe } from "lucide-react"
import { AnimatedCard } from "../ui/animated-card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Alert } from "../ui/alert"
import { Progress } from "../ui/progress"
import { Badge } from "../ui/badge"
import { apiClient } from "@/lib/api-client"

interface ScanResults {
  ip?: string
  ports?: {
    openPorts: string[]
    services: Array<{ port: string; service: string }>
  }
  geolocation?: {
    country: string
    city: string
    isp: string
    organization: string
  }
  firewall?: {
    firewallDetected: boolean
    filtered: string[]
    rules: string[]
  }
  dns?: {
    records: Array<{
      type: string
      value: string
    }>
    reverseDns?: string
  }
}

export function IpScanner() {
  const [host, setHost] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanResults, setScanResults] = useState<ScanResults>({})
  const [progress, setProgress] = useState(0)

  const runIpScan = async () => {
    setIsLoading(true)
    setError(null)
    setProgress(0)
    
    try {
      // Get target IP - either entered IP or current machine's
      setProgress(10)
      const targetIp = host || (await apiClient.getIpAddress()).ip
      setScanResults(prev => ({ ...prev, ip: targetIp }))

      // Run all scans in parallel
      setProgress(20)
      const [ports, geoInfo, firewall, dnsInfo] = await Promise.all([
        apiClient.scanPorts(targetIp).then(res => {
          setProgress(p => p + 20)
          return res
        }),
        apiClient.getGeolocation(targetIp).then(res => {
          setProgress(p => p + 20)
          return res
        }),
        apiClient.checkFirewall(targetIp).then(res => {
          setProgress(p => p + 20)
          return res
        }),
        apiClient.getDnsInfo(targetIp).then(res => {
          setProgress(p => p + 20)
          return res
        })
      ])

      setScanResults({
        ip: targetIp,
        ports,
        geolocation: geoInfo,
        firewall,
        dns: dnsInfo
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'IP scan failed')
    } finally {
      setIsLoading(false)
      setProgress(100)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">IP Scanner</h2>
          <p className="text-sm text-muted-foreground">
            Analyze IP addresses, detect open ports, and gather network information
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Enter IP address (leave empty for current IP)"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="w-[300px]"
          />
          <Button onClick={runIpScan} disabled={isLoading}>
            {isLoading ? "Scanning..." : "Start Scan"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Scan in progress...</div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {scanResults.ip && (
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatedCard
            icon={<Globe className="h-5 w-5 text-primary" />}
            title="IP Information"
            description="Geolocation and network details"
            delay={0.1}
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Target IP: {scanResults.ip}</h4>
                {scanResults.geolocation && (
                  <div className="space-y-1 text-sm">
                    <div>Location: {scanResults.geolocation.city}, {scanResults.geolocation.country}</div>
                    <div>ISP: {scanResults.geolocation.isp}</div>
                    <div>Organization: {scanResults.geolocation.organization}</div>
                  </div>
                )}
              </div>
              {scanResults.dns && (
                <div>
                  <h4 className="font-medium mb-2">DNS Information</h4>
                  <div className="space-y-1 text-sm">
                    {scanResults.dns.reverseDns && (
                      <div>Hostname: {scanResults.dns.reverseDns}</div>
                    )}
                    {scanResults.dns.records.map((record, index) => (
                      <div key={index}>
                        {record.type}: {record.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnimatedCard>

          <AnimatedCard
            icon={<Search className="h-5 w-5 text-primary" />}
            title="Port Scan"
            description="Open ports and running services"
            delay={0.2}
          >
            {scanResults.ports ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Open Ports: {scanResults.ports.openPorts.length}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {scanResults.ports.openPorts.map((port) => (
                      <Badge key={port} variant="outline">
                        Port {port}
                      </Badge>
                    ))}
                  </div>
                </div>
                {scanResults.ports.services.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Running Services</h4>
                    <div className="space-y-1 text-sm">
                      {scanResults.ports.services.map(({ port, service }) => (
                        <div key={port}>
                          {port}: {service}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No port scan results yet</div>
            )}
          </AnimatedCard>

          <AnimatedCard
            icon={<Shield className="h-5 w-5 text-primary" />}
            title="Firewall Analysis"
            description="Firewall detection and configuration"
            delay={0.3}
          >
            {scanResults.firewall ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className={`font-semibold ${
                    scanResults.firewall.firewallDetected ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {scanResults.firewall.firewallDetected ? 'Firewall Detected' : 'No Firewall Detected'}
                  </div>
                </div>

                {scanResults.firewall.filtered.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Filtered Ports</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {scanResults.firewall.filtered.map((port) => (
                        <Badge key={port} variant="outline">
                          {port}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {scanResults.firewall.rules.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Detected Rules</h4>
                    <ul className="text-sm space-y-1">
                      {scanResults.firewall.rules.map((rule, index) => (
                        <li key={index}>• {rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No firewall analysis results yet</div>
            )}
          </AnimatedCard>
        </div>
      )}
    </div>
  )
}