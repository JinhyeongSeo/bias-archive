/**
 * Metadata extraction service
 * Centralized URL metadata extraction with platform detection and error handling
 */

import {
  parseYouTube,
  parseTwitter,
  parseWeverse,
  parseHeye,
  parseKgirls,
  parseGeneric,
  parseInstagram,
  type VideoMetadata,
} from './parsers'
import type { Platform } from '@/types/index'

// Re-export types for backward compatibility
export type { Platform }
export type LinkMetadata = VideoMetadata

/**
 * Custom error class for metadata extraction errors
 */
export class MetadataError extends Error {
  constructor(
    message: string,
    public readonly errorType: 'INVALID_URL' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'TIMEOUT',
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'MetadataError'
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.errorType) {
      case 'INVALID_URL':
        return '유효하지 않은 URL입니다. URL 형식을 확인해주세요.'
      case 'NETWORK_ERROR':
        return '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      case 'PARSE_ERROR':
        return '메타데이터를 추출할 수 없습니다. 해당 콘텐츠가 비공개이거나 삭제되었을 수 있습니다.'
      case 'TIMEOUT':
        return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
      default:
        return '알 수 없는 오류가 발생했습니다.'
    }
  }
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): Platform {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // YouTube patterns
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    }

    // Twitter patterns
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter'
    }

    // Weverse patterns
    if (hostname.includes('weverse.io')) {
      return 'weverse'
    }

    // kgirls.net patterns
    if (hostname.includes('kgirls.net')) {
      if (urlObj.pathname.startsWith('/issue')) {
        return 'kgirls-issue'
      }
      return 'kgirls'
    }

    // heye.kr patterns
    if (hostname.includes('heye.kr')) {
      return 'heye'
    }

    // Instagram patterns
    if (hostname.includes('instagram.com')) {
      return 'instagram'
    }

    return 'other'
  } catch {
    return 'other'
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate thumbnail URL
 */
function isValidThumbnailUrl(url: string | null): string | null {
  if (!url) return null
  try {
    new URL(url)
    return url
  } catch {
    return null
  }
}

/**
 * Normalize metadata result
 * - Converts empty strings to null
 * - Validates thumbnail URL
 * - Preserves media array for multi-image support
 */
function normalizeMetadata(metadata: VideoMetadata): VideoMetadata {
  return {
    title: metadata.title?.trim() || null,
    description: metadata.description?.trim() || null,
    thumbnailUrl: isValidThumbnailUrl(metadata.thumbnailUrl),
    platform: metadata.platform,
    originalDate: metadata.originalDate?.trim() || null,
    authorName: metadata.authorName?.trim() || null,
    media: metadata.media,
  }
}

/**
 * Sleep utility for retry delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get appropriate parser for platform
 */
function getParser(platform: Platform): (url: string) => Promise<VideoMetadata> {
  switch (platform) {
    case 'youtube':
      return parseYouTube
    case 'twitter':
      return parseTwitter
    case 'weverse':
      return parseWeverse
    case 'heye':
      return parseHeye
    case 'kgirls':
      return parseKgirls
    case 'instagram':
      return parseInstagram
    default:
      return parseGeneric
  }
}

/**
 * Extract metadata from URL based on platform
 * Features:
 * - Platform detection and optimized parsing
 * - Error handling with typed errors
 * - Retry logic for network errors (1 retry with 1s delay)
 * - Result normalization
 *
 * @param url - The URL to extract metadata from
 * @returns LinkMetadata with normalized values
 * @throws MetadataError for invalid URLs
 */
export async function extractMetadata(url: string): Promise<LinkMetadata> {
  // Validate URL format
  if (!isValidUrl(url)) {
    throw new MetadataError(
      'Invalid URL format',
      'INVALID_URL'
    )
  }

  const platform = detectPlatform(url)
  const parser = getParser(platform)

  let lastError: Error | undefined

  // Retry logic: try up to 2 times (initial + 1 retry)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const metadata = await parser(url)
      return normalizeMetadata(metadata)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[Metadata] Attempt ${attempt + 1} failed for ${url}:`, lastError.message)
      }

      // Check if it's a timeout/abort error
      if (lastError.name === 'AbortError') {
        throw new MetadataError(
          'Request timed out',
          'TIMEOUT',
          lastError
        )
      }

      // Wait before retry (only if not the last attempt)
      if (attempt < 1) {
        await sleep(1000)
      }
    }
  }

  // If all retries failed, throw appropriate error
  throw new MetadataError(
    lastError?.message || 'Failed to extract metadata',
    'NETWORK_ERROR',
    lastError
  )
}
