import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { LibraryBlock, PRIORITY_CONFIG } from '../../types/timetable';
import { BlockModal, PRESET_COLORS, AVAILABLE_ICONS } from '../Library/BlockModal';
import { formatDuration } from '../../utils/timeUtils';
import {
  LayoutGrid,
  Plus,
  Search,
  Clock,
  Flame,
  Palette,
  Copy,
  Edit2,
  Trash2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const LibraryView: React.FC = () => {
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

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-indigo-400" />
            <span>Activity Library</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Manage reusable blocks, task templates, and category presets ({libraryBlocks.length} blocks total)
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Activity Block</span>
        </button>
      </div>

      {/* Controls Bar: Search + Category Filters + Sorting + Color Swatches */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search blocks by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSortBy('default')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                sortBy === 'default' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSortBy('recentlyUsed')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all ${
                sortBy === 'recentlyUsed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recent</span>
            </button>
            <button
              onClick={() => setSortBy('mostUsed')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all ${
                sortBy === 'mostUsed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Popular</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Color Swatches */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 font-medium">Category:</span>
          <button
            onClick={() => setSelectedPriority('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition-all ${
              selectedPriority === 'all'
                ? 'bg-slate-800 text-white border-slate-600'
                : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {['high', 'medium', 'low', 'personal', ...customCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedPriority(cat)}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                selectedPriority === cat
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                  : 'text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            {PRESET_COLORS.map((hex) => (
              <button
                key={hex}
                onClick={() => setSelectedColor(selectedColor === hex ? 'all' : hex)}
                style={{ backgroundColor: hex }}
                className={`w-4 h-4 rounded-full border transition-transform ${
                  selectedColor.toLowerCase() === hex.toLowerCase()
                    ? 'scale-125 border-white ring-2 ring-white/50'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBlocks.length === 0 ? (
          <div className="col-span-full text-center py-16 border border-dashed border-slate-800 rounded-2xl p-6">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No activity blocks found</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search term or category filters.</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg"
            >
              + Create First Activity Block
            </button>
          </div>
        ) : (
          filteredBlocks.map((block) => {
            const IconComp = getIconComponent(block.icon);
            const categoryLabel = PRIORITY_CONFIG[block.priority]?.label || block.priority;
            return (
              <div
                key={block.id}
                style={{
                  borderLeftColor: block.color,
                  backgroundColor: `${block.color}0A`,
                }}
                className="group relative bg-slate-900 border-l-[4px] border-y border-r border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Row: Icon + Title + Category Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="p-2 rounded-xl text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: block.color }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white truncate">{block.title}</h3>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0"
                      style={{ color: block.color, borderColor: `${block.color}40`, backgroundColor: `${block.color}15` }}
                    >
                      {categoryLabel}
                    </span>
                  </div>

                  {/* Description / Notes */}
                  {block.description && (
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {block.description}
                    </p>
                  )}
                </div>

                {/* Footer Row: Duration + Actions */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDuration(block.defaultDuration)}</span>
                    {block.usageCount ? (
                      <span className="text-[10px] text-indigo-400 font-semibold">({block.usageCount}x used)</span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(block)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(block)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteLibraryBlock(block.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Creation / Edit Modal */}
      <BlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        editingBlock={editingBlock}
      />
    </div>
  );
};
