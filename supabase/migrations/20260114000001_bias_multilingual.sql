-- Add multilingual name fields to biases table
-- name_en: English name (for international display)
-- name_ko: Korean name (for Korean display and tag matching)

-- Add new columns
ALTER TABLE biases ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE biases ADD COLUMN IF NOT EXISTS name_ko TEXT;

-- Migrate existing data: copy current name to name_ko
-- (existing names are in Korean from Phase 10 kpopnet integration)
UPDATE biases SET name_ko = name WHERE name_ko IS NULL;
