import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Bias, BiasWithGroup, Group } from '@/types/database';
import { quickSpring, pressScale } from '@/lib/animations';

interface GroupedBiases {
  group: Group | null;
  biases: BiasWithGroup[];
}

interface BiasListProps {
  groupedBiases: GroupedBiases[];
  collapsedGroups: Set<string>;
  toggleGroupCollapse: (groupId: string) => void;
  getGroupDisplayName: (group: Group) => string;
  getDisplayName: (bias: Bias) => string;
  handleDelete: (id: string, biasName: string) => void;
  handleDeleteGroup: (groupId: string, groupName: string) => void;
  handleDragEnd: (result: DropResult) => void;
  deletingId: string | null;
  deletingGroupId: string | null;
}

export function BiasList({
  groupedBiases,
  collapsedGroups,
  toggleGroupCollapse,
  getGroupDisplayName,
  getDisplayName,
  handleDelete,
  handleDeleteGroup,
  handleDragEnd,
  deletingId,
  deletingGroupId,
}: BiasListProps) {
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="groups-list" type="GROUP">
        {(groupsProvided) => (
          <div
            ref={groupsProvided.innerRef}
            {...groupsProvided.droppableProps}
            className="space-y-1"
          >
            {groupedBiases.map(({ group, biases: groupBiases }, groupIndex) => {
              const groupId = group?.id || 'ungrouped';
              const isCollapsed = collapsedGroups.has(groupId);
              const groupDisplayName = group ? getGroupDisplayName(group) : '그룹 없음';
              const isUngrouped = group === null;

              // Ungrouped items are not draggable as a group
              if (isUngrouped) {
                return (
                  <div key={groupId}>
                    <motion.button
                      type="button"
                      onClick={() => toggleGroupCollapse(groupId)}
                      className="w-full flex items-center gap-1 px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-accent rounded-md transition-colors"
                      {...pressScale}
                    >
                      <motion.svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        animate={{ rotate: isCollapsed ? 0 : 90 }}
                        transition={quickSpring}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </motion.svg>
                      <span>{groupDisplayName}</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
                        ({groupBiases.length})
                      </span>
                    </motion.button>

                    {!isCollapsed && (
                      <Droppable droppableId={groupId} type="BIAS">
                        {(provided, snapshot) => (
                          <ul
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`ml-4 space-y-0.5 min-h-[2rem] rounded-md transition-colors ${
                              snapshot.isDraggingOver ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                            }`}
                          >
                            {groupBiases.map((bias, index) => (
                              <Draggable key={bias.id} draggableId={bias.id} index={index}>
                                {(provided, snapshot) => (
                                  <li
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center justify-between group px-2 py-1 text-sm text-foreground rounded-md transition-all ${
                                      snapshot.isDragging
                                        ? 'bg-card shadow-lg ring-2 ring-primary/50'
                                        : 'hover:bg-accent'
                                    }`}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="flex items-center gap-1 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
                                    >
                                      <svg
                                        className="w-4 h-4 text-zinc-300 dark:text-zinc-600 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                      >
                                        <circle cx="9" cy="6" r="1.5" />
                                        <circle cx="15" cy="6" r="1.5" />
                                        <circle cx="9" cy="12" r="1.5" />
                                        <circle cx="15" cy="12" r="1.5" />
                                        <circle cx="9" cy="18" r="1.5" />
                                        <circle cx="15" cy="18" r="1.5" />
                                      </svg>
                                      <span className="truncate">{getDisplayName(bias)}</span>
                                    </div>
                                    <motion.button
                                      onClick={() => handleDelete(bias.id, getDisplayName(bias))}
                                      disabled={deletingId === bias.id}
                                      className="md:opacity-0 md:group-hover:opacity-100 ml-2 p-0.5 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-opacity disabled:opacity-50 flex-shrink-0"
                                      title="삭제"
                                      whileTap={{ scale: 0.85 }}
                                      transition={quickSpring}
                                    >
                                      {deletingId === bias.id ? (
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                      ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                    </motion.button>
                                  </li>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </ul>
                        )}
                      </Droppable>
                    )}
                  </div>
                );
              }

              // Draggable group
              return (
                <Draggable key={groupId} draggableId={`group-${groupId}`} index={groupIndex}>
                  {(groupDragProvided, groupDragSnapshot) => (
                    <div
                      ref={groupDragProvided.innerRef}
                      {...groupDragProvided.draggableProps}
                      className={`rounded-md transition-all ${
                        groupDragSnapshot.isDragging ? 'bg-zinc-50 dark:bg-zinc-800/50 shadow-lg ring-2 ring-pink-500/30' : ''
                      }`}
                    >
                      <div className="flex items-center group">
                        <div
                          {...groupDragProvided.dragHandleProps}
                          className="p-1 cursor-grab active:cursor-grabbing md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            className="w-4 h-4 text-zinc-400 dark:text-zinc-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <circle cx="9" cy="6" r="1.5" />
                            <circle cx="15" cy="6" r="1.5" />
                            <circle cx="9" cy="12" r="1.5" />
                            <circle cx="15" cy="12" r="1.5" />
                            <circle cx="9" cy="18" r="1.5" />
                            <circle cx="15" cy="18" r="1.5" />
                          </svg>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => toggleGroupCollapse(groupId)}
                          className="flex-1 flex items-center gap-1 px-1 py-1 text-sm font-medium text-muted-foreground hover:bg-accent rounded-md transition-colors"
                          {...pressScale}
                        >
                          <motion.svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            animate={{ rotate: isCollapsed ? 0 : 90 }}
                            transition={quickSpring}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </motion.svg>
                          <span>{groupDisplayName}</span>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
                            ({groupBiases.length})
                          </span>
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group!.id, groupDisplayName);
                          }}
                          disabled={deletingGroupId === group!.id}
                          className="md:opacity-0 md:group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-opacity disabled:opacity-50 flex-shrink-0"
                          title="그룹 삭제"
                          whileTap={{ scale: 0.85 }}
                          transition={quickSpring}
                        >
                          {deletingGroupId === group!.id ? (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </motion.button>
                      </div>

                      {!isCollapsed && (
                        <Droppable droppableId={groupId} type="BIAS">
                          {(provided, snapshot) => (
                            <ul
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`ml-6 space-y-0.5 min-h-[2rem] rounded-md transition-colors ${
                                snapshot.isDraggingOver ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                              }`}
                            >
                              {groupBiases.map((bias, index) => (
                                <Draggable key={bias.id} draggableId={bias.id} index={index}>
                                  {(provided, snapshot) => (
                                    <li
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`flex items-center justify-between group px-2 py-1 text-sm text-foreground rounded-md transition-all ${
                                        snapshot.isDragging
                                          ? 'bg-card shadow-lg ring-2 ring-primary/50'
                                          : 'hover:bg-accent'
                                      }`}
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        className="flex items-center gap-1 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
                                      >
                                        <svg
                                          className="w-4 h-4 text-zinc-300 dark:text-zinc-600 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <circle cx="9" cy="6" r="1.5" />
                                          <circle cx="15" cy="6" r="1.5" />
                                          <circle cx="9" cy="12" r="1.5" />
                                          <circle cx="15" cy="12" r="1.5" />
                                          <circle cx="9" cy="18" r="1.5" />
                                          <circle cx="15" cy="18" r="1.5" />
                                        </svg>
                                        <span className="truncate">{getDisplayName(bias)}</span>
                                      </div>
                                      <motion.button
                                        onClick={() => handleDelete(bias.id, getDisplayName(bias))}
                                        disabled={deletingId === bias.id}
                                        className="md:opacity-0 md:group-hover:opacity-100 ml-2 p-0.5 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-opacity disabled:opacity-50 flex-shrink-0"
                                        title="삭제"
                                        whileTap={{ scale: 0.85 }}
                                        transition={quickSpring}
                                      >
                                        {deletingId === bias.id ? (
                                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                          </svg>
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        )}
                                      </motion.button>
                                    </li>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </ul>
                          )}
                        </Droppable>
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {groupsProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
