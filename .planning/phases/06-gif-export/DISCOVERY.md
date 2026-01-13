# Phase 6 Discovery: GIF & Export

## Research Summary

### FFmpeg.wasm (GIF 생성)

**Package:** @ffmpeg/ffmpeg + @ffmpeg/core (v0.12+)

**핵심 패턴:**
```typescript
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();
await ffmpeg.load();

// 파일 쓰기
await ffmpeg.writeFile('input.mp4', await fetchFile(file));

// GIF 변환
await ffmpeg.exec([
  '-i', 'input.mp4',
  '-ss', '0',           // 시작 시간
  '-t', '2.5',          // 지속 시간
  '-vf', 'fps=10,scale=320:-1:flags=lanczos',  // 프레임레이트, 크기
  '-f', 'gif',
  'out.gif'
]);

// 결과 읽기
const data = await ffmpeg.readFile('out.gif');
const blob = new Blob([data], { type: 'image/gif' });
```

**주의사항:**
- SharedArrayBuffer 필요 시 단일 스레드 버전 사용
- MEMFS 기반 가상 파일 시스템
- 진행률: `ffmpeg.on('progress', ({ progress }) => ...)`

**Sources:**
- https://github.com/ffmpegwasm/ffmpeg.wasm
- https://fireship.io/lessons/wasm-video-to-gif/
- https://ffmpegwasm.netlify.app/docs/getting-started/examples/

### next-intl (다국어)

**Package:** next-intl

**핵심 구조:**
```
src/
├── i18n/
│   ├── routing.ts      # 로케일 정의
│   └── request.ts      # 메시지 로드
├── middleware.ts       # 로케일 라우팅
├── app/
│   └── [locale]/       # 동적 로케일 세그먼트
│       ├── layout.tsx
│       └── page.tsx
messages/
├── ko.json
└── en.json
```

**핵심 패턴:**
```typescript
// routing.ts
export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko'
});

// 컴포넌트에서 사용
const t = useTranslations('namespace');
return <h1>{t('title')}</h1>;
```

**Sources:**
- https://next-intl.dev/docs/getting-started/app-router
- https://www.buildwithmatija.com/blog/nextjs-internationalization-guide-next-intl-2025

## Decisions

1. **FFmpeg.wasm 단일 스레드 버전 사용** - 브라우저 호환성 우선
2. **next-intl 사용** - Next.js App Router와 최적 통합
3. **URL 기반 로케일** - /ko, /en 경로 사용
4. **기본 언어 한국어** - 타겟 사용자 고려
