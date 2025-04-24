"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import {
  FileArchive,
  Upload,
  WifiOff,
  Settings,
  Unlock,
  BarChart3,
  FileType,
  X,
  RefreshCw,
  Zap,
  Info,
  Cog,
  HelpCircle,
  Gauge,
  Check,
  AlertCircle,
  Download,
  FileIcon,
  Layers
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from './ui/button';

interface EnhancedFile extends File {
  id: string;
  originalSize: number;
  optimizationMethod?: string;
  status: 'pending' | 'processing' | 'compressed' | 'error';
  progress: number;
  compressionRatio?: number;
  compressedSize?: number;
  compressedBlob?: Blob;
}

export function FileCompressor() {
  const [files, setFiles] = useState<EnhancedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractFileInputRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<JSZip | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []).map(file => ({
      ...file,
      id: crypto.randomUUID(),
      originalSize: file.size,
      status: 'pending' as const,
      progress: 0
    })) as EnhancedFile[];
    setFiles(prev => [...prev, ...newFiles]);
  };

  const updateFileStatus = useCallback((
    id: string, 
    status: EnhancedFile['status'], 
    progress: number,
    compressedSize?: number,
    compressionRatio?: number,
    error?: string
  ) => {
    setFiles(prev => prev.map(file => 
      file.id === id 
        ? { 
            ...file, 
            status, 
            progress,
            ...(compressedSize !== undefined && { compressedSize }),
            ...(compressionRatio !== undefined && { compressionRatio }),
            ...(error && { error })
          } 
        : file
    ));
  }, []);

  const handleCompression = async (file: EnhancedFile) => {
    const zip = new JSZip();
    updateFileStatus(file.id, "processing", 0);

    try {
      zip.file(file.name, file, {
        compression: file.optimizationMethod as 'STORE' | 'DEFLATE'
      });

      const content = await zip.generateAsync({
        type: "blob",
        compression: file.optimizationMethod as 'STORE' | 'DEFLATE'
      }, (metadata) => {
        updateFileStatus(file.id, "processing", metadata.percent);
      });

      updateFileStatus(
        file.id,
        "compressed",
        100,
        content.size,
        (content.size / file.size) * 100
      );
    } catch (err) {
      updateFileStatus(file.id, "error", 0, undefined, undefined, err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const getCompressionRatioColor = (ratio: number) => {
    if (ratio <= 50) return 'text-green-500';
    if (ratio <= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

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
        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative flex items-center p-4 space-x-4 bg-card rounded-lg border"
            >
              <FileIcon className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground space-x-2">
                  <span>{formatFileSize(file.originalSize)}</span>
                  {file.optimizationMethod && (
                    <span>{file.optimizationMethod}</span>
                  )}
                </div>
                {file.status === "processing" && (
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {file.compressionRatio !== undefined && (
                  <div className="mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        getCompressionRatioColor(file.compressionRatio)
                      }`}
                    >
                      {file.compressionRatio.toFixed(1)}% of original
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {files.length === 0 && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="h-32 bg-muted/50 border border-dashed"
          >
            <Upload className="h-8 w-8 text-primary" />
            <span className="ml-2">Select files to compress</span>
          </Button>
        )}

        {files.length > 0 && (
          <div className="flex space-x-2">
            <Button
              onClick={() => files.forEach(file => handleCompression(file))}
              disabled={files.some(f => f.status === 'processing')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Compress All
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add More Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
