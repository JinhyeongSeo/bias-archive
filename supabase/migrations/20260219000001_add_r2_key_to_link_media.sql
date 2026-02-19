-- R2 스토리지 key 추가 (미디어 백업용)
ALTER TABLE link_media ADD COLUMN r2_key TEXT;

-- r2_key로 빠른 조회를 위한 인덱스
CREATE INDEX idx_link_media_r2_key ON link_media (r2_key) WHERE r2_key IS NOT NULL;
