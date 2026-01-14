# Phase 21: Design Overhaul - Discovery

## Research Summary

토스 스타일 애니메이션과 트렌디한 디자인 구현을 위한 기술 조사 결과입니다.

## Key Findings

### 1. Animation Library: Framer Motion (Motion)

**선택 이유:**
- React 생태계 표준 애니메이션 라이브러리
- 토스 내부 Rally 라이브러리도 Framer 기반 인스펙터 활용
- 월 1,200만 다운로드, 빠르게 성장하는 라이브러리
- Next.js App Router와 완전 호환

**설치:**
```bash
npm install framer-motion
```

### 2. 토스 인터랙션 디자인 원칙

1. **피드백 명확성**: 유저가 터치/클릭했을 때 즉각적인 시각적 피드백
2. **행동 유도**: 어떤 행동을 해야 하는지 직관적으로 표시
3. **상태 전달**: 화면에서 일어나는 일을 자연스럽게 전달

### 3. Animation Specification

**토스 Rally 스타일 참고:**
- `bezier.expo`: 급격한 가속/감속 곡선
- `spring.quick`: 빠른 스프링 (일반적인 UI 전환)
- `spring.basic`: 기본 스프링 (부드러운 전환)

**Framer Motion 구현:**
```typescript
// 빠른 전환 (버튼 누름, 작은 상호작용)
const quickTransition = { type: 'spring', stiffness: 400, damping: 30 }

// 기본 전환 (카드 나타남, 모달 열림)
const basicTransition = { type: 'spring', stiffness: 300, damping: 25 }

// 부드러운 전환 (페이지 전환, 큰 요소)
const smoothTransition = { type: 'spring', stiffness: 200, damping: 20 }

// Easing 곡선 (fade, opacity 변경용)
const easeOut = [0.16, 1, 0.3, 1]  // ease-out expo
```

**Duration 가이드라인:**
- 마이크로 UI 변화: 150-250ms
- 일반 UI 전환: 250-400ms
- 모달/페이지 전환: 300-500ms

### 4. 구현 컴포넌트

**Shared Animation Variants:**
```typescript
// 페이드 인
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

// 스케일 + 페이드
const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

// 슬라이드 업
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
}

// 프레스 효과 (버튼)
const press = {
  whileTap: { scale: 0.97 }
}
```

### 5. Skeleton Loading

**Tailwind 기본 animate-pulse 활용:**
```html
<div class="animate-pulse bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
```

**Skeleton 컴포넌트 패턴:**
- 실제 콘텐츠와 동일한 레이아웃 유지
- 카드, 리스트, 이미지 각각 스켈레톤 제공
- 로딩 시간과 스켈레톤 지속 시간 일치

### 6. 컬러 팔레트 개선

**현재:** zinc 기반 neutral 팔레트
**개선:** 토스 스타일 블루 액센트 + 부드러운 회색

```css
/* 토스 스타일 컬러 */
--toss-blue: #3182f6
--toss-blue-light: #e8f3ff
--toss-gray-50: #f9fafb
--toss-gray-100: #f2f4f6
--toss-gray-200: #e5e8eb
--toss-gray-500: #8b95a1
--toss-gray-900: #191f28
```

### 7. 타이포그래피

**현재:** Geist Sans (기본)
**유지:** Geist Sans는 모던하고 토스와 유사한 산세리프체

### 8. 구현 범위

**Phase 21에서 구현할 항목:**
1. Animation 시스템 (variants, transitions)
2. 버튼/카드 프레스 효과
3. 모달 애니메이션 개선
4. 리스트 아이템 stagger 애니메이션
5. Skeleton 로딩 컴포넌트
6. 컬러 팔레트 업데이트

**향후 고려 (이번 phase 범위 외):**
- 페이지 전환 애니메이션 (App Router layout 제약)
- 제스처 기반 인터랙션 (스와이프 등)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Animation Library | Framer Motion | React 표준, 토스 호환, 성숙한 생태계 |
| Spring vs Duration | Spring 우선 | 더 자연스러운 물리 기반 모션 |
| Skeleton 방식 | Tailwind animate-pulse | 추가 의존성 불필요, 충분한 품질 |
| 컬러 변경 범위 | 액센트만 변경 | 기존 zinc 유지, blue 계열만 토스 스타일로 |

## Implementation Approach

1. **Animation Primitives 우선**: 재사용 가능한 애니메이션 상수/variants 먼저 정의
2. **점진적 적용**: 핵심 컴포넌트부터 순차적으로 적용
3. **접근성 고려**: `prefers-reduced-motion` 미디어 쿼리 지원

## Risk Assessment

- **번들 크기**: framer-motion ~30KB (gzip), 수용 가능한 수준
- **SSR 호환성**: 'use client' 컴포넌트에서만 사용, 문제 없음
- **성능**: transform/opacity만 애니메이션, 레이아웃 속성 회피

## Sources

- [Motion (Framer Motion) 공식 문서](https://motion.dev/)
- [토스 인터랙션 디자인](https://toss.tech/article/interaction)
- [Framer Motion + Tailwind 2025](https://dev.to/manukumar07/framer-motion-tailwind-the-2025-animation-stack-1801)
- [Tailwind CSS Skeleton](https://tailwindcss.com/docs/animation)
