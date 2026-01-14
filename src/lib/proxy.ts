/**
 * Proxy utilities for handling hotlink protected media
 * - Images: wsrv.nl (free image cache & resize with global Cloudflare CDN)
 * - Videos: Cloudflare Worker (custom video proxy)
 */

// Domains that require proxy due to hotlink protection
const HOTLINK_PROTECTED_DOMAINS = ['heye.kr', 'kgirls.net']

// Video proxy URL (Cloudflare Worker)
// Falls back to original URL if not set (graceful degradation)
const VIDEO_PROXY_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_PROXY_URL || 'https://video-proxy.jh4clover.workers.dev'

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
  if (!needsProxy(url)) {
    return url
  }

  // wsrv.nl format: https://wsrv.nl/?url={encodedUrl}
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}`
}

/**
 * Check if URL is a video file
 */
export function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')
}

/**
 * Get proxied video URL using Cloudflare Worker
 * Returns original URL if not from a hotlink protected domain
 */
export function getProxiedVideoUrl(url: string): string {
  if (!needsProxy(url)) {
    return url
  }

  // Cloudflare Worker format: https://worker.workers.dev/?url={encodedUrl}
  return `${VIDEO_PROXY_BASE_URL}/?url=${encodeURIComponent(url)}`
}
