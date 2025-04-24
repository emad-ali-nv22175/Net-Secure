"use client"

import { useState } from "react"
import { Shield, Search, Wifi, Lock, AlertTriangle } from "lucide-react"
import { AnimatedCard } from "./ui/animated-card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Alert } from "./ui/alert"
import { Progress } from "./ui/progress"
import { apiClient } from "@/lib/api-client"

export function NetworkAnalyzer() {
  const [host, setHost] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanResults, setScanResults] = useState<{
    ports?: { openPorts: string[]; services: Array<{ port: string; service: string }> }
    ssl?: {
      grade: string
      protocol: string
      certificate: string
      issues: string[]
      certDetails: {
        subject: string
        issuer: string
        validFrom: string
        validTo: string
        keySize: string
        signatureAlgorithm: string
      }
    }
    firewall?: {
      firewallDetected: boolean
      filtered: string[]
      rules: string[]
    }
    vulnerabilities?: { vuln: string }
  }>({})

  const runNetworkAnalysis = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // If no host provided, get current IP
      if (!host) {
        const { ip } = await apiClient.getIpAddress()
        setHost(ip)
      }

      // Run all scans in parallel
      const [ports, ssl, firewall, vulnScan] = await Promise.all([
        apiClient.scanPorts(host),
        host ? apiClient.checkSSL(host) : Promise.resolve(null),
        apiClient.checkFirewall(host),
        apiClient.scanVulnerabilities()
      ])

      setScanResults({
        ports,
        ssl: ssl || undefined,
        firewall,
        vulnerabilities: vulnScan
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network analysis failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Network Security Analyzer</h2>
        <p className="text-sm text-muted-foreground">
          Analyze network security, detect vulnerabilities, and check SSL/TLS configuration
        </p>
      </div>

      <div className="flex space-x-3">
        <Input
          placeholder="Enter hostname or IP (leave empty for current IP)"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
        <Button onClick={runNetworkAnalysis} disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Start Analysis"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Analysis in progress...</div>
          <Progress value={45} className="w-full" />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Port Scan Results */}
        <AnimatedCard
          icon={<Search className="h-5 w-5 text-primary" />}
          title="Open Ports & Services"
          description="Discovered network services and open ports"
          delay={0.1}
        >
          {scanResults.ports ? (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Open Ports: {scanResults.ports.openPorts.length}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {scanResults.ports.openPorts.map((port) => (
                    <div key={port} className="text-sm px-2 py-1 bg-secondary rounded">
                      Port {port}
                    </div>
                  ))}
                </div>
              </div>
              {scanResults.ports.services.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Running Services</h4>
                  <div className="space-y-1">
                    {scanResults.ports.services.map(({ port, service }) => (
                      <div key={port} className="text-sm">
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

        {/* SSL/TLS Analysis */}
        <AnimatedCard
          icon={<Lock className="h-5 w-5 text-primary" />}
          title="SSL/TLS Security"
          description="Certificate and protocol analysis"
          delay={0.2}
        >
          {scanResults.ssl ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={`text-2xl font-bold ${
                  scanResults.ssl.grade === 'A+' ? 'text-green-500' :
                  scanResults.ssl.grade === 'A' ? 'text-green-400' :
                  scanResults.ssl.grade === 'B' ? 'text-yellow-500' :
                  scanResults.ssl.grade === 'C' ? 'text-orange-500' :
                  'text-red-500'
                }`}>
                  {scanResults.ssl.grade}
                </div>
                <div className="text-sm">
                  Protocol: {scanResults.ssl.protocol}
                </div>
              </div>

              {scanResults.ssl.issues.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Security Issues</h4>
                  <ul className="text-sm space-y-1">
                    {scanResults.ssl.issues.map((issue, index) => (
                      <li key={index} className="text-destructive">• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-sm space-y-1">
                <h4 className="font-medium">Certificate Details</h4>
                <div>Issued to: {scanResults.ssl.certDetails.subject}</div>
                <div>Issued by: {scanResults.ssl.certDetails.issuer}</div>
                <div>Valid until: {new Date(scanResults.ssl.certDetails.validTo).toLocaleDateString()}</div>
                <div>Key size: {scanResults.ssl.certDetails.keySize} bits</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {host ? "SSL/TLS analysis not available" : "Enter a hostname to analyze SSL/TLS"}
            </div>
          )}
        </AnimatedCard>

        {/* Firewall Analysis */}
        <AnimatedCard
          icon={<Shield className="h-5 w-5 text-primary" />}
          title="Firewall Detection"
          description="Firewall presence and configuration"
          delay={0.3}
        >
          {scanResults.firewall ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`font-semibold ${scanResults.firewall.firewallDetected ? 'text-green-500' : 'text-yellow-500'}`}>
                  {scanResults.firewall.firewallDetected ? 'Firewall Detected' : 'No Firewall Detected'}
                </div>
              </div>

              {scanResults.firewall.filtered.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Filtered Ports</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {scanResults.firewall.filtered.map((port) => (
                      <div key={port} className="text-sm px-2 py-1 bg-secondary rounded">
                        {port}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanResults.firewall.rules.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Detected Rules</h4>
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

        {/* Vulnerability Scan */}
        <AnimatedCard
          icon={<AlertTriangle className="h-5 w-5 text-primary" />}
          title="Vulnerability Scan"
          description="Security vulnerabilities assessment"
          delay={0.4}
        >
          {scanResults.vulnerabilities ? (
            <div className="space-y-3">
              <pre className="text-xs whitespace-pre-wrap bg-secondary/50 p-3 rounded">
                {scanResults.vulnerabilities.vuln}
              </pre>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No vulnerability scan results yet</div>
          )}
        </AnimatedCard>
      </div>
    </div>
  )
}

