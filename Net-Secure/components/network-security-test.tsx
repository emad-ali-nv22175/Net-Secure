"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, ShieldX } from "lucide-react"

export default function NetworkSecurityTest() {
  const [status, setStatus] = useState<null | "secure" | "not-secure">(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const runTest = async () => {
    setLoading(true)
    setStatus(null)
    setMessage("")
    try {
      // Try to fetch a secure website
      const response = await fetch("https://google.com", { method: "HEAD" })
      if (response.ok && response.url.startsWith("https://")) {
        setStatus("secure")
        setMessage("Connection is secure (HTTPS detected and reachable)")
      } else {
        setStatus("not-secure")
        setMessage("Could not verify HTTPS or site unreachable.")
      }
    } catch (e) {
      setStatus("not-secure")
      setMessage("Network error: Unable to reach the site securely.")
    }
    setLoading(false)
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Network Security Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runTest} disabled={loading} className="mb-4">
          {loading ? "Testing..." : "Run Security Test"}
        </Button>
        {status === "secure" && (
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <ShieldCheck className="h-5 w-5" /> Secure
          </div>
        )}
        {status === "not-secure" && (
          <div className="flex items-center gap-2 text-red-600 font-semibold">
            <ShieldX className="h-5 w-5" /> Not Secure
          </div>
        )}
        {message && <div className="mt-2 text-sm text-muted-foreground">{message}</div>}
      </CardContent>
    </Card>
  )
}
