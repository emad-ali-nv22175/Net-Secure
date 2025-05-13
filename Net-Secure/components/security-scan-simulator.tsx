"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

const fakeResults = [
  { label: "Open Port: 22 (SSH)", severity: "High" },
  { label: "Open Port: 80 (HTTP)", severity: "Medium" },
  { label: "SSL Certificate: Valid", severity: "Good" },
  { label: "Outdated Library: jQuery 1.7.2", severity: "High" },
  { label: "X-Frame-Options Header: Missing", severity: "Medium" },
  { label: "Content Security Policy: Present", severity: "Good" },
  { label: "Directory Listing: Disabled", severity: "Good" },
  { label: "Server Banner: Exposed (nginx/1.14.0)", severity: "Low" },
]

const followUpQuestions = [
  "Are all open ports necessary for your application?",
  "Are all libraries and dependencies up to date?",
  "Is your SSL certificate valid and not expiring soon?",
  "Are security headers like X-Frame-Options and CSP set?",
  "Is sensitive server information hidden from public view?",
]

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "High":
      return <XCircle className="text-red-600 h-5 w-5" />
    case "Medium":
      return <AlertTriangle className="text-yellow-500 h-5 w-5" />
    case "Low":
      return <AlertTriangle className="text-yellow-400 h-5 w-5" />
    case "Good":
      return <CheckCircle className="text-green-600 h-5 w-5" />
    default:
      return null
  }
}

export default function SecurityScanSimulator() {
  const [scanning, setScanning] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleScan = () => {
    setScanning(true)
    setShowResults(false)
    setTimeout(() => {
      setScanning(false)
      setShowResults(true)
    }, 2000)
  }

  return (
    <Card className="max-w-lg mx-auto mt-10 bg-background shadow-lg border border-neutral-200 dark:border-neutral-800 rounded-xl">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Shield className="h-7 w-7 text-primary" />
        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Run Security Scan
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <Button
          onClick={handleScan}
          disabled={scanning}
          className="mb-6 w-full text-lg font-semibold py-3 rounded-lg"
        >
          {scanning ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="animate-spin h-5 w-5" /> Scanning...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <Shield className="h-5 w-5" /> Run Security Scan
            </span>
          )}
        </Button>
        {showResults && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Scan Results</h3>
              <ul className="space-y-2">
                {fakeResults.map((result, idx) => (
                  <li key={idx} className="flex items-center gap-3 p-2 rounded-md bg-neutral-100 dark:bg-neutral-800">
                    {getSeverityIcon(result.severity)}
                    <span className="font-medium flex-1">{result.label}</span>
                    <span className={
                      result.severity === "High"
                        ? "text-red-600 font-bold"
                        : result.severity === "Medium"
                        ? "text-yellow-600 font-bold"
                        : result.severity === "Low"
                        ? "text-yellow-500 font-semibold"
                        : "text-green-600 font-semibold"
                    }>
                      {result.severity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator className="my-4" />
            <div>
              <h4 className="text-base font-semibold mb-2">Security Questions to Consider</h4>
              <ul className="list-disc pl-6 space-y-1 text-neutral-700 dark:text-neutral-300">
                {followUpQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
