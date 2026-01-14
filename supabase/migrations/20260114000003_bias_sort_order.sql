-- Add sort_order column to biases table for drag & drop reordering
ALTER TABLE biases ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Populate sort_order for existing data based on created_at order (oldest first = 1)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM biases
)
UPDATE biases
SET sort_order = numbered.rn
FROM numbered
WHERE biases.id = numbered.id AND biases.sort_order IS NULL;

-- Create index for faster sorting queries
CREATE INDEX IF NOT EXISTS idx_biases_sort_order ON biases(sort_order);
