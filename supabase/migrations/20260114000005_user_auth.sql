-- Migration: Add user_id columns and RLS policies for multi-user support
-- This enables Row Level Security for all tables to support authenticated users

-- =====================================================
-- 1. Add user_id columns to all tables
-- =====================================================

-- biases table
ALTER TABLE biases
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- links table
ALTER TABLE links
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- tags table
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- link_tags table
ALTER TABLE link_tags
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- link_media table
ALTER TABLE link_media
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 2. Create indexes for user_id columns
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_biases_user_id ON biases(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_link_tags_user_id ON link_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_link_media_user_id ON link_media(user_id);

-- =====================================================
-- 3. Enable Row Level Security on all tables
-- =====================================================

ALTER TABLE biases ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_media ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS Policies for biases table
-- =====================================================

-- SELECT: Allow reading own data OR data with null user_id (existing/public data)
CREATE POLICY "biases_select_policy" ON biases
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- INSERT: Only authenticated users can insert (with their user_id)
CREATE POLICY "biases_insert_policy" ON biases
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only owner can update their data
CREATE POLICY "biases_update_policy" ON biases
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Only owner can delete their data
CREATE POLICY "biases_delete_policy" ON biases
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. RLS Policies for groups table
-- =====================================================

CREATE POLICY "groups_select_policy" ON groups
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "groups_insert_policy" ON groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "groups_update_policy" ON groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "groups_delete_policy" ON groups
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. RLS Policies for links table
-- =====================================================

CREATE POLICY "links_select_policy" ON links
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "links_insert_policy" ON links
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "links_update_policy" ON links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "links_delete_policy" ON links
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. RLS Policies for tags table
-- =====================================================

CREATE POLICY "tags_select_policy" ON tags
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "tags_insert_policy" ON tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tags_update_policy" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tags_delete_policy" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 8. RLS Policies for link_tags table
-- =====================================================

CREATE POLICY "link_tags_select_policy" ON link_tags
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "link_tags_insert_policy" ON link_tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "link_tags_update_policy" ON link_tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "link_tags_delete_policy" ON link_tags
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 9. RLS Policies for link_media table
-- =====================================================

CREATE POLICY "link_media_select_policy" ON link_media
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "link_media_insert_policy" ON link_media
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "link_media_update_policy" ON link_media
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "link_media_delete_policy" ON link_media
  FOR DELETE USING (auth.uid() = user_id);
