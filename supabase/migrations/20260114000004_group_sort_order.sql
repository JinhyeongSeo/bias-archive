-- Add sort_order column to groups table for drag & drop reordering
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_groups_sort_order ON groups(sort_order);
