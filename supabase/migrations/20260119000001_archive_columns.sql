-- Add archive columns to links table for Internet Archive backup
ALTER TABLE links ADD COLUMN IF NOT EXISTS archive_status TEXT DEFAULT NULL;
-- NULL: not archived, 'pending': in progress, 'archived': completed, 'failed': failed

ALTER TABLE links ADD COLUMN IF NOT EXISTS archive_url TEXT DEFAULT NULL;
-- Wayback Machine archive URL

ALTER TABLE links ADD COLUMN IF NOT EXISTS archive_job_id TEXT DEFAULT NULL;
-- SPN2 job ID for status checking

ALTER TABLE links ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
-- Archive completion timestamp
