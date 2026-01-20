import { motion, AnimatePresence } from 'framer-motion';
import type { Bias, Group, BiasWithGroup } from '@/types/index';
import { quickSpring, pressScale } from '@/lib/animations';

interface SearchInputProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  isIdolDropdownOpen: boolean;
  setIsIdolDropdownOpen: (open: boolean) => void;
  getSelectionDisplayName: () => string;
  groupedBiases: Map<string | null, BiasWithGroup[]>;
  collapsedDropdownGroups: Set<string>;
  toggleDropdownGroupCollapse: (groupId: string) => void;
  handleSelection: (selection: { type: 'bias' | 'group', id: string }) => void;
  getGroupDisplayName: (group: Group) => string;
  getDisplayName: (bias: Bias) => string;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  dropdownButtonRef: React.RefObject<HTMLButtonElement | null>;
  dropdownPosition: { top: number, left: number, width: number };
  t: (key: string) => string;
}

export function SearchInput({
  query,
  setQuery,
  onSearch,
  isSearching,
  isIdolDropdownOpen,
  setIsIdolDropdownOpen,
  getSelectionDisplayName,
  groupedBiases,
  collapsedDropdownGroups,
  toggleDropdownGroupCollapse,
  handleSelection,
  getGroupDisplayName,
  getDisplayName,
  dropdownRef,
  dropdownButtonRef,
  dropdownPosition,
  t,
}: SearchInputProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-30">
      <div className="relative flex-1" ref={dropdownRef}>
        <button
          ref={dropdownButtonRef}
          onClick={() => setIsIdolDropdownOpen(!isIdolDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm font-medium text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-smooth"
        >
          <span className="truncate">{getSelectionDisplayName()}</span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              isIdolDropdownOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {isIdolDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed z-[100] mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }}
            >
              <div className="p-2 space-y-1">
                {Array.from(groupedBiases.entries()).map(([groupId, biasesInGroup]) => {
                  const group = biasesInGroup[0].group;
                  const isCollapsed = groupId ? collapsedDropdownGroups.has(groupId) : false;
                  
                  return (
                    <div key={groupId || 'ungrouped'} className="space-y-1">
                      {group ? (
                        <>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleDropdownGroupCollapse(group.id)}
                              className="p-1 hover:bg-accent rounded transition-colors"
                            >
                              <motion.svg
                                className="w-3 h-3 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                animate={{ rotate: isCollapsed ? 0 : 90 }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </motion.svg>
                            </button>
                            <button
                              onClick={() => handleSelection({ type: 'group', id: group.id })}
                              className="flex-1 text-left px-2 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                            >
                              {getGroupDisplayName(group)}
                            </button>
                          </div>
                          {!isCollapsed && (
                            <div className="ml-4 space-y-1">
                              {biasesInGroup.map((bias) => (
                                <button
                                  key={bias.id}
                                  onClick={() => handleSelection({ type: 'bias', id: bias.id })}
                                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent text-foreground transition-colors"
                                >
                                  {getDisplayName(bias)}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-1 pt-1">
                          {biasesInGroup.map((bias) => (
                            <button
                              key={bias.id}
                              onClick={() => handleSelection({ type: 'bias', id: bias.id })}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent text-foreground transition-colors font-medium"
                            >
                              {getDisplayName(bias)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex-[2]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder={t('searchPlaceholder')}
          className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <motion.button
        onClick={onSearch}
        disabled={isSearching || !query.trim()}
        className="px-8 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
        {...pressScale}
      >
        {isSearching ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{t('searching')}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>{t('search')}</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
