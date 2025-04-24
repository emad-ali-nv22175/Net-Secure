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
  const [currentOperation, setCurrentOperation] = useState<string>("")
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResults, setScanResults] = useState<{
    ports?: {
      openPorts: string[];
      services: Array<{ port: string; service: string; version?: string }>;
    };
    ssl?: {
      grade: string;
      protocol: string;
      issues: string[];
      certDetails: {
        subject: string;
        issuer: string;
        validFrom: string;
        validTo: string;
        keySize: string;
        signatureAlgorithm: string;
      };
    };
    firewall?: {
      firewallDetected: boolean;
      filtered: string[];
      rules: string[];
    };
    vulnerabilities?: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      findings: Array<{
        severity: string;
        title: string;
        description: string;
        solution?: string;
      }>;
    };
  }>({});

  const runNetworkAnalysis = async () => {
    setIsLoading(true)
    setError(null)
    setScanProgress(0)
    
    try {
      // If no host provided, get current IP
      if (!host) {
        setCurrentOperation("Detecting IP address...")
        const { ip } = await apiClient.getIpAddress()
        setHost(ip)
      }

      // Run port scan
      setCurrentOperation("Scanning ports...")
      setScanProgress(20)
      const ports = await apiClient.scanPorts(host)

      // SSL/TLS analysis
      setCurrentOperation("Analyzing SSL/TLS configuration...")
      setScanProgress(40)
      const ssl = host ? await apiClient.checkSSL(host) : null

      // Firewall detection
      setCurrentOperation("Detecting firewall...")
      setScanProgress(60)
      const firewall = await apiClient.checkFirewall(host)

      // Vulnerability scan
      setCurrentOperation("Scanning for vulnerabilities...")
      setScanProgress(80)
      const vulnScan = await apiClient.scanVulnerabilities(host)

      setScanProgress(100)
      setScanResults({
        ports: ports.data.ports,
        ssl: ssl?.data.ssl,
        firewall: firewall.data.firewall,
        vulnerabilities: vulnScan.data.vulnerabilities as any // Type assertion needed due to transformation
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network analysis failed')
    } finally {
      setIsLoading(false)
      setCurrentOperation("")
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
          <Progress value={scanProgress} className="w-full" />
          <div className="text-sm text-muted-foreground">{currentOperation}</div>
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
              <div className="grid grid-cols-4 gap-2">
                {/* Summary boxes for each severity level */}
                <div className="bg-red-500/10 p-2 rounded">
                  <div className="text-lg font-bold text-red-500">{scanResults.vulnerabilities.critical}</div>
                  <div className="text-xs text-muted-foreground">Critical</div>
                </div>
                <div className="bg-orange-500/10 p-2 rounded">
                  <div className="text-lg font-bold text-orange-500">{scanResults.vulnerabilities.high}</div>
                  <div className="text-xs text-muted-foreground">High</div>
                </div>
                <div className="bg-yellow-500/10 p-2 rounded">
                  <div className="text-lg font-bold text-yellow-500">{scanResults.vulnerabilities.medium}</div>
                  <div className="text-xs text-muted-foreground">Medium</div>
                </div>
                <div className="bg-blue-500/10 p-2 rounded">
                  <div className="text-lg font-bold text-blue-500">{scanResults.vulnerabilities.low}</div>
                  <div className="text-xs text-muted-foreground">Low</div>
                </div>
              </div>

              {scanResults.vulnerabilities.findings.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Detailed Findings</h4>
                  {scanResults.vulnerabilities.findings.map((finding, index) => (
                    <div key={index} className={`p-3 rounded border ${
                      finding.severity === 'critical' ? 'border-red-500/20 bg-red-500/5' :
                      finding.severity === 'high' ? 'border-orange-500/20 bg-orange-500/5' :
                      finding.severity === 'medium' ? 'border-yellow-500/20 bg-yellow-500/5' :
                      'border-blue-500/20 bg-blue-500/5'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium">{finding.title}</h5>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          finding.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                          finding.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                          finding.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          {finding.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                      {finding.solution && (
                        <div className="text-sm">
                          <span className="font-medium">Recommendation: </span>
                          {finding.solution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-green-500 font-medium">No vulnerabilities found</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No vulnerability scan results yet</div>
          )}
        </AnimatedCard>
      </div>
    </div>
  )
}

