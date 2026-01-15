-- Migration: Add search cache tables for shared caching with per-user viewed state
-- search_cache: Global shared cache for search results (saves API costs)
-- user_search_viewed: Per-user tracking of how much they've seen

-- =====================================================
-- 1. Create search_cache table (global, shared)
-- =====================================================

CREATE TABLE search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'twitter', 'heye', 'kgirls')),
  results JSONB NOT NULL DEFAULT '[]',
  next_cursor TEXT,           -- Twitter (ScrapeBadger)
  next_page_token TEXT,       -- YouTube
  current_page INTEGER NOT NULL DEFAULT 1,
  current_offset INTEGER NOT NULL DEFAULT 0,
  has_more BOOLEAN NOT NULL DEFAULT true,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint: one cache entry per query+platform
  CONSTRAINT search_cache_query_platform_unique UNIQUE (query, platform)
);

-- Index for fast lookups and TTL cleanup
CREATE INDEX idx_search_cache_query ON search_cache(query);
CREATE INDEX idx_search_cache_cached_at ON search_cache(cached_at);

-- =====================================================
-- 2. Create user_search_viewed table (per-user)
-- =====================================================

CREATE TABLE user_search_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'twitter', 'heye', 'kgirls')),
  displayed_index INTEGER NOT NULL DEFAULT 0,  -- How many results the user has seen
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint: one entry per user+query+platform
  CONSTRAINT user_search_viewed_unique UNIQUE (user_id, query, platform)
);

-- Index for fast lookups
CREATE INDEX idx_user_search_viewed_user_id ON user_search_viewed(user_id);
CREATE INDEX idx_user_search_viewed_query ON user_search_viewed(user_id, query);

-- =====================================================
-- 3. Enable RLS
-- =====================================================

ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_viewed ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS Policies for search_cache (public read, authenticated write)
-- =====================================================

-- SELECT: Anyone can read cache (it's shared)
CREATE POLICY "search_cache_select_policy" ON search_cache
  FOR SELECT USING (true);

-- INSERT: Authenticated users can insert
CREATE POLICY "search_cache_insert_policy" ON search_cache
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Authenticated users can update (for appending results)
CREATE POLICY "search_cache_update_policy" ON search_cache
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- DELETE: Only for cleanup (could restrict to service role if needed)
CREATE POLICY "search_cache_delete_policy" ON search_cache
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 5. RLS Policies for user_search_viewed (user's own data only)
-- =====================================================

-- SELECT: Users can only read their own viewed state
CREATE POLICY "user_search_viewed_select_policy" ON user_search_viewed
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own data
CREATE POLICY "user_search_viewed_insert_policy" ON user_search_viewed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own data
CREATE POLICY "user_search_viewed_update_policy" ON user_search_viewed
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own data
CREATE POLICY "user_search_viewed_delete_policy" ON user_search_viewed
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. Function to clean up expired cache (24 hours)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_search_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM search_cache
  WHERE cached_at < now() - INTERVAL '24 hours';

  -- Also clean up viewed state for expired caches
  DELETE FROM user_search_viewed
  WHERE viewed_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
