-- Create groups table for organizing biases
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  name_ko TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger for groups
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add group_id FK to biases table
ALTER TABLE biases
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Create index for faster group lookups
CREATE INDEX IF NOT EXISTS idx_biases_group_id ON biases(group_id);

-- Create index for group name lookups
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
