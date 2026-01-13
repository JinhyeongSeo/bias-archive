import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <h1 className="text-lg font-bold">내 최애 아카이브</h1>
        <ThemeToggle />
      </div>
    </header>
  )
}
