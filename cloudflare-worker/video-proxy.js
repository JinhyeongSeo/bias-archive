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

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const url = new URL(request.url)
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
      // Build request headers with proper Referer
      const headers = new Headers()
      headers.set('Referer', `https://${targetUrl.hostname}/`)
      headers.set('User-Agent', request.headers.get('User-Agent') || 'Mozilla/5.0')

      // Handle Range requests for video streaming
      const rangeHeader = request.headers.get('Range')
      if (rangeHeader) {
        headers.set('Range', rangeHeader)
      }

      // Fetch the video from origin
      const response = await fetch(targetUrl.toString(), {
        headers,
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
