# Phase 16: Drag & Drop Reorder - Discovery

## Research Summary

**Date:** 2026-01-14
**Discovery Level:** 2 (Standard Research)
**Topic:** React 드래그 앤 드롭 라이브러리 선택

## Library Comparison

| 라이브러리 | React 19 지원 | Next.js 15 | 터치 지원 | 번들 크기 | 러닝 커브 |
|-----------|-------------|------------|----------|----------|----------|
| @hello-pangea/dnd | v18.0.0+ (2025-02) | O | O (내장) | ~30KB | 낮음 |
| @dnd-kit/core | 미지원 (이슈 열림) | 문제 있음 | O | ~10KB | 중간 |
| pragmatic-drag-and-drop | O | O | O | ~5KB | 높음 (headless) |

## Decision: @hello-pangea/dnd

### 선택 이유

1. **React 19 공식 지원**: v18.0.0 (2025-02-09)부터 React 19 지원
2. **리스트 순서 변경 최적화**: react-beautiful-dnd 포크로 리스트 DnD에 특화
3. **터치/키보드 내장 지원**: 별도 설정 없이 모바일 터치 및 키보드 접근성 지원
4. **낮은 러닝 커브**: 설정 최소화, 빠른 구현 가능
5. **활발한 유지보수**: 커뮤니티 주도 포크로 지속 업데이트

### 대안 분석

- **@dnd-kit/core**: 더 유연하지만 React 19 지원 미비 (GitHub 이슈 #1511 열림)
- **pragmatic-drag-and-drop**: 번들 크기 최소지만 headless로 구현 복잡도 높음

## Implementation Plan

### DB Schema Changes

`biases` 테이블과 `tags` 테이블에 `sort_order` 컬럼 추가:

```sql
-- biases 테이블
ALTER TABLE biases ADD COLUMN IF NOT EXISTS sort_order INTEGER;
UPDATE biases SET sort_order = (SELECT COUNT(*) FROM biases b2 WHERE b2.created_at <= biases.created_at) WHERE sort_order IS NULL;

-- tags 테이블 (필요시)
-- tags는 link_tags를 통해 링크와 연결되므로, 태그 자체의 순서보다는 UI에서 표시 순서가 중요
```

### Components to Modify

1. **BiasManager.tsx**: 최애 목록 드래그 순서 변경
2. **Sidebar.tsx**: 태그 필터 순서 변경 (선택적)
3. **New API Routes**:
   - `PUT /api/biases/reorder` - 최애 순서 업데이트
   - `PUT /api/tags/reorder` - 태그 순서 업데이트 (선택적)

### Package Installation

```bash
npm install @hello-pangea/dnd
```

## References

- [hello-pangea/dnd GitHub](https://github.com/hello-pangea/dnd)
- [React 19 Support Release](https://github.com/hello-pangea/dnd/releases/tag/v18.0.0)
- [Top 5 Drag-and-Drop Libraries](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)

## Scope Assessment

**Phase Scope:** 최애 목록 순서 변경에 집중 (태그 순서는 Phase 17 이후로 연기 가능)

**Tasks:**
1. @hello-pangea/dnd 설치 및 설정
2. biases 테이블 sort_order 컬럼 추가
3. BiasManager 드래그 앤 드롭 구현
4. 순서 변경 API 구현

**Estimated Plans:** 2 (스키마/API + UI 구현)
