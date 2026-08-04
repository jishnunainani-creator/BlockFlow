import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { LibraryBlock, Priority, PRIORITY_CONFIG } from '../../types/timetable';
import { BlockModal, AVAILABLE_ICONS, PRESET_COLORS } from './BlockModal';
import { formatDuration } from '../../utils/timeUtils';
import {
  Plus,
  Search,
  GripVertical,
  Edit2,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  Flame,
  Palette,
  Tag,
} from 'lucide-react';

export const BlockLibrary: React.FC = () => {
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

  const handleOpenCreateModal = () => {
    setEditingBlock(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (block: LibraryBlock) => {
    setEditingBlock(block);
    setIsModalOpen(true);
  };

  const handleDuplicate = (block: LibraryBlock) => {
    addLibraryBlock({
      title: `${block.title} (Copy)`,
      description: block.description,
      color: block.color,
      priority: block.priority,
      defaultDuration: block.defaultDuration,
      icon: block.icon,
    });
  };

  const handleSaveModal = (blockData: Omit<LibraryBlock, 'id'> | LibraryBlock) => {
    if (editingBlock) {
      updateLibraryBlock(editingBlock.id, blockData);
    } else {
      addLibraryBlock(blockData as Omit<LibraryBlock, 'id'>);
    }
  };

  let filteredBlocks = libraryBlocks.filter((block) => {
    const matchesSearch =
      block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (block.description && block.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority =
      selectedPriority === 'all' || block.priority === selectedPriority;
    const matchesColor =
      selectedColor === 'all' || block.color.toLowerCase() === selectedColor.toLowerCase();
    return matchesSearch && matchesPriority && matchesColor;
  });

  if (sortBy === 'recentlyUsed') {
    filteredBlocks = [...filteredBlocks].sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
  } else if (sortBy === 'mostUsed') {
    filteredBlocks = [...filteredBlocks].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  }

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
    <aside className="w-full md:w-80 bg-slate-900/90 border-r border-slate-800/80 flex flex-col h-full shrink-0 select-none backdrop-blur-xl">
      {/* Header & Create Button */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Activity Library</h2>
              <p className="text-[11px] text-slate-400">Reusable blocks for schedule</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {libraryBlocks.length}
          </span>
        </div>

        {/* Primary "+ Create New Block" Button */}
        <button
          onClick={handleOpenCreateModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-500/25 active:scale-98 transition-all duration-200 border border-indigo-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Block</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search blocks by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <button
            onClick={() => setSelectedPriority('all')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border ${
              selectedPriority === 'all'
                ? 'bg-slate-700 text-white border-slate-500'
                : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {['high', 'medium', 'low', 'personal', ...customCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedPriority(cat)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border transition-all ${
                selectedPriority === cat
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                  : 'text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort & Recently Used Toggle */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSortBy('default')}
              className={`px-2 py-0.5 rounded font-medium ${
                sortBy === 'default' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSortBy('recentlyUsed')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium ${
                sortBy === 'recentlyUsed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Recent</span>
            </button>
            <button
              onClick={() => setSortBy('mostUsed')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium ${
                sortBy === 'mostUsed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Popular</span>
            </button>
          </div>
        </div>

        {/* Color Swatch Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
          <Palette className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <button
            onClick={() => setSelectedColor('all')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              selectedColor === 'all'
                ? 'bg-slate-700 text-white border-slate-500'
                : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {PRESET_COLORS.map((hex) => (
            <button
              key={hex}
              onClick={() => setSelectedColor(hex)}
              style={{ backgroundColor: hex }}
              className={`w-4 h-4 rounded-full shrink-0 border transition-transform ${
                selectedColor.toLowerCase() === hex.toLowerCase()
                  ? 'scale-125 border-white ring-2 ring-white/50'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            />
          ))}
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
                  backgroundColor: `${block.color}0D`,
                }}
                className="group relative bg-slate-900/90 hover:bg-slate-900 border-l-[4px] border-y border-r border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 shadow-sm"
                      style={{ backgroundColor: block.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-100 truncate">
                          {block.title}
                        </h4>
                      </div>

                      {block.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {block.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/60 text-slate-300 border border-slate-700/50">
                          {formatDuration(block.defaultDuration)}
                        </span>
                        {block.usageCount ? (
                          <span className="text-[10px] font-medium text-indigo-400">
                            {block.usageCount}x used
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Drag Handle */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="text-slate-500 group-hover:text-slate-400 cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={() => handleDuplicate(block)}
                        title="Duplicate in library"
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(block)}
                        title="Edit block"
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteLibraryBlock(block.id)}
                        title="Delete block"
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
    </aside>
  );
};
