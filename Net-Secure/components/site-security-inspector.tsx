"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  Globe,
  Server,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SecurityTest {
  name: string
  status: "pass" | "fail" | "warn" | "pending"
  details: string
  recommendation: string | undefined
  severity: "low" | "medium" | "high"
}

export function SiteSecurityInspector() {
  const [url, setUrl] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTest, setCurrentTest] = useState("")
  const [tests, setTests] = useState<SecurityTest[]>([])
  const [error, setError] = useState<string | null>(null)

  const updateProgress = (value: number, testName: string) => {
    setProgress(value)
    setCurrentTest(testName)
  }

  const runSecurityTests = async () => {
    if (!url) {
      setError("Please enter a URL to scan")
      return
    }

    try {
      setIsScanning(true)
      setError(null)
      setTests([])
      setProgress(0)

      // Normalize URL
      const parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`)
      const normalizedUrl = parsedUrl.toString()
      
      // Initialize test results
      const securityTests: SecurityTest[] = []

      // Test 1: HTTPS Check
      updateProgress(5, "Checking HTTPS")
      const isHttps = parsedUrl.protocol === "https:"
      securityTests.push({
        name: "HTTPS Security",
        status: isHttps ? "pass" : "fail",
        severity: "high",
        details: isHttps ? "Connection uses secure HTTPS protocol" : "Connection uses insecure HTTP protocol",
        recommendation: isHttps ? undefined : "Implement HTTPS across your entire site to protect data in transit",
      })

      // Test 2: Basic connection test with real fetch
      updateProgress(10, "Testing connection...")
      const headers: Record<string, string> = {}
      let connectionSuccess = false

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`/api/proxy?url=${encodeURIComponent(normalizedUrl)}`, {
          method: "HEAD",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        connectionSuccess = true

        // Get headers from response
        if (response.headers) {
          response.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value
          })
        }
      } catch (err) {
        console.error("Connection test error:", err)
      }

      // Test 3: Security Headers Check
      updateProgress(30, "Checking security headers")
      
      const securityHeaders = {
        "strict-transport-security": {
          name: "HTTP Strict Transport Security (HSTS)",
          severity: "high",
        },
        "content-security-policy": {
          name: "Content Security Policy (CSP)",
          severity: "high",
        },
        "x-frame-options": {
          name: "X-Frame-Options",
          severity: "medium",
        },
        "x-content-type-options": {
          name: "X-Content-Type-Options",
          severity: "medium",
        },
        "referrer-policy": {
          name: "Referrer Policy",
          severity: "medium",
        },
        "permissions-policy": {
          name: "Permissions Policy",
          severity: "medium",
        },
      }

      Object.entries(securityHeaders).forEach(([header, info]) => {
        const hasHeader = headers[header]
        securityTests.push({
          name: info.name,
          status: hasHeader ? "pass" : "fail",
          severity: info.severity as "low" | "medium" | "high",
          details: hasHeader 
            ? `${info.name} is properly configured`
            : `${info.name} is missing`,
          recommendation: hasHeader 
            ? undefined 
            : `Implement ${info.name} header to enhance security`,
        })
      })

      // Test 4: SSL/TLS Version Check
      updateProgress(50, "Checking SSL/TLS configuration")
      const sslTest: SecurityTest = {
        name: "SSL/TLS Version",
        status: "pending",
        severity: "high",
        details: "",
        recommendation: undefined,
      }

      try {
        const sslResponse = await fetch(`/api/ssl-check?url=${encodeURIComponent(normalizedUrl)}`)
        const sslData = await sslResponse.json()
        
        if (sslData.minimumTLS === "1.2" || sslData.minimumTLS === "1.3") {
          sslTest.status = "pass"
          sslTest.details = `Site uses modern TLS ${sslData.minimumTLS}`
          sslTest.recommendation = undefined
        } else {
          sslTest.status = "fail"
          sslTest.details = "Site uses outdated SSL/TLS version"
          sslTest.recommendation = "Upgrade to TLS 1.2 or 1.3"
        }
      } catch (err) {
        sslTest.status = "warn"
        sslTest.details = "Could not determine SSL/TLS version"
        sslTest.recommendation = undefined
      }

      securityTests.push(sslTest)

      // Test 5: Mixed Content Check
      updateProgress(70, "Checking for mixed content")
      securityTests.push({
        name: "Mixed Content",
        status: isHttps && !headers["content-security-policy"]?.includes("upgrade-insecure-requests")
          ? "warn"
          : "pass",
        severity: "medium",
        details: "Checking for mixed content vulnerabilities",
        recommendation: "Implement upgrade-insecure-requests in CSP",
      })

      // Test 6: Common Vulnerabilities Check
      updateProgress(90, "Checking for known vulnerabilities")
      try {
        const vulnResponse = await fetch(`/api/vulnerability-check?url=${encodeURIComponent(normalizedUrl)}`)
        const vulnData = await vulnResponse.json()
        
        securityTests.push({
          name: "Known Vulnerabilities",
          status: vulnData.vulnerabilities.length > 0 ? "fail" : "pass",
          severity: "high",
          details: vulnData.vulnerabilities.length > 0
            ? `Found ${vulnData.vulnerabilities.length} potential vulnerabilities`
            : "No known vulnerabilities detected",
          recommendation: vulnData.vulnerabilities.length > 0
            ? "Review and patch identified vulnerabilities"
            : undefined,
        })
      } catch (err) {
        securityTests.push({
          name: "Known Vulnerabilities",
          status: "warn",
          severity: "high",
          details: "Could not complete vulnerability scan",
          recommendation: "Manual security audit recommended",
        })
      }

      setTests(securityTests)
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete security scan")
    } finally {
      setIsScanning(false)
    }
  }

  const getSeverityColor = (severity: SecurityTest["severity"]) => {
    switch (severity) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIcon = (status: SecurityTest["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warn":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <RefreshCw className="h-5 w-5 animate-spin" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Site Security Inspector</h2>
        <p className="text-sm text-muted-foreground">
          Analyze website security and identify potential vulnerabilities
        </p>
      </div>

      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Enter website URL (e.g., example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={runSecurityTests}
          disabled={isScanning}
          className="flex items-center gap-2"
        >
          {isScanning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Scan Site
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isScanning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{currentTest}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <AnimatePresence>
        {tests.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {tests.map((test, index) => (
              <motion.div
                key={test.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-card rounded-lg border space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {test.details}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={test.status === "pass" ? "default" : "outline"}
                    className={getSeverityColor(test.severity)}
                  >
                    {test.severity}
                  </Badge>
                </div>
                {test.recommendation && (
                  <div className="pl-7">
                    <p className="text-sm font-medium text-primary">
                      Recommendation:
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {test.recommendation}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Security Score</h3>
                  <p className="text-sm text-muted-foreground">
                    {tests.filter((t) => t.status === "pass").length} out of{" "}
                    {tests.length} checks passed
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

