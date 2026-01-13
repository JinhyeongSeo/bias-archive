'use client'

type LayoutType = 'grid' | 'list'

interface LayoutToggleProps {
  layout: LayoutType
  onChange: (layout: LayoutType) => void
}

export function LayoutToggle({ layout, onChange }: LayoutToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
      {/* Grid button */}
      <button
        onClick={() => onChange('grid')}
        className={`p-2 rounded-md transition-colors ${
          layout === 'grid'
            ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
        }`}
        title="그리드 뷰"
        aria-label="그리드 뷰"
        aria-pressed={layout === 'grid'}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>

      {/* List button */}
      <button
        onClick={() => onChange('list')}
        className={`p-2 rounded-md transition-colors ${
          layout === 'list'
            ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
        }`}
        title="리스트 뷰"
        aria-label="리스트 뷰"
        aria-pressed={layout === 'list'}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  )
}
