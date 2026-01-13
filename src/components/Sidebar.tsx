'use client'

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 h-[calc(100vh-3.5rem)] border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
          최애 목록
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          아직 최애가 없습니다
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
          태그
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          태그가 없습니다
        </p>
      </section>
    </aside>
  )
}
