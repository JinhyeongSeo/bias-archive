-- 최애 (bias) 테이블 - 추적할 아이돌/멤버
CREATE TABLE biases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  group_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 링크 테이블 - 핵심 엔티티
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  platform TEXT, -- 'youtube', 'twitter', 'weverse', etc.
  original_date DATE, -- 콘텐츠 원본 날짜
  bias_id UUID REFERENCES biases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 태그 테이블
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 링크-태그 다대다 관계
CREATE TABLE link_tags (
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (link_id, tag_id)
);

-- 인덱스
CREATE INDEX idx_links_bias_id ON links(bias_id);
CREATE INDEX idx_links_platform ON links(platform);
CREATE INDEX idx_links_original_date ON links(original_date);
CREATE INDEX idx_link_tags_tag_id ON link_tags(tag_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER biases_updated_at
  BEFORE UPDATE ON biases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER links_updated_at
  BEFORE UPDATE ON links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
