import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Centralized API error handler
 * Formats errors into a consistent JSON response
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code 
      },
      { status: error.statusCode }
    );
  }

  // Handle Supabase errors if they have a code
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    logger.error('Database error:', error);
    return NextResponse.json(
      { 
        error: '데이터베이스 오류가 발생했습니다', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }

  logger.error('Unhandled API error:', error);
  
  const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다';
  
  return NextResponse.json(
    { 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    },
    { status: 500 }
  );
}

/**
 * Helper to throw a 401 Unauthorized error
 */
export function unauthorized(message = '로그인이 필요합니다'): never {
  throw new ApiError(401, message, 'UNAUTHORIZED');
}

/**
 * Helper to throw a 400 Bad Request error
 */
export function badRequest(message: string, code = 'BAD_REQUEST'): never {
  throw new ApiError(400, message, code);
}

/**
 * Helper to throw a 404 Not Found error
 */
export function notFound(message = '요청한 리소스를 찾을 수 없습니다'): never {
  throw new ApiError(404, message, 'NOT_FOUND');
}

/**
 * Helper to throw a 403 Forbidden error
 */
export function forbidden(message = '접근 권한이 없습니다'): never {
  throw new ApiError(403, message, 'FORBIDDEN');
}
