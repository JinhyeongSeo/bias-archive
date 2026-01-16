-- Migration: Add next_max_time_id column to search_cache for selca pagination
-- selca.kastden.org uses max_time_id based forward-only pagination

-- Add next_max_time_id column
ALTER TABLE search_cache
ADD COLUMN IF NOT EXISTS next_max_time_id TEXT;

-- Update platform check constraint to include selca
-- (selca was added in a previous migration but needs to be included here for completeness)
ALTER TABLE search_cache
DROP CONSTRAINT IF EXISTS search_cache_platform_check;

ALTER TABLE search_cache
ADD CONSTRAINT search_cache_platform_check
CHECK (platform IN ('youtube', 'twitter', 'heye', 'kgirls', 'kgirls-issue', 'selca'));

-- Same for user_search_viewed
ALTER TABLE user_search_viewed
DROP CONSTRAINT IF EXISTS user_search_viewed_platform_check;

ALTER TABLE user_search_viewed
ADD CONSTRAINT user_search_viewed_platform_check
CHECK (platform IN ('youtube', 'twitter', 'heye', 'kgirls', 'kgirls-issue', 'selca'));
