/**
 * Platform-specific metadata parsers
 * Central export for all parser modules
 */

import type { Platform, MediaType, ParsedMedia } from '@/types/index'

export type { Platform, MediaType, ParsedMedia }

export interface VideoMetadata {
  title: string | null
  description: string | null
  thumbnailUrl: string | null
  platform: Platform
  originalDate: string | null
  authorName: string | null
  media?: ParsedMedia[]
}

export { parseYouTube } from './youtube'
export { parseTwitter } from './twitter'
export { parseWeverse } from './weverse'
export { parseHeye } from './heye'
export { parseKgirls } from './kgirls'
export { parseGeneric } from './generic'
export { parseInstagram } from './instagram'
export { parseTikTok } from './tiktok'
