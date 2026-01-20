import { motion } from 'framer-motion';
import type { Platform, PlatformResults } from '@/types/index';

interface PlatformTabsProps {
  platforms: {
    id: Platform;
    label: string;
    color: string;
    bgColor: string;
  }[];
  enabledPlatforms: Set<Platform>;
  platformResults: Map<Platform, PlatformResults>;
  activePlatform: Platform;
  setActivePlatform: (platform: Platform) => void;
}

export function PlatformTabs({
  platforms,
  enabledPlatforms,
  platformResults,
  activePlatform,
  setActivePlatform,
}: PlatformTabsProps) {
  const enabledPlatformsList = platforms.filter(p => enabledPlatforms.has(p.id));

  return (
    <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar">
      {enabledPlatformsList.map((platform) => {
        const results = platformResults.get(platform.id)?.results || [];
        const isActive = activePlatform === platform.id;
        
        return (
          <button
            key={platform.id}
            onClick={() => setActivePlatform(platform.id)}
            className={`flex-none px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
              isActive
                ? platform.color
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              {platform.label}
              {results.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? platform.bgColor : 'bg-muted text-muted-foreground'
                }`}>
                  {results.length}
                </span>
              )}
            </div>
            {isActive && (
              <motion.div
                layoutId="activePlatformTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${platform.color.replace('text-', 'bg-')}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
