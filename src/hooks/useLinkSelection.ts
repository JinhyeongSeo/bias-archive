import { useState, useCallback } from 'react';

interface UseLinkSelectionOptions {
  itemIds: string[];
}

export function useLinkSelection({ itemIds }: UseLinkSelectionOptions) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectionMode = useCallback((enabled?: boolean) => {
    setSelectionMode((prev) => {
      const next = enabled !== undefined ? enabled : !prev;
      if (!next) {
        setSelectedIds(new Set());
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(itemIds));
  }, [itemIds]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  return {
    selectionMode,
    setSelectionMode,
    selectedIds,
    setSelectedIds,
    toggleSelectionMode,
    handleSelect,
    handleSelectAll,
    handleDeselectAll,
    clearSelection,
  };
}
