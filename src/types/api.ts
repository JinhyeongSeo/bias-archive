import type { Platform, EnrichedResult } from './platforms';

/**
 * Common search parameters for links
 */
export interface SearchParams {
  biasId?: string;
  search?: string;
  tagIds?: string[];
  platform?: string;
}

/**
 * Search results state for a single platform
 */
export interface PlatformResults {
  platform: Platform;
  results: EnrichedResult[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  currentPage: number;
  currentOffset: number; // For heye/kgirls pagination within page
  nextPageToken?: string; // For YouTube pagination
  nextCursor?: string; // For Twitter (ScrapeBadger) pagination
  nextMaxTimeId?: string; // For selca pagination
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: string;
}

/**
 * Batch update tags request
 */
export interface BatchTagUpdateRequest {
  linkIds: string[];
  addTags?: string[];
  removeTags?: string[];
}

/**
 * Reorder items request
 */
export interface ReorderRequest {
  orderedIds: string[];
}

