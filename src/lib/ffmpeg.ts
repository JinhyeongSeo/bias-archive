'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

// Singleton FFmpeg instance
let ffmpegInstance: FFmpeg | null = null
let isLoaded = false

export interface GifOptions {
  startTime: number  // in seconds
  duration: number   // in seconds
  fps?: number       // default: 10
  width?: number     // default: 320, -1 for auto height
}

export interface ConvertProgress {
  progress: number  // 0 to 1
  time?: number     // current time in seconds
}

/**
 * Load FFmpeg instance (singleton pattern)
 * Uses single-threaded version for better browser compatibility
 */
export async function loadFFmpeg(
  onProgress?: (progress: ConvertProgress) => void
): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    // Re-register progress handler if provided
    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress, time }) => {
        onProgress({ progress, time })
      })
    }
    return ffmpegInstance
  }

  ffmpegInstance = new FFmpeg()

  // Set up progress handler
  if (onProgress) {
    ffmpegInstance.on('progress', ({ progress, time }) => {
      onProgress({ progress, time })
    })
  }

  // Load FFmpeg with single-threaded core for better compatibility
  // This avoids SharedArrayBuffer requirements
  await ffmpegInstance.load({
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
    wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
  })

  isLoaded = true
  return ffmpegInstance
}

/**
 * Convert video file to GIF
 * @param file - Input video file
 * @param options - GIF conversion options
 * @param onProgress - Progress callback (0-1)
 * @returns Blob containing the generated GIF
 */
export async function convertToGif(
  file: File,
  options: GifOptions,
  onProgress?: (progress: ConvertProgress) => void
): Promise<Blob> {
  const { startTime, duration, fps = 10, width = 320 } = options

  // Load FFmpeg
  const ffmpeg = await loadFFmpeg(onProgress)

  // Get file extension for input
  const inputName = `input.${getFileExtension(file.name)}`
  const outputName = 'output.gif'

  try {
    // Write input file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile(inputName, await fetchFile(file))

    // Build filter string: fps and scale with lanczos algorithm
    const filterStr = `fps=${fps},scale=${width}:-1:flags=lanczos`

    // Execute FFmpeg command
    // -ss: start time, -t: duration, -vf: video filter
    await ffmpeg.exec([
      '-ss', startTime.toString(),
      '-t', duration.toString(),
      '-i', inputName,
      '-vf', filterStr,
      '-f', 'gif',
      outputName
    ])

    // Read output file (returns Uint8Array for binary files)
    const data = await ffmpeg.readFile(outputName)

    // Convert to Blob
    let blob: Blob
    if (typeof data === 'string') {
      // String output (shouldn't happen for binary files)
      const encoder = new TextEncoder()
      blob = new Blob([encoder.encode(data)], { type: 'image/gif' })
    } else {
      // Uint8Array output - copy to new ArrayBuffer to avoid SharedArrayBuffer issues
      blob = new Blob([new Uint8Array(data)], { type: 'image/gif' })
    }

    // Cleanup: remove files from virtual filesystem
    await ffmpeg.deleteFile(inputName)
    await ffmpeg.deleteFile(outputName)

    return blob
  } catch (error) {
    // Cleanup on error
    try {
      await ffmpeg.deleteFile(inputName)
    } catch {
      // Ignore cleanup errors
    }
    try {
      await ffmpeg.deleteFile(outputName)
    } catch {
      // Ignore cleanup errors
    }
    throw error
  }
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'mp4'
}

/**
 * Check if FFmpeg is loaded
 */
export function isFFmpegLoaded(): boolean {
  return isLoaded
}

/**
 * Unload FFmpeg instance (useful for cleanup)
 */
export async function unloadFFmpeg(): Promise<void> {
  if (ffmpegInstance) {
    ffmpegInstance.terminate()
    ffmpegInstance = null
    isLoaded = false
  }
}
