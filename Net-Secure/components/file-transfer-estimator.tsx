"use client"

import { useState, useEffect } from "react"
import { Upload, Download, Clock } from "lucide-react"
import { AnimatedCard } from "./ui/animated-card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert } from "./ui/alert"
import { apiClient } from "@/lib/api-client"
import { formatBytes, formatDuration } from "@/lib/utils"

const sizeUnits = ["B", "KB", "MB", "GB", "TB"]

export function FileTransferEstimator() {
  const [fileSize, setFileSize] = useState<number>(1)
  const [sizeUnit, setSizeUnit] = useState<string>("MB")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [speeds, setSpeeds] = useState<{
    download?: number
    upload?: number
    timestamp?: string
  }>({})

  const measureSpeeds = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Test download and upload speeds
      const results = await apiClient.startSpeedTest()
      setSpeeds({
        download: results.download,
        upload: results.upload,
        timestamp: results.timestamp
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speed measurement failed')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTransferTime = (speedMbps: number) => {
    // Convert file size to bits
    const unitMultiplier = Math.pow(1024, sizeUnits.indexOf(sizeUnit))
    const sizeInBytes = fileSize * unitMultiplier
    const sizeInBits = sizeInBytes * 8

    // Calculate time in seconds (speed is in Mbps)
    const timeInSeconds = sizeInBits / (speedMbps * 1_000_000)
    return timeInSeconds
  }

  useEffect(() => {
    // Measure speeds on component mount
    measureSpeeds()
  }, [])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">File Transfer Time Calculator</h2>
        <p className="text-sm text-muted-foreground">
          Estimate upload and download times based on your network speed
        </p>
      </div>

      <div className="flex space-x-3">
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            value={fileSize}
            onChange={(e) => setFileSize(Number(e.target.value))}
            placeholder="File size"
          />
        </div>
        <Select value={sizeUnit} onValueChange={setSizeUnit}>
          <SelectTrigger>
            <SelectValue placeholder="Size unit" />
          </SelectTrigger>
          <SelectContent>
            {sizeUnits.map(unit => (
              <SelectItem key={unit} value={unit}>
                {unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={measureSpeeds} disabled={isLoading}>
          {isLoading ? "Testing..." : "Test Speed"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <span>{error}</span>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <AnimatedCard
          icon={<Download className="h-5 w-5 text-primary" />}
          title="Download Time"
          description="Estimated time to download"
          delay={0.1}
        >
          <div className="mt-2">
            {speeds.download ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {formatDuration(calculateTransferTime(speeds.download))}
                </div>
                <div className="text-sm text-muted-foreground">
                  at {formatBytes((speeds.download * 1000000) / 8)}/s
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {isLoading ? "Measuring speed..." : "Run speed test to calculate"}
              </div>
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard
          icon={<Upload className="h-5 w-5 text-primary" />}
          title="Upload Time"
          description="Estimated time to upload"
          delay={0.2}
        >
          <div className="mt-2">
            {speeds.upload ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {formatDuration(calculateTransferTime(speeds.upload))}
                </div>
                <div className="text-sm text-muted-foreground">
                  at {formatBytes((speeds.upload * 1000000) / 8)}/s
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {isLoading ? "Measuring speed..." : "Run speed test to calculate"}
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>

      {speeds.timestamp && (
        <div className="text-xs text-muted-foreground">
          Speed last measured: {new Date(speeds.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  )
}
