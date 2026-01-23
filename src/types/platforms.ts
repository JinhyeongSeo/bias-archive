/**
 * Supported platforms in the application
 */
export type Platform =
  | 'youtube'
  | 'twitter'
  | 'weverse'
  | 'heye'
  | 'kgirls'
  | 'kgirls-issue'
  | 'selca'
  | 'instagram'
  | 'tiktok'
  | 'generic'
  | 'other';

/**
 * Platforms supported by the search cache
 */
export type SearchCachePlatform =
  | 'youtube'
  | 'twitter'
  | 'heye'
  | 'kgirls'
  | 'kgirls-issue'
  | 'selca'
  | 'instagram'
  | 'tiktok';

/**
 * Media types supported
 */
export type MediaType = 'image' | 'video' | 'gif';

/**
 * Common media type for parsed results
 */
export interface ParsedMedia {
  type: MediaType;
  url: string;
}

/**
 * YouTube search result item
 */
export interface YouTubeResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
}

/**
 * Twitter search result item
 */
export interface TwitterResult {
  link: string;
  title: string;
  snippet: string;
  thumbnailUrl?: string;
  authorName?: string;
  media?: ParsedMedia[];
}

/**
 * Heye search result item
 */
export interface HeyeResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
}

/**
 * Kgirls search result item
 */
export interface KgirlsResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
}

/**
 * Selca search result item
 */
export interface SelcaResult {
  url: string;
  title: string;
  thumbnailUrl: string;
  author: string;
}

/**
 * Instagram search result item
 */
export interface InstagramResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
  media?: ParsedMedia[];
}

/**
 * TikTok search result item
 */
export interface TikTokResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
  media?: ParsedMedia[];
}

/**
 * Community search results (Heye, Kgirls) - Generic interface
 */
export interface CommunitySearchResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
}

/**
 * Unified result format used in UnifiedSearch
 */
export interface EnrichedResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
  platform: Platform;
  publishedAt?: string;
  isSaved: boolean;
  isSaving: boolean;
  media?: ParsedMedia[];
}
