-- Add selca_slug column to groups table for selca.kastden.org group search
-- NULL means no Selca group page exists for this group

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS selca_slug TEXT;

-- Add comment for documentation
COMMENT ON COLUMN groups.selca_slug IS 'selca.kastden.org group slug (e.g., "nmixx"). NULL if no Selca group page exists.';
