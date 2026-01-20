import type { Platform } from './platforms';

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
