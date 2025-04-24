"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface ScanError {
  message: string;
}

interface ScanResults {
  nmapScan?: any;
  portScan?: any;
  serviceScan?: any;
  sslCheck?: any;
  vulnScan?: any;
  firewallCheck?: any;
  error?: string;
}

export function SecurityScansContainer() {
  const [host, setHost] = useState<string>("")
  const [results, setResults] = useState<ScanResults>({})
  const [scanning, setScanning] = useState<boolean>(false)

  const handleNmapScan = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const result = await apiClient.runNmapScan()
      setResults(prev => ({ ...prev, nmapScan: result.data }))
    } catch (err) {
      setResults(prev => ({ ...prev, error: (err as ScanError).message }))
    }
  }

  const handlePortScan = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const result = await apiClient.scanPorts(host)
      setResults(prev => ({ ...prev, portScan: result.data }))
    } catch (err) {
      setResults(prev => ({ ...prev, error: (err as ScanError).message }))
    }
  }

  const handleServiceScan = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const result = await apiClient.scanServices()
      setResults(prev => ({ ...prev, serviceScan: result.data }))
    } catch (err) {
      setResults(prev => ({ ...prev, error: (err as ScanError).message }))
    }
  }

  const handleSSLCheck = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const result = await apiClient.checkSSL(host)
      setResults(prev => ({ ...prev, sslCheck: result.data }))
    } catch (err) {
      setResults(prev => ({ ...prev, error: (err as ScanError).message }))
    }
  }

  const handleVulnScan = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const result = await apiClient.scanVulnerabilities()
      setResults(prev => ({ ...prev, vulnScan: result.data }))
    } catch (err) {
      setResults(prev => ({ ...prev, error: (err as ScanError).message }))
    }
  }

  const handleFirewallCheck = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const result = await apiClient.checkFirewall(host)
      setResults(prev => ({ ...prev, firewallCheck: result.data }))
    } catch (err) {
      setResults(prev => ({ ...prev, error: (err as ScanError).message }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Security Scans</h2>
        <p className="text-sm text-muted-foreground">
          Run comprehensive security scans to identify vulnerabilities and security issues
        </p>
      </div>

      <div className="flex space-x-3">
        <Input
          placeholder="Enter hostname or IP (leave empty for current IP)"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          disabled={scanning}
        />
        <Button onClick={runSecurityScans} disabled={scanning}>
          {scanning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            "Run Scans"
          )}
        </Button>
      </div>

      {results.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>{results.error}</span>
        </Alert>
      )}

      {scanning && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Scans in progress...</div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SecurityScans results={results} />
      </div>
    </div>
  )
}