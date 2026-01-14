/**
 * API utilities for handling common response patterns
 */

/**
 * Handle API response and redirect to login if unauthorized
 * Returns the response if OK, throws error otherwise
 */
export async function handleApiResponse<T>(
  response: Response,
  locale: string = 'ko'
): Promise<T> {
  if (response.status === 401) {
    // Redirect to login page
    window.location.href = `/${locale}/login`
    throw new Error('로그인이 필요합니다')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || '요청에 실패했습니다')
  }

  return data as T
}

/**
 * Wrapper for fetch that handles 401 redirects
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
  locale: string = 'ko'
): Promise<T> {
  const response = await fetch(url, options)
  return handleApiResponse<T>(response, locale)
}
