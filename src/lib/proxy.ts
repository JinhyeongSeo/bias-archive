/**
 * Image proxy utilities for handling hotlink protected images
 * Uses wsrv.nl - a free image cache & resize service with global Cloudflare CDN
 */

// Domains that require proxy due to hotlink protection
const HOTLINK_PROTECTED_DOMAINS = ['heye.kr', 'kgirls.net']

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
