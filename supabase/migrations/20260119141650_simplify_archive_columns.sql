-- Simplify archive columns
-- Remove individual media archive URLs - now we only archive the original page URL

-- Drop archived_thumbnail_url from links (no longer needed - we archive page, not thumbnail)
ALTER TABLE links DROP COLUMN IF EXISTS archived_thumbnail_url;

-- Drop archived_url from link_media (no longer archiving individual media files)
ALTER TABLE link_media DROP COLUMN IF EXISTS archived_url;

-- Note: links.archived_url is kept - this stores the archive.org URL of the original page
