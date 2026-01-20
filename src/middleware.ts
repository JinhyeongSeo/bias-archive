import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { createClient } from '@/lib/supabase-middleware'

// next-intl middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // Run Supabase session refresh first
  // This refreshes expired tokens and updates cookies
  const { response: supabaseResponse } = await createClient(request)

  // Run next-intl middleware
  const intlResponse = intlMiddleware(request)

  // Merge cookies from supabase response into intl response
  // This ensures auth cookies are properly set
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    })
  })

  return intlResponse
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
