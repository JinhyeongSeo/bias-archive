-- link_media 테이블 - 링크별 다중 미디어 저장
-- Twitter 여러 이미지 등을 지원하기 위한 테이블
CREATE TABLE link_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'gif')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_link_media_link_id ON link_media(link_id);
CREATE INDEX idx_link_media_position ON link_media(link_id, position);
