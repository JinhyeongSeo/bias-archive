import { motion } from 'framer-motion';
import { pressScale } from '@/lib/animations';

interface KpopMemberWithGroup {
  id: string;
  name: string;
  name_original: string;
  group: {
    id: string;
    name: string;
    name_original: string;
  } | null;
}

interface BiasFormProps {
  name: string;
  setName: (name: string) => void;
  groupName: string;
  setGroupName: (groupName: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  setIsFormOpen: (open: boolean) => void;
  isSearchingMembers: boolean;
  showMemberDropdown: boolean;
  memberSearchResults: KpopMemberWithGroup[];
  handleMemberSelect: (member: KpopMemberWithGroup) => void;
  memberDropdownRef: React.RefObject<HTMLDivElement | null>;
}

export function BiasForm({
  name,
  setName,
  groupName,
  setGroupName,
  handleSubmit,
  isLoading,
  setIsFormOpen,
  isSearchingMembers,
  showMemberDropdown,
  memberSearchResults,
  handleMemberSelect,
  memberDropdownRef,
}: BiasFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-2 pt-2">
      <div className="relative" ref={memberDropdownRef}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 - 표시용 (필수)"
          className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
          autoFocus
        />
        {isSearchingMembers && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
        {showMemberDropdown && memberSearchResults.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {memberSearchResults.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => handleMemberSelect(member)}
                  className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent text-foreground"
                >
                  <span className="font-medium">{member.name_original}</span>
                  {member.name !== member.name_original && (
                    <span className="text-muted-foreground ml-1">
                      ({member.name})
                    </span>
                  )}
                  {member.group && (
                    <span className="text-muted-foreground ml-1 text-xs italic">
                      - {member.group.name_original || member.group.name}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        type="text"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="그룹명 (선택)"
        className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
      />

      <div className="flex gap-2">
        <motion.button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="flex-1 px-2 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          {...pressScale}
        >
          {isLoading ? '추가 중...' : '추가'}
        </motion.button>
        <motion.button
          type="button"
          onClick={() => setIsFormOpen(false)}
          className="px-2 py-1.5 text-sm text-muted-foreground bg-accent hover:bg-accent/80 rounded-md transition-colors"
          {...pressScale}
        >
          취소
        </motion.button>
      </div>
    </form>
  );
}
