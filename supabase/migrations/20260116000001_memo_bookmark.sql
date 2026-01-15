-- 메모 & 북마크 기능 추가
-- 각 링크에 개인 메모와 즐겨찾기(starred) 필드 추가

ALTER TABLE links ADD COLUMN memo TEXT;
ALTER TABLE links ADD COLUMN starred BOOLEAN DEFAULT false;

-- starred 필드에 인덱스 추가 (즐겨찾기 필터링 최적화)
CREATE INDEX idx_links_starred ON links(starred) WHERE starred = true;

-- 코멘트 추가
COMMENT ON COLUMN links.memo IS '사용자 개인 메모';
COMMENT ON COLUMN links.starred IS '즐겨찾기 여부';
