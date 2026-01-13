export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold">내 최애 아카이브</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          직캠과 사진 링크를 태그별로 정리하세요
        </p>
      </main>
    </div>
  );
}
