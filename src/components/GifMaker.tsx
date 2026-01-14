'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { convertToGif, loadFFmpeg, type ConvertProgress } from '@/lib/ffmpeg'

interface GifMakerProps {
  className?: string
}

export function GifMaker({ className = '' }: GifMakerProps) {
  const t = useTranslations('gif')
  const te = useTranslations('errors')
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(2)
  const [fps, setFps] = useState<number>(10)
  const [width, setWidth] = useState<number>(320)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isFFmpegLoading, setIsFFmpegLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [gifBlob, setGifBlob] = useState<Blob | null>(null)
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
      if (gifUrl) URL.revokeObjectURL(gifUrl)
    }
  }, [videoUrl, gifUrl])

  // Preload FFmpeg on mount
  useEffect(() => {
    setIsFFmpegLoading(true)
    loadFFmpeg()
      .then(() => setIsFFmpegLoading(false))
      .catch(() => setIsFFmpegLoading(false))
  }, [])

  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      setError(te('videoOnly'))
      return
    }

    // Cleanup previous URLs
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (gifUrl) URL.revokeObjectURL(gifUrl)

    setFile(selectedFile)
    setVideoUrl(URL.createObjectURL(selectedFile))
    setGifBlob(null)
    setGifUrl(null)
    setError(null)
    setProgress(0)
    setStartTime(0)
    setDuration(2)
  }, [videoUrl, gifUrl])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration
      setVideoDuration(dur)
      // Set default duration to min of 2 seconds or video duration
      setDuration(Math.min(2, dur))
    }
  }

  const handleConvert = async () => {
    if (!file) {
      setError(te('uploadFirst'))
      return
    }

    setIsLoading(true)
    setError(null)
    setProgress(0)

    // Cleanup previous GIF URL
    if (gifUrl) {
      URL.revokeObjectURL(gifUrl)
      setGifUrl(null)
    }
    setGifBlob(null)

    try {
      const blob = await convertToGif(
        file,
        { startTime, duration, fps, width },
        (p: ConvertProgress) => setProgress(p.progress)
      )

      setGifBlob(blob)
      setGifUrl(URL.createObjectURL(blob))
    } catch (err) {
      console.error('GIF conversion error:', err)
      setError(err instanceof Error ? err.message : te('conversionError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!gifBlob || !gifUrl) return

    const a = document.createElement('a')
    a.href = gifUrl
    a.download = `${file?.name.replace(/\.[^/.]+$/, '') || 'output'}.gif`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleClear = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (gifUrl) URL.revokeObjectURL(gifUrl)

    setFile(null)
    setVideoUrl(null)
    setVideoDuration(0)
    setGifBlob(null)
    setGifUrl(null)
    setError(null)
    setProgress(0)
    setStartTime(0)
    setDuration(2)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Seek video when startTime changes
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.currentTime = startTime
    }
  }, [startTime, videoUrl])

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* FFmpeg Loading Indicator */}
      {isFFmpegLoading && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {t('loadingFFmpeg')}
        </div>
      )}

      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-primary hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleInputChange}
          className="hidden"
        />
        <svg className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-zinc-600 dark:text-zinc-400 mb-1">
          {t('upload')}
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          {t('supportedFormats')}
        </p>
      </div>

      {/* Video Preview */}
      {videoUrl && (
        <div className="mt-6 space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onLoadedMetadata={handleVideoLoaded}
              className="w-full max-h-80 object-contain"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('startTime')}: {startTime.toFixed(1)}{t('seconds')}
              </label>
              <input
                type="range"
                min={0}
                max={Math.max(0, videoDuration - 0.1)}
                step={0.1}
                value={startTime}
                onChange={(e) => {
                  const newStart = parseFloat(e.target.value)
                  setStartTime(newStart)
                  // Adjust duration if it exceeds video length
                  if (newStart + duration > videoDuration) {
                    setDuration(Math.max(0.1, videoDuration - newStart))
                  }
                }}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('duration')}: {duration.toFixed(1)}{t('seconds')}
              </label>
              <input
                type="range"
                min={0.1}
                max={Math.min(10, Math.max(0.1, videoDuration - startTime))}
                step={0.1}
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* FPS */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('fps')}: {fps}
              </label>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Width */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('width')}: {width}px
              </label>
              <input
                type="range"
                min={160}
                max={640}
                step={16}
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleConvert}
              disabled={isLoading || isFFmpegLoading}
              className="flex-1 px-4 py-3 rounded-lg bg-primary hover:bg-primary-dark disabled:bg-primary/40 text-white font-medium transition-smooth flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('creating')}
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('create')}
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 font-medium transition-colors"
            >
              {t('reset')}
            </button>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                {Math.round(progress * 100)}% {t('progress')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* GIF Result */}
      {gifUrl && (
        <div className="mt-6 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('complete')}
          </h3>
          <div className="rounded-lg overflow-hidden bg-white dark:bg-zinc-900 mb-4">
            <img
              src={gifUrl}
              alt="Generated GIF"
              className="max-w-full mx-auto"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t('size')}: {gifBlob ? `${(gifBlob.size / 1024).toFixed(1)} KB` : '-'}
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('download')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
