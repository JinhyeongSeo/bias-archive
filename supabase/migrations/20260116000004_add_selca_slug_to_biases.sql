-- Add selca_slug column to biases table
ALTER TABLE biases ADD COLUMN selca_slug text;

-- Create index for faster lookups
CREATE INDEX idx_biases_selca_slug ON biases(selca_slug);

-- Add comment
COMMENT ON COLUMN biases.selca_slug IS 'selca.kastden.org idol slug (e.g., aespa_winter)';
