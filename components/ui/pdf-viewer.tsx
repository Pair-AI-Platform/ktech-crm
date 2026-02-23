"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  ExternalLink,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PDFViewerProps {
  url: string
  fileName?: string
  onClose: () => void
  className?: string
}

export function PDFViewer({ url, fileName, onClose, className }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 200))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 50))
  }, [])

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || 'document.pdf'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [url, fileName])

  const handleOpenInNewTab = useCallback(() => {
    window.open(url, '_blank')
  }, [url])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const handleLoad = useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  const handleError = useCallback(() => {
    setLoading(false)
    setError('Failed to load PDF. The file may be corrupted or inaccessible.')
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 z-50 bg-[rgba(31,29,26,0.85)] flex flex-col",
          className
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)]"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-[var(--text-primary)] truncate max-w-[300px]">
              {fileName || 'PDF Document'}
            </h3>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-[var(--bg-sunken)] rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="h-8 w-8"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="px-2 text-sm font-medium text-[var(--text-secondary)] min-w-[50px] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="h-8 w-8"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenInNewTab}
                className="h-8 w-8"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 ml-2"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[rgba(31,29,26,0.6)] z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#FAF9F7]" />
                <span className="text-[#FAF9F7] text-sm">Loading PDF...</span>
              </div>
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center gap-4 p-8 bg-[var(--bg-surface)] rounded-xl text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="text-lg font-medium text-[var(--text-primary)]">
                Unable to Load PDF
              </h4>
              <p className="text-sm text-[var(--text-muted)]">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleOpenInNewTab}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Browser
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "bg-[var(--bg-surface)] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden",
                isFullscreen ? "w-full h-full" : "max-w-[90vw] max-h-[80vh]"
              )}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
              }}
            >
              <iframe
                src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
                className={cn(
                  "border-0",
                  isFullscreen ? "w-full h-full" : "w-[900px] h-[700px]"
                )}
                title={fileName || 'PDF Document'}
                onLoad={handleLoad}
                onError={handleError}
              />
            </motion.div>
          )}
        </div>

        {/* Footer hints */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-4 py-2 bg-[var(--bg-surface)] border-t border-[var(--border)] text-center"
        >
          <p className="text-xs text-[var(--text-muted)]">
            Press <kbd className="px-1 py-0.5 bg-[var(--bg-sunken)] rounded text-[10px]">ESC</kbd> to close
            {' • '}
            <kbd className="px-1 py-0.5 bg-[var(--bg-sunken)] rounded text-[10px]">+</kbd>/<kbd className="px-1 py-0.5 bg-[var(--bg-sunken)] rounded text-[10px]">-</kbd> to zoom
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Simpler inline PDF preview component for smaller views
interface PDFPreviewProps {
  url: string
  className?: string
  height?: number
}

export function PDFPreview({ url, className, height = 200 }: PDFPreviewProps) {
  const [loading, setLoading] = useState(true)

  return (
    <div className={cn("relative bg-[var(--bg-sunken)] rounded-lg overflow-hidden", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
        </div>
      )}
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        className="w-full border-0"
        style={{ height }}
        title="PDF Preview"
        onLoad={() => setLoading(false)}
      />
    </div>
  )
}
