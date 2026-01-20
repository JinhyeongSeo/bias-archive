import { motion } from 'framer-motion';
import type { Platform } from '@/types/index';
import { pressScale } from '@/lib/animations';

interface SearchFiltersProps {
  platforms: {
    id: Platform;
    label: string;
    color: string;
    bgColor: string;
    ringColor: string;
  }[];
  enabledPlatforms: Set<Platform>;
  togglePlatform: (platform: Platform) => void;
  t: (key: string) => string;
}

export function SearchFilters({
  platforms,
  enabledPlatforms,
  togglePlatform,
  t,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {platforms.map((platform) => {
        const isEnabled = enabledPlatforms.has(platform.id);
        return (
          <motion.button
            key={platform.id}
            onClick={() => togglePlatform(platform.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isEnabled
                ? `${platform.bgColor} ${platform.color} border-transparent shadow-sm`
                : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {platform.label}
          </motion.button>
        );
      })}
    </div>
  );
}
