/**
 * Cloudflare Worker - Video Proxy for Hotlink Protected Sites
 *
 * Proxies video requests from kgirls.net to bypass hotlink protection.
 * Adds proper Referer header to make videos accessible in external apps.
 *
 * Deployment:
 * 1. Cloudflare Dashboard: Workers & Pages → Create Worker → paste this code
 * 2. Or use wrangler: `wrangler deploy`
 *
 * Usage: https://your-worker.workers.dev/?url=<encoded-video-url>
 *
 * Free tier limits:
 * - 100,000 requests/day
 * - 1,000 requests/minute
 */

// Allowed domains for video proxying (whitelist for security)
const ALLOWED_DOMAINS = [
  'kgirls.net',
  'www.kgirls.net',
  'heye.kr',
  'www.heye.kr',
  'img1.heye.kr',
]

// Maximum file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024

// Allowed video content types
const ALLOWED_CONTENT_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
  'application/octet-stream', // fallback for some servers
]

// Browser-like User-Agent to avoid bot detection
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export default {
  async fetch(request) {
    const url = new URL(request.url)

    // Debug endpoint to check datacenter location
    if (url.pathname === '/debug') {
      return new Response(JSON.stringify({
        colo: request.cf?.colo,
        country: request.cf?.country,
        region: request.cf?.region,
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const videoUrl = url.searchParams.get('url')

    // Validate URL parameter
    if (!videoUrl) {
      return new Response('Missing url parameter', { status: 400 })
    }

    let targetUrl
    try {
      targetUrl = new URL(videoUrl)
    } catch {
      return new Response('Invalid URL', { status: 400 })
    }

    // Validate domain is in whitelist
    const hostname = targetUrl.hostname.replace(/^www\./, '')
    if (!ALLOWED_DOMAINS.some(d => d === hostname || d === `www.${hostname}`)) {
      return new Response(`Domain not allowed: ${hostname}`, { status: 403 })
    }

    try {
      // Build request headers - mimic a real browser request from the same site
      const headers = new Headers()
      const refererBase = `https://${targetUrl.hostname}`

      // Critical headers for bypassing hotlink protection
      headers.set('Referer', refererBase + '/')
      headers.set('Origin', refererBase)

      // Use fixed browser User-Agent (not client's - avoids detection)
      headers.set('User-Agent', BROWSER_USER_AGENT)

      // Additional headers to appear more browser-like
      headers.set('Accept', 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5')
      headers.set('Accept-Language', 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7')
      headers.set('Accept-Encoding', 'identity') // Don't compress video
      headers.set('Sec-Fetch-Dest', 'video')
      headers.set('Sec-Fetch-Mode', 'no-cors')
      headers.set('Sec-Fetch-Site', 'same-origin')
      headers.set('Sec-Ch-Ua', '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"')
      headers.set('Sec-Ch-Ua-Mobile', '?0')
      headers.set('Sec-Ch-Ua-Platform', '"Windows"')

      // Remove headers that might reveal proxy
      headers.delete('CF-Connecting-IP')
      headers.delete('X-Forwarded-For')
      headers.delete('X-Real-IP')

      // Handle Range requests for video streaming
      const rangeHeader = request.headers.get('Range')
      if (rangeHeader) {
        headers.set('Range', rangeHeader)
      }

      // Fetch the video from origin
      const response = await fetch(targetUrl.toString(), {
        headers,
        redirect: 'follow',
        cf: {
          // Cache in Cloudflare CDN
          cacheTtl: 86400, // 24 hours
          cacheEverything: true,
        },
      })

      if (!response.ok && response.status !== 206) {
        return new Response(`Origin returned ${response.status}`, {
          status: response.status,
        })
      }

      // Validate content type (must be video)
      const contentType = response.headers.get('Content-Type') || ''
      const isVideo = ALLOWED_CONTENT_TYPES.some(type =>
        contentType.toLowerCase().startsWith(type)
      )

      if (!isVideo) {
        return new Response(`Invalid content type: ${contentType}`, {
          status: 415,
        })
      }

      // Check file size
      const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10)
      if (contentLength > MAX_FILE_SIZE) {
        return new Response(`File too large: ${contentLength} bytes`, {
          status: 413,
        })
      }

      // Build response headers
      const responseHeaders = new Headers()
      responseHeaders.set('Content-Type', contentType)
      responseHeaders.set('Access-Control-Allow-Origin', '*')
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      responseHeaders.set('Access-Control-Allow-Headers', 'Range')
      responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range')

      // Pass through relevant headers for streaming
      const passHeaders = ['Content-Length', 'Content-Range', 'Accept-Ranges']
      for (const header of passHeaders) {
        const value = response.headers.get(header)
        if (value) {
          responseHeaders.set(header, value)
        }
      }

      // Cache control
      responseHeaders.set('Cache-Control', 'public, max-age=86400')

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      })
    } catch (error) {
      return new Response(`Proxy error: ${error.message}`, { status: 500 })
    }
  },
}

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Max-Age': '86400',
    },
  })
}
