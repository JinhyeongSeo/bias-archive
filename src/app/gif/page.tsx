'use client'

import { GifMaker } from '@/components/GifMaker'

export default function GifPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center justify-center gap-3">
            <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            GIF 생성기
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            비디오에서 원하는 구간을 선택해 GIF로 변환하세요
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            브라우저에서 직접 처리되어 서버로 파일이 전송되지 않습니다
          </p>
        </div>

        {/* GIF Maker Component */}
        <GifMaker />

        {/* Instructions */}
        <div className="mt-12 p-6 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            사용 방법
          </h2>
          <ol className="space-y-3 text-zinc-600 dark:text-zinc-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">1</span>
              <span>비디오 파일을 드래그하거나 클릭해서 업로드합니다</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">2</span>
              <span>시작 시간과 지속 시간을 슬라이더로 조절합니다</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">3</span>
              <span>필요하면 FPS와 너비를 조절해 파일 크기를 최적화합니다</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">4</span>
              <span>&quot;GIF 생성&quot; 버튼을 클릭하고 완료될 때까지 기다립니다</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">5</span>
              <span>생성된 GIF를 미리보고 다운로드합니다</span>
            </li>
          </ol>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            팁
          </h3>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>짧은 구간 (2-5초)이 최적의 GIF를 만듭니다</li>
            <li>FPS를 낮추면 파일 크기가 줄어듭니다</li>
            <li>너비를 320px 이하로 설정하면 로딩이 빨라집니다</li>
            <li>첫 변환은 FFmpeg 로딩으로 시간이 더 걸릴 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
