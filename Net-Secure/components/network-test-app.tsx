"use client"

import { useState, useEffect } from "react"
import { Wifi, Upload, Download, Timer, RefreshCcw } from "lucide-react"
import { AnimatedCard } from "./ui/animated-card"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { Alert } from "./ui/alert"
import { apiClient } from "@/lib/api-client"
import { formatBytes, formatSpeed } from "@/lib/utils"

export function NetworkTestApp() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<{
    download?: number
    upload?: number
    ping?: number
    timestamp?: string
    jitter?: number
    packetLoss?: number
  }>({})
  const [progress, setProgress] = useState(0)

  const runSpeedTest = async () => {
    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      // Ping test
      setProgress(10)
      const { pingTime } = await apiClient.ping()
      setTestResults(prev => ({ ...prev, ping: pingTime }))
      
      // Run multiple ping tests to calculate jitter
      setProgress(20)
      const pingTimes: number[] = []
      for (let i = 0; i < 5; i++) {
        const { pingTime } = await apiClient.ping()
        pingTimes.push(pingTime)
        setProgress(20 + (i + 1) * 4)
      }
      
      // Calculate jitter (variation in ping times)
      const jitter = Math.round(calculateJitter(pingTimes))
      setTestResults(prev => ({ ...prev, jitter }))

      // Run download and upload speed tests
      setProgress(40)
      const results = await apiClient.startSpeedTest()
      setProgress(90)

      // Calculate packet loss through multiple small requests
      setProgress(95)
      const packetLoss = await measurePacketLoss()
      
      setProgress(100)
      setTestResults(prev => ({
        ...prev,
        download: results.download,
        upload: results.upload,
        packetLoss,
        timestamp: results.timestamp
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speed test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateJitter = (pingTimes: number[]) => {
    const differences = pingTimes.slice(1).map((time, i) => Math.abs(time - pingTimes[i]))
    return differences.reduce((sum, diff) => sum + diff, 0) / differences.length
  }

  const measurePacketLoss = async () => {
    const totalPackets = 10
    let successfulPackets = 0

    for (let i = 0; i < totalPackets; i++) {
      try {
        await fetch('https://www.cloudflare.com/cdn-cgi/trace', { 
          timeout: 1000 
        })
        successfulPackets++
      } catch {} // Ignore failures
    }

    return Math.round((1 - successfulPackets / totalPackets) * 100)
  }

  const testFileUpload = async (file: File) => {
    try {
      setIsLoading(true)
      setProgress(0)
      
      // Start with a quick latency test
      setProgress(10)
      const { pingTime } = await apiClient.ping()
      setTestResults(prev => ({ ...prev, ping: pingTime }))

      // Measure upload speed
      setProgress(20)
      const chunkSize = 1024 * 1024 // 1MB chunks
      const totalSize = file.size
      let uploadedSize = 0

      while (uploadedSize < totalSize) {
        const chunk = file.slice(uploadedSize, uploadedSize + chunkSize)
        const result = await apiClient.uploadFile(new File([chunk], file.name))
        uploadedSize += chunkSize
        
        const progress = Math.min(90, Math.round((uploadedSize / totalSize) * 100))
        setProgress(progress)
      }

      setProgress(100)
      const speedMbps = (totalSize * 8) / (Date.now() - Number(testResults.timestamp)) // Convert to Mbps
      setTestResults(prev => ({
        ...prev,
        upload: speedMbps,
        timestamp: new Date().toISOString()
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload test failed')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Clear results after 5 minutes to ensure fresh data
    const timer = setTimeout(() => {
      setTestResults({})
    }, 5 * 60 * 1000)

    return () => clearTimeout(timer)
  }, [testResults])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Network Speed Test</h2>
        <p className="text-sm text-muted-foreground">
          Test your network speed and latency
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <Button onClick={runSpeedTest} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Start Speed Test
            </>
          )}
        </Button>
        <input
          type="file"
          id="upload-test"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) testFileUpload(file)
          }}
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('upload-test')?.click()}
          disabled={isLoading}
        >
          <Upload className="mr-2 h-4 w-4" />
          Test Upload
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

      <div className="grid gap-6 md:grid-cols-3">
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
          title="Ping"
          description="Network response time"
          delay={0.3}
        >
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {testResults.ping ? `${testResults.ping} ms` : "-- ms"}
            </div>
            {testResults.ping && (
              <div className="text-xs text-muted-foreground">
                {testResults.ping < 50 ? "Excellent" :
                 testResults.ping < 100 ? "Good" :
                 testResults.ping < 150 ? "Fair" : "Poor"} latency
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>

      {testResults.timestamp && (
        <div className="text-xs text-muted-foreground">
          Last tested: {new Date(testResults.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  )
}

