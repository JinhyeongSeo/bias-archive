-- Migration: Add 'selca' to platform check constraints
-- This allows searching selca.kastden.org for K-pop idol media

-- =====================================================
-- 1. Update search_cache platform constraint
-- =====================================================

ALTER TABLE search_cache
  DROP CONSTRAINT IF EXISTS search_cache_platform_check;

ALTER TABLE search_cache
  ADD CONSTRAINT search_cache_platform_check
  CHECK (platform IN ('youtube', 'twitter', 'heye', 'kgirls', 'kgirls-issue', 'selca'));

-- =====================================================
-- 2. Update user_search_viewed platform constraint
-- =====================================================

ALTER TABLE user_search_viewed
  DROP CONSTRAINT IF EXISTS user_search_viewed_platform_check;

ALTER TABLE user_search_viewed
  ADD CONSTRAINT user_search_viewed_platform_check
  CHECK (platform IN ('youtube', 'twitter', 'heye', 'kgirls', 'kgirls-issue', 'selca'));
