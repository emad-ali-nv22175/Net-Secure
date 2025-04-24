"use client"

import type React from "react"

import { useState } from "react"
import { FileDigit, Copy, Check, Upload, Info, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export function HashGenerator() {
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [algorithm, setAlgorithm] = useState("SHA-256")
  const [hashResult, setHashResult] = useState<string | null>(null)
  const [verificationHash, setVerificationHash] = useState("")
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileProgress, setFileProgress] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
  const [compareHash, setCompareHash] = useState("")
  const [secondHash, setSecondHash] = useState("")
  const [hashesMatch, setHashesMatch] = useState<boolean | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateTextHash = async () => {
    try {
      setError(null)
      setLoading(true)
      setHashesMatch(null)

      if (!text) {
        setError("Please enter text to hash")
        setLoading(false)
        return
      }

      const encoder = new TextEncoder()
      const data = encoder.encode(text)

      const hashBuffer = await crypto.subtle.digest(algorithm, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

      setHashResult(hashHex)

      // Check if we're in compare mode
      if (compareMode && compareHash) {
        setHashesMatch(compareHash.toLowerCase() === hashHex.toLowerCase())
      }
    } catch (err) {
      console.error(err)
      setError("Failed to generate hash")
    } finally {
      setLoading(false)
    }
  }

  const generateFileHash = async () => {
    try {
      setError(null)
      setLoading(true)
      setHashesMatch(null)
      setFileProgress(0)

      if (!file) {
        setError("Please select a file")
        setLoading(false)
        return
      }

      const chunkSize = 2 * 1024 * 1024 // 2MB chunks
      const chunks = Math.ceil(file.size / chunkSize)
      let currentChunk = 0
      
      // Create hash object
      const cryptoAlgo = algorithm.toLowerCase().replace('-', '')
      const hashObj = await crypto.subtle.digest(cryptoAlgo, new ArrayBuffer(0))
      
      // Process file in chunks
      while (currentChunk < chunks) {
        const start = currentChunk * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)
        
        const arrayBuffer = await chunk.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest(cryptoAlgo, arrayBuffer)
        
        // Update progress
        currentChunk++
        const progress = Math.round((currentChunk / chunks) * 100)
        setFileProgress(progress)
        
        // XOR the hash results together for accumulation
        const currentHash = new Uint8Array(hashObj)
        const newHash = new Uint8Array(hashBuffer)
        for (let i = 0; i < currentHash.length; i++) {
          currentHash[i] ^= newHash[i]
        }
      }
      
      // Convert final hash to hex string
      const hashArray = Array.from(new Uint8Array(hashObj))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      setHashResult(hashHex)
      
      // Check verification if enabled
      if (compareMode && verificationHash) {
        const normalizedResult = hashHex.toLowerCase()
        const normalizedVerification = verificationHash.toLowerCase().trim().replace(/[^a-f0-9]/g, '')
        setVerificationResult(normalizedResult === normalizedVerification)
      }

      setLoading(false)
    } catch (err) {
      console.error("Hash generation failed:", err)
      setError(`Hash generation failed: ${(err as Error).message}`)
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setHashResult(null)
    setError(null)
    setFileProgress(0)
    setVerificationResult(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      setHashResult(null)
      setError(null)
      setFileProgress(0)
      setVerificationResult(null)
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(!compareMode)
    setHashesMatch(null)
  }

  // Update the hash comparison function
  const compareHashes = () => {
    const normalizeHash = (hash: string) => hash.toLowerCase().trim().replace(/[^a-f0-9]/g, '')
    
    if (compareHash && secondHash) {
      const normalizedCompare = normalizeHash(compareHash)
      const normalizedSecond = normalizeHash(secondHash)
      setHashesMatch(normalizedCompare === normalizedSecond)
    } else if (hashResult && compareHash) {
      const normalizedResult = normalizeHash(hashResult)
      const normalizedCompare = normalizeHash(compareHash)
      setHashesMatch(normalizedResult === normalizedCompare)
    } else if (hashResult && secondHash) {
      const normalizedResult = normalizeHash(hashResult)
      const normalizedSecond = normalizeHash(secondHash)
      setHashesMatch(normalizedResult === normalizedSecond)
    }
  }

  const getAlgorithmDescription = () => {
    switch (algorithm) {
      case "SHA-1":
        return "SHA-1 (Secure Hash Algorithm 1) produces a 160-bit hash value. It's considered cryptographically broken and unsuitable for security applications."
      case "SHA-256":
        return "SHA-256 is part of the SHA-2 family, producing a 256-bit hash value. It's widely used and considered secure for most applications."
      case "SHA-384":
        return "SHA-384 is part of the SHA-2 family, producing a 384-bit hash value. It provides higher security than SHA-256 with a performance trade-off."
      case "SHA-512":
        return "SHA-512 is part of the SHA-2 family, producing a 512-bit hash value. It offers the highest security level in the SHA-2 family."
      case "MD5":
        return "MD5 produces a 128-bit hash value. It's cryptographically broken and should only be used for non-security purposes like checksums."
      default:
        return ""
    }
  }

  return (
    <Card className="gradient-border-card tool-card animate-fade-in overflow-hidden border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileDigit className="h-5 w-5 text-primary" />
          Cryptographic Hash Generator
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Generate and verify cryptographic hashes for data integrity and security verification
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-6">
        <div className="tool-explanation mb-6">
          <h3 className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            What is a cryptographic hash?
          </h3>
          <p>
            A cryptographic hash function converts data of any size into a fixed-size string of characters. It's
            designed to be one-way (can't be reversed), deterministic (same input = same output), and
            collision-resistant (hard to find two inputs with same output).
          </p>
        </div>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger
              value="text"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Text
            </TabsTrigger>
            <TabsTrigger
              value="file"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4 animate-slide-in">
            <div className="space-y-2">
              <Label htmlFor="text-to-hash" className="text-foreground">
                Text to Hash
              </Label>
              <Textarea
                id="text-to-hash"
                placeholder="Enter text to hash"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="bg-secondary border-border focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="hash-algorithm" className="text-foreground">
                  Hash Algorithm
                </Label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger id="hash-algorithm" className="bg-secondary border-border">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="MD5">MD5 (Not secure, for comparison only)</SelectItem>
                    <SelectItem value="SHA-1">SHA-1 (Not secure for cryptographic purposes)</SelectItem>
                    <SelectItem value="SHA-256">SHA-256 (Recommended)</SelectItem>
                    <SelectItem value="SHA-384">SHA-384</SelectItem>
                    <SelectItem value="SHA-512">SHA-512</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{getAlgorithmDescription()}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Options</Label>
                <Button
                  variant={compareMode ? "default" : "outline"}
                  className={`w-full ${
                    compareMode
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-secondary border-border hover:bg-accent text-foreground"
                  }`}
                  onClick={toggleCompareMode}
                >
                  {compareMode ? "Cancel Compare" : "Compare Hashes"}
                </Button>
              </div>
            </div>

            {compareMode && (
              <div className="space-y-4 animate-slide-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-hash" className="text-foreground">
                      First Hash
                    </Label>
                    <div className="relative">
                      <Input
                        id="first-hash"
                        placeholder="Enter first hash value"
                        value={compareHash}
                        onChange={(e) => setCompareHash(e.target.value)}
                        className="bg-secondary border-border pr-10 focus-visible:ring-ring"
                      />
                      {compareHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(compareHash)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="sr-only">Copy</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="second-hash" className="text-foreground">
                      Second Hash
                    </Label>
                    <div className="relative">
                      <Input
                        id="second-hash"
                        placeholder="Enter second hash value"
                        value={secondHash}
                        onChange={(e) => setSecondHash(e.target.value)}
                        className="bg-secondary border-border pr-10 focus-visible:ring-ring"
                      />
                      {secondHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(secondHash)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="sr-only">Copy</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={compareHashes}
                  disabled={!compareHash || !secondHash}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Compare Hashes
                </Button>
              </div>
            )}

            <Button
              onClick={generateTextHash}
              disabled={loading || !text}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-primary-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Hash"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-4 mt-4 animate-slide-in">
            <div className="space-y-2">
              <Label htmlFor="file-to-hash" className="text-foreground">
                File to Hash
              </Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input id="file-to-hash" type="file" onChange={handleFileChange} className="hidden" />

                {file ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("file-to-hash")?.click()}
                      className="bg-secondary border-border hover:bg-accent text-foreground"
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div
                    className="space-y-2 cursor-pointer"
                    onClick={() => document.getElementById("file-to-hash")?.click()}
                  >
                    <Upload className="mx-auto h-8 w-8 text-primary animate-pulse" />
                    <p className="text-sm font-medium text-foreground">Click to select a file</p>
                    <p className="text-xs text-muted-foreground">Or drag and drop a file here</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="file-hash-algorithm" className="text-foreground">
                  Hash Algorithm
                </Label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger id="file-hash-algorithm" className="bg-secondary border-border">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="MD5">MD5 (Not secure, for comparison only)</SelectItem>
                    <SelectItem value="SHA-1">SHA-1 (Not secure for cryptographic purposes)</SelectItem>
                    <SelectItem value="SHA-256">SHA-256 (Recommended)</SelectItem>
                    <SelectItem value="SHA-384">SHA-384</SelectItem>
                    <SelectItem value="SHA-512">SHA-512</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{getAlgorithmDescription()}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Verification</Label>
                <Button
                  variant={compareMode ? "default" : "outline"}
                  className={`w-full ${
                    compareMode
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-secondary border-border hover:bg-accent text-foreground"
                  }`}
                  onClick={toggleCompareMode}
                >
                  {compareMode ? "Cancel Verify" : "Verify Hash"}
                </Button>
              </div>
            </div>

            {compareMode && (
              <div className="space-y-4 animate-slide-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="verification-hash" className="text-foreground">
                      Expected Hash
                    </Label>
                    <div className="relative">
                      <Input
                        id="verification-hash"
                        placeholder="Enter expected hash value"
                        value={verificationHash}
                        onChange={(e) => setVerificationHash(e.target.value)}
                        className="bg-secondary border-border pr-10 focus-visible:ring-ring"
                      />
                      {verificationHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(verificationHash)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="sr-only">Copy</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="second-verification-hash" className="text-foreground">
                      Generated Hash
                    </Label>
                    <div className="relative">
                      <Input
                        id="second-verification-hash"
                        placeholder="Or paste a hash to compare"
                        value={secondHash}
                        onChange={(e) => setSecondHash(e.target.value)}
                        className="bg-secondary border-border pr-10 focus-visible:ring-ring"
                      />
                      {secondHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(secondHash)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="sr-only">Copy</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={compareHashes}
                  disabled={!verificationHash || (!secondHash && !hashResult)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Verify Hashes
                </Button>
                <p className="text-xs text-muted-foreground">
                  Compare the expected hash with either the generated hash or a pasted hash
                </p>
              </div>
            )}

            <Button
              onClick={generateFileHash}
              disabled={loading || !file}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-primary-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Hash"
              )}
            </Button>

            {loading && fileProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Processing file...</span>
                  <span className="text-primary">{fileProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full progress-bar-animated" style={{ width: `${fileProgress}%` }}></div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hashResult && (
          <div className="mt-6 space-y-2 results-section animate-fade-in">
            <div className="results-header">
              <span className="text-foreground">Hash Result ({algorithm})</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs hover:bg-accent"
                onClick={() => copyToClipboard(hashResult)}
              >
                {copied ? <Check className="h-4 w-4 mr-1 text-primary" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="p-3 bg-secondary rounded-md overflow-auto border border-border">
              <pre className="text-sm break-all whitespace-pre-wrap font-mono text-foreground">{hashResult}</pre>
            </div>
          </div>
        )}

        {compareMode && hashesMatch !== null && (
          <div className="mt-4 animate-fade-in">
            <Alert
              variant={hashesMatch ? "default" : "destructive"}
              className={
                hashesMatch
                  ? "bg-green-900/20 border-green-700/30 text-green-400"
                  : "bg-destructive/20 border-destructive/30 text-destructive-foreground"
              }
            >
              <div className="flex items-center gap-2">
                {hashesMatch ? (
                  <>
                    <Shield className="h-4 w-4 text-green-500" />
                    <AlertTitle>Hashes Match</AlertTitle>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hashes Don't Match</AlertTitle>
                  </>
                )}
              </div>
              <AlertDescription>
                {hashesMatch
                  ? "The hashes are identical. The data integrity is verified."
                  : "The hashes are different. The data may have been modified or corrupted."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Separator className="my-6 bg-border" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Common Hash Applications
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                <strong className="text-foreground">File Integrity:</strong> Verify downloaded files haven't been
                tampered with
              </li>
              <li>
                <strong className="text-foreground">Data Deduplication:</strong> Identify duplicate files by their hash
              </li>
              <li>
                <strong className="text-foreground">Git Version Control:</strong> Git uses SHA-1 to track content
                changes
              </li>
              <li>
                <strong className="text-foreground">Digital Forensics:</strong> Verify evidence hasn't been altered
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Security Considerations
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                <strong className="text-foreground">MD5 and SHA-1:</strong> Considered cryptographically broken
              </li>
              <li>
                <strong className="text-foreground">SHA-256 and above:</strong> Currently secure for most applications
              </li>
              <li>
                <strong className="text-foreground">Hash Collisions:</strong> When two different inputs produce the same
                hash
              </li>
              <li>
                <strong className="text-foreground">Salt:</strong> Random data added to input before hashing (for
                passwords)
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t border-border pt-4 flex flex-col items-start">
        <div className="space-y-1 w-full">
          <p>
            <strong className="text-foreground">Use cases:</strong> File integrity verification, password storage,
            digital signatures, and data integrity checks.
          </p>
          <p>
            <strong className="text-foreground">Privacy guarantee:</strong> All hash generation happens locally in your
            browser using the Web Crypto API. No data is transmitted.
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
