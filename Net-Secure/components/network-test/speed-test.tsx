"use client"

import { useState, useEffect } from "react"
import { Wifi, Upload, Download, Timer, RefreshCcw, ArrowUpDown } from "lucide-react"
import { AnimatedCard } from "../ui/animated-card"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { Alert } from "../ui/alert"
import { apiClient } from "@/lib/api-client"
import { formatBytes, formatSpeed } from "@/lib/utils"

interface TestResults {
  download?: number
  upload?: number
  ping?: number
  jitter?: number
  timestamp?: string
  location?: string
  isp?: string
}

export function SpeedTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResults>({})
  const [progress, setProgress] = useState(0)

  const runSpeedTest = async () => {
    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      // Get connection info
      setProgress(10)
      const { isp, location } = await apiClient.getConnectionInfo()
      setTestResults(prev => ({ ...prev, isp, location }))

      // Test latency
      setProgress(20)
      const startTime = Date.now()
      const { startTime: serverTime, jitter } = await apiClient.ping()
      const pingTime = Date.now() - startTime
      setTestResults(prev => ({ 
        ...prev, 
        ping: pingTime,
        jitter 
      }))

      // Run speed test
      setProgress(30)
      const results = await apiClient.startSpeedTest(
        (progress) => setProgress(30 + progress * 0.7)
      )
      setProgress(100)

      setTestResults(prev => ({
        ...prev,
        download: results.download,
        upload: results.upload,
        timestamp: results.timestamp
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speed test failed')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Clear results after 30 minutes to ensure fresh data
    const timer = setTimeout(() => {
      setTestResults({})
    }, 30 * 60 * 1000)

    return () => clearTimeout(timer)
  }, [testResults])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Network Speed Test</h2>
          <p className="text-sm text-muted-foreground">
            Measure your network performance including download, upload speeds and latency
          </p>
        </div>

        <Button onClick={runSpeedTest} disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Start Test
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <span>{error}</span>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Test in progress...</div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AnimatedCard
          icon={<Download className="h-5 w-5 text-primary" />}
          title="Download Speed"
          description="Maximum download speed achieved"
          delay={0.1}
        >
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {testResults.download ? formatSpeed(testResults.download) : "-- Mbps"}
            </div>
            {testResults.download && (
              <div className="text-xs text-muted-foreground">
                {formatBytes((testResults.download * 1000000) / 8)}/s
              </div>
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard
          icon={<Upload className="h-5 w-5 text-primary" />}
          title="Upload Speed"
          description="Maximum upload speed achieved"
          delay={0.2}
        >
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {testResults.upload ? formatSpeed(testResults.upload) : "-- Mbps"}
            </div>
            {testResults.upload && (
              <div className="text-xs text-muted-foreground">
                {formatBytes((testResults.upload * 1000000) / 8)}/s
              </div>
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard
          icon={<Timer className="h-5 w-5 text-primary" />}
          title="Latency"
          description="Network response time"
          delay={0.3}
        >
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {testResults.ping ? `${testResults.ping} ms` : "-- ms"}
            </div>
            {testResults.ping && (
              <div className="text-xs text-muted-foreground">
                Jitter: {testResults.jitter || '--'} ms
              </div>
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard
          icon={<Wifi className="h-5 w-5 text-primary" />}
          title="Connection Info"
          description="Network provider details"
          delay={0.4}
        >
          <div className="mt-2 space-y-1 text-sm">
            <div>ISP: {testResults.isp || '--'}</div>
            <div>Location: {testResults.location || '--'}</div>
            {testResults.timestamp && (
              <div className="text-xs text-muted-foreground">
                Last tested: {new Date(testResults.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}