/**
 * Platform-specific metadata parsers
 * Central export for all parser modules
 */

export type Platform = 'youtube' | 'twitter' | 'weverse' | 'heye' | 'kgirls' | 'selca' | 'instagram' | 'other'

export type MediaType = 'image' | 'video' | 'gif'

export interface ParsedMedia {
  url: string
  type: MediaType
}

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
