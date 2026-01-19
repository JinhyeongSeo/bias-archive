-- Add archived_thumbnail_url column for storing Wayback URL of thumbnail image
ALTER TABLE links ADD COLUMN IF NOT EXISTS archived_thumbnail_url TEXT DEFAULT NULL;
-- Wayback Machine URL for the thumbnail image (separate from page archive_url)

-- Add archived_url column to link_media for storing Wayback URL of each media item
ALTER TABLE link_media ADD COLUMN IF NOT EXISTS archived_url TEXT DEFAULT NULL;
-- Wayback Machine URL for individual media items (images/videos)
