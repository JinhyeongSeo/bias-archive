import { motion } from 'framer-motion';
import { pressScale } from '@/lib/animations';

interface KpopGroup {
  id: string;
  name: string;
  name_original: string;
  memberCount: number;
  source?: 'selca' | 'namuwiki';
}

interface KpopMember {
  id: string;
  name: string;
  name_original: string;
  hasSelcaOwner?: boolean;
}

interface MemberSelectorProps {
  isSearching: boolean;
  groupQuery: string;
  setGroupQuery: (query: string) => void;
  showDropdown: boolean;
  groupResults: KpopGroup[];
  selectedGroup: {
    id: string;
    name: string;
    nameOriginal: string;
    hasSelcaGroup?: boolean;
    selcaGroupSlug?: string;
    source?: 'selca' | 'namuwiki';
  } | null;
  setSelectedGroup: (group: any) => void;
  handleGroupSelect: (group: KpopGroup) => void;
  isLoadingMembers: boolean;
  groupMembers: KpopMember[];
  selectedMembers: Set<string>;
  toggleMember: (id: string) => void;
  toggleAllMembers: () => void;
  handleBatchAdd: () => void;
  isBatchAdding: boolean;
  resetGroupMode: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export function MemberSelector({
  isSearching,
  groupQuery,
  setGroupQuery,
  showDropdown,
  groupResults,
  selectedGroup,
  setSelectedGroup,
  handleGroupSelect,
  isLoadingMembers,
  groupMembers,
  selectedMembers,
  toggleMember,
  toggleAllMembers,
  handleBatchAdd,
  isBatchAdding,
  resetGroupMode,
  dropdownRef,
}: MemberSelectorProps) {
  return (
    <div className="space-y-2 pt-2">
      {!selectedGroup ? (
        <div className="relative" ref={dropdownRef}>
          <input
            type="text"
            value={groupQuery}
            onChange={(e) => setGroupQuery(e.target.value)}
            placeholder="그룹명 검색 (예: IVE, 아이브)"
            className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          {showDropdown && groupResults.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {groupResults.map((group) => (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => handleGroupSelect(group)}
                    className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent text-foreground"
                  >
                    <span className="font-medium">{group.name}</span>
                    {group.name_original !== group.name && (
                      <span className="text-muted-foreground ml-1">
                        ({group.name_original})
                      </span>
                    )}
                    <span className="text-muted-foreground ml-1 text-xs">
                      {group.memberCount}명
                    </span>
                    {group.source === 'selca' && (
                      <span className="ml-1 px-1 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                        selca
                      </span>
                    )}
                    {group.source === 'namuwiki' && (
                      <span className="ml-1 px-1 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                        나무위키
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {showDropdown && groupResults.length === 0 && groupQuery.trim() && !isSearching && (
            <div className="absolute z-10 w-full mt-1 px-2 py-1.5 bg-card border border-border rounded-md shadow-lg text-sm text-muted-foreground">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-medium text-foreground">
              {selectedGroup.name}
              {selectedGroup.nameOriginal !== selectedGroup.name && (
                <span className="text-muted-foreground ml-1 font-normal">
                  ({selectedGroup.nameOriginal})
                </span>
              )}
              {selectedGroup.source === 'selca' && (
                <span className="ml-1 px-1 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                  selca
                </span>
              )}
              {selectedGroup.source === 'namuwiki' && (
                <span className="ml-1 px-1 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                  나무위키
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedGroup(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              다른 그룹 선택
            </button>
          </div>

          {selectedGroup.source === 'namuwiki' && (
            <div className="px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md">
              <span className="font-medium">안내:</span> 나무위키에서 가져온 데이터입니다. 외부 검색(selca) 기능이 제한됩니다.
            </div>
          )}

          {isLoadingMembers ? (
            <div className="flex items-center justify-center py-4">
              <svg className="w-5 h-5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <>
              <div className="flex items-center px-2 py-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={selectedMembers.size === groupMembers.length && groupMembers.length > 0}
                    onChange={toggleAllMembers}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  전체 선택 ({selectedMembers.size}/{groupMembers.length})
                </label>
              </div>

              <ul className="space-y-0.5 max-h-48 overflow-y-auto">
                {groupMembers.map((member) => (
                  <li key={member.id}>
                    <label className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent rounded text-sm">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-foreground">{member.name}</span>
                      {member.name_original !== member.name && (
                        <span className="text-muted-foreground">
                          ({member.name_original})
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {selectedGroup && (
          <motion.button
            type="button"
            onClick={handleBatchAdd}
            disabled={isBatchAdding || selectedMembers.size === 0}
            className="flex-1 px-2 py-1.5 text-sm bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            {...pressScale}
          >
            {isBatchAdding ? '추가 중...' : `${selectedMembers.size}명 추가`}
          </motion.button>
        )}
        <motion.button
          type="button"
          onClick={resetGroupMode}
          className="px-2 py-1.5 text-sm text-muted-foreground bg-accent hover:bg-accent/80 rounded-md transition-colors"
          {...pressScale}
        >
          취소
        </motion.button>
      </div>
    </div>
  );
}
