"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileIcon,
  Trash2,
  Settings,
  FileCheck,
  FileX,
  AlertCircle,
  RefreshCw,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import JSZip from "jszip"

interface EnhancedFile extends File {
  id: string
  originalSize: number
  optimizationMethod?: "STORE" | "DEFLATE"  // Removed BZIP2 as it's not supported by JSZip
  status: "pending" | "processing" | "compressed" | "error"
  progress: number
  compressionRatio?: number
  compressedSize?: number
  compressedBlob?: Blob
  error?: string
}

export function FileCompressor() {
  const [files, setFiles] = useState<EnhancedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const extractFileInputRef = useRef<HTMLInputElement>(null)
  const zipRef = useRef<JSZip | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []).map((file) => ({
      ...file,
      id: crypto.randomUUID(),
      originalSize: file.size,
      status: "pending" as const,
      progress: 0,
      optimizationMethod: "DEFLATE" as const, // Default to DEFLATE for better compression
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  const updateFileStatus = useCallback(
    (
      id: string,
      status: EnhancedFile["status"],
      progress: number,
      compressedSize?: number,
      compressionRatio?: number,
      error?: string,
    ) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === id
            ? {
                ...file,
                status,
                progress,
                ...(compressedSize !== undefined && { compressedSize }),
                ...(compressionRatio !== undefined && { compressionRatio }),
                ...(error && { error }),
              }
            : file,
        ),
      )
    },
    [],
  )

  const handleCompression = async (file: EnhancedFile) => {
    const zip = new JSZip()
    updateFileStatus(file.id, "processing", 0)

    try {
      // Create a new AbortController for this compression
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      // Read the file content with progress tracking
      const fileContent = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            updateFileStatus(file.id, "processing", (e.loaded / e.total) * 30) // First 30% for reading
          }
        }
        reader.readAsArrayBuffer(file)
      })

      if (signal.aborted) throw new Error("Compression cancelled")

      // Add the file to the zip with the selected compression method
      zip.file(file.name, fileContent, {
        compression: file.optimizationMethod,
        compressionOptions: {
          level: 9, // Maximum compression level
        },
      })

      // Generate the compressed content with progress tracking
      const content = await zip.generateAsync(
        {
          type: "blob",
          compression: file.optimizationMethod,
          compressionOptions: {
            level: 9,
          },
        },
        (metadata) => {
          updateFileStatus(file.id, "processing", 30 + metadata.percent * 0.7) // Remaining 70% for compression
        },
      )

      if (signal.aborted) throw new Error("Compression cancelled")

      // Calculate compression stats
      const compressionRatio = (content.size / file.size) * 100

      updateFileStatus(file.id, "compressed", 100, content.size, compressionRatio)

      // Store the compressed blob for download
      const compressedFile = { ...file, compressedBlob: content }
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? compressedFile : f)),
      )
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown compression error"
      updateFileStatus(file.id, "error", 0, undefined, undefined, errorMessage)
    } finally {
      abortControllerRef.current = null
    }
  }

  const cancelCompression = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const downloadCompressedFile = async (file: EnhancedFile) => {
    if (!file.compressedBlob) return

    const url = URL.createObjectURL(file.compressedBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${file.name}.zip`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }, [])

  const getCompressionRatioColor = (ratio: number) => {
    if (ratio <= 50) return "text-green-500"
    if (ratio <= 75) return "text-yellow-500"
    return "text-red-500"
  }

  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"]
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">File Compression Tool</h2>
        <p className="text-sm text-muted-foreground">
          Compress files to reduce their size while preserving data integrity
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid gap-6">
        {/* File List */}
        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative flex items-center p-4 space-x-4 bg-card rounded-lg border"
            >
              {/* File Icon and Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-primary" />
                  <div className="text-sm font-medium truncate">{file.name}</div>
                </div>
                <div className="text-xs text-muted-foreground space-x-2">
                  <span>{formatFileSize(file.originalSize)}</span>
                  {file.optimizationMethod && (
                    <span>({file.optimizationMethod})</span>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status === "processing" && (
                  <div className="mt-2">
                    <Progress value={file.progress} className="h-1" />
                    <div className="text-xs text-muted-foreground mt-1">
                      Processing: {Math.round(file.progress)}%
                    </div>
                  </div>
                )}

                {/* Compression Results */}
                {file.status === "compressed" && file.compressionRatio && (
                  <div className="mt-2 space-y-1">
                    <div
                      className={`text-xs ${getCompressionRatioColor(
                        file.compressionRatio,
                      )}`}
                    >
                      {file.compressionRatio.toFixed(1)}% of original size
                    </div>
                    {file.compressedSize && (
                      <div className="text-xs text-muted-foreground">
                        Compressed: {formatFileSize(file.compressedSize)}
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {file.status === "error" && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{file.error}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {file.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleCompression(file)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Compress
                  </Button>
                )}

                {file.status === "processing" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={cancelCompression}
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Cancel
                  </Button>
                )}

                {file.status === "compressed" && (
                  <Button
                    size="sm"
                    onClick={() => downloadCompressedFile(file)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Files Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            Add Files to Compress
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
