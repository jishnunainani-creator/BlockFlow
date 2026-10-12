import React, { useState, useMemo, useCallback } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { LibraryBlock, Priority, PRIORITY_CONFIG } from '../../types/timetable';
import { BlockModal, AVAILABLE_ICONS } from './BlockModal';
import { formatDuration } from '../../utils/timeUtils';
import {
  Plus,
  Search,
  GripVertical,
  Edit2,
  Trash2,
  Copy,
  Sparkles,
  HelpCircle,
  Clock,
  ChevronLeft,
} from 'lucide-react';

interface BlockLibraryProps {
  onClose?: () => void;
}

const BlockLibraryComponent: React.FC<BlockLibraryProps> = ({ onClose }) => {
  const {
    libraryBlocks,
    customCategories,
    addLibraryBlock,
    updateLibraryBlock,
    deleteLibraryBlock,
  } = useTimetable();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<LibraryBlock | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'recentlyUsed' | 'mostUsed'>('default');

  const handleOpenCreateModal = useCallback(() => {
    setEditingBlock(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((block: LibraryBlock) => {
    setEditingBlock(block);
    setIsModalOpen(true);
  }, []);

  const handleDuplicate = useCallback((block: LibraryBlock) => {
    addLibraryBlock({
      title: `${block.title} (Copy)`,
      description: block.description,
      color: block.color,
      priority: block.priority,
      defaultDuration: block.defaultDuration,
      icon: block.icon,
    });
  }, [addLibraryBlock]);

  const handleSaveModal = useCallback((blockData: Omit<LibraryBlock, 'id'> | LibraryBlock) => {
    if (editingBlock) {
      updateLibraryBlock(editingBlock.id, blockData);
    } else {
      addLibraryBlock(blockData as Omit<LibraryBlock, 'id'>);
    }
  }, [editingBlock, updateLibraryBlock, addLibraryBlock]);

  const filteredBlocks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = libraryBlocks.filter((block) => {
      const matchesSearch =
        !query ||
        block.title.toLowerCase().includes(query) ||
        (block.description && block.description.toLowerCase().includes(query));
      const matchesPriority =
        selectedPriority === 'all' || block.priority === selectedPriority;
      const matchesColor =
        selectedColor === 'all' || block.color.toLowerCase() === selectedColor.toLowerCase();
      return matchesSearch && matchesPriority && matchesColor;
    });

    if (sortBy === 'recentlyUsed') {
      result = [...result].sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
    } else if (sortBy === 'mostUsed') {
      result = [...result].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    }
    return result;
  }, [libraryBlocks, searchQuery, selectedPriority, selectedColor, sortBy]);

  const getIconComponent = (iconId: string) => {
    const found = AVAILABLE_ICONS.find((i) => i.id === iconId);
    return found ? found.Icon : Sparkles;
  };

  const handleDragStart = (e: React.DragEvent, block: LibraryBlock) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'LIBRARY_BLOCK',
        blockId: block.id,
        title: block.title,
        description: block.description,
        color: block.color,
        priority: block.priority,
        categoryId: block.categoryId,
        icon: block.icon,
        duration: block.defaultDuration,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-full bg-slate-900 flex flex-col h-full shrink-0 select-none overflow-hidden">
      {/* Header & Create Button */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Activity Library</h2>
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              {libraryBlocks.length}
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700/60 transition-colors"
              title="Hide Activity Library"
              aria-label="Hide Activity Library"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary "+ Create New Block" Button */}
        <button
          onClick={handleOpenCreateModal}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#3659C9] hover:bg-[#2B47A8] dark:bg-[#4F73E3] dark:hover:bg-[#6384ED] text-white font-medium text-xs tracking-wide shadow-xs active:scale-98 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Library Block</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#3659C9] transition-colors"
          />
        </div>

        {/* Category Filters & Sort Controls */}
        <div className="flex items-center justify-between gap-1 text-[11px] pt-0.5">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setSelectedPriority('all')}
              className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
                selectedPriority === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All
            </button>
            {['high', 'medium', 'low', 'personal', ...customCategories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedPriority(cat)}
                className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize transition-colors ${
                  selectedPriority === cat
                    ? 'bg-[#3659C9] text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Switch */}
          <div className="flex items-center bg-slate-800/80 rounded p-0.5 shrink-0 border border-slate-700/50">
            <button
              onClick={() => setSortBy('default')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                sortBy === 'default' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="All blocks"
            >
              All
            </button>
            <button
              onClick={() => setSortBy('recentlyUsed')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                sortBy === 'recentlyUsed' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Recently used"
            >
              Recent
            </button>
          </div>
        </div>
      </div>

      {/* Reusable Blocks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {filteredBlocks.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-2xl">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">No blocks found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Try adjusting your search query or color filters.
            </p>
          </div>
        ) : (
          filteredBlocks.map((block) => {
            const IconComp = getIconComponent(block.icon);
            return (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, block)}
                style={{
                  borderLeftColor: block.color,
                }}
                className="group relative bg-slate-800/60 hover:bg-slate-800 border-l-[3.5px] border-y border-r border-slate-700/60 rounded-lg p-2.5 shadow-xs transition-colors cursor-grab active:cursor-grabbing overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-slate-100 truncate">
                      {block.title}
                    </h4>

                    {block.description && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {block.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-300 border border-slate-700/50">
                        {formatDuration(block.defaultDuration)}
                      </span>
                      {block.priority && (
                        <span className="text-[9px] uppercase font-semibold text-slate-500">
                          {block.priority}
                        </span>
                      )}
                      {block.usageCount ? (
                        <span className="text-[10px] font-medium text-slate-400">
                          {block.usageCount}x
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions & Drag Handle */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        onClick={() => handleDuplicate(block)}
                        title="Duplicate in library"
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(block)}
                        title="Edit block"
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteLibraryBlock(block.id)}
                        title="Delete block"
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-slate-500 group-hover:text-slate-400 cursor-grab pl-0.5">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        editingBlock={editingBlock}
      />
    </div>
  );
};

export const BlockLibrary = React.memo(BlockLibraryComponent);
