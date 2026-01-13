-- Add author_name column to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS author_name TEXT;
