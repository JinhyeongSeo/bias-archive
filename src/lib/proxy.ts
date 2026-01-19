/**
 * Proxy utilities for handling hotlink protected media
 * - Images: wsrv.nl (free image cache & resize with global Cloudflare CDN)
 * - Videos: Cloudflare Worker (custom video proxy)
 */

// Domains that require proxy due to hotlink protection
const HOTLINK_PROTECTED_DOMAINS = ['heye.kr', 'kgirls.net', 'twimg.com', 'cdninstagram.com']

// Video proxy URL (Cloudflare Worker)
// Falls back to original URL if not set (graceful degradation)
const VIDEO_PROXY_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_PROXY_URL || 'https://video-proxy.jh4clover.workers.dev'

/**
 * Decode HTML entities in URL (handles &amp; from Instagram/other sources)
 */
function decodeUrlEntities(url: string): string {
  return url
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

/**
 * Check if a URL needs to be proxied (from hotlink protected domains)
 */
export function needsProxy(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return HOTLINK_PROTECTED_DOMAINS.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

/**
 * Get proxied image URL using wsrv.nl
 * Returns original URL if not from a hotlink protected domain
 */
export function getProxiedImageUrl(url: string): string {
  // Decode HTML entities first (handles &amp; from Instagram/other sources)
  const cleanUrl = decodeUrlEntities(url)

  if (!needsProxy(cleanUrl)) {
    return cleanUrl
  }

  // wsrv.nl format: https://wsrv.nl/?url={encodedUrl}
  return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}`
}

/**
 * Check if URL is a video file
 * Handles both direct URLs and proxied URLs (wsrv.nl, video-proxy)
 */
export function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase()

  // Direct video URL check
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) {
    return true
  }

  // Check proxied URLs (wsrv.nl or video-proxy with ?url= param)
  if (lower.includes('?url=')) {
    try {
      const urlObj = new URL(url)
      const encodedOriginal = urlObj.searchParams.get('url')
      if (encodedOriginal) {
        const originalUrl = decodeURIComponent(encodedOriginal).toLowerCase()
        return originalUrl.endsWith('.mp4') || originalUrl.endsWith('.webm') || originalUrl.endsWith('.mov')
      }
    } catch {
      // URL parsing failed, not a video
    }
  }

  return false
}

/**
 * Get proxied video URL using Cloudflare Worker
 * Returns original URL if not from a hotlink protected domain
 */
export function getProxiedVideoUrl(url: string): string {
  // Decode HTML entities first (handles &amp; from Instagram/other sources)
  const cleanUrl = decodeUrlEntities(url)

  if (!needsProxy(cleanUrl)) {
    return cleanUrl
  }

  // Cloudflare Worker format: https://worker.workers.dev/?url={encodedUrl}
  return `${VIDEO_PROXY_BASE_URL}/?url=${encodeURIComponent(cleanUrl)}`
}

/**
 * Extract original URL from a proxied URL (wsrv.nl or video-proxy)
 * Also decodes HTML entities. Use this before saving to DB.
 */
export function extractOriginalUrl(url: string): string {
  try {
    const urlObj = new URL(url)

    // Check if it's a proxy URL (wsrv.nl or video-proxy)
    if (urlObj.hostname === 'wsrv.nl' || urlObj.hostname.endsWith('.workers.dev')) {
      const encodedOriginal = urlObj.searchParams.get('url')
      if (encodedOriginal) {
        return decodeURIComponent(encodedOriginal)
      }
    }

    // Not a proxy URL, return as-is (with HTML entity decoding)
    return decodeUrlEntities(url)
  } catch {
    return decodeUrlEntities(url)
  }
}

/**
 * Get Wayback Machine fallback URL for an archived resource
 * Returns the archive URL if available, null otherwise
 */
export function getWaybackFallbackUrl(originalUrl: string, archiveUrl?: string | null): string | null {
  if (archiveUrl) {
    return archiveUrl
  }
  return null
}

/**
 * Get proxied URL with Wayback fallback
 * Returns primary proxied URL and optional fallback URL from Wayback Machine
 */
export function getProxiedUrlWithFallback(
  url: string,
  archiveUrl?: string | null,
  isVideo?: boolean
): { primary: string; fallback: string | null } {
  const primary = isVideo ? getProxiedVideoUrl(url) : getProxiedImageUrl(url)
  const fallback = getWaybackFallbackUrl(url, archiveUrl)

  return { primary, fallback }
}
