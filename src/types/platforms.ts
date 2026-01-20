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
  | 'generic';

/**
 * Common media type for parsed results
 */
export interface ParsedMedia {
  type: 'image' | 'video' | 'gif';
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
 * Community search results (Heye, Kgirls)
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
