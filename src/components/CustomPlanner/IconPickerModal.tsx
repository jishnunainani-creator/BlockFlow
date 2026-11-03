/**
 * Searchable 150+ Icon Picker Modal
 * Supports category tabs, favorites, recent history, and custom icon/background coloring.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Star,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  ICON_CATEGORIES,
  ALL_CURATED_ICONS,
  getIconComponent,
  searchIcons,
  getRecentIcons,
  saveRecentIcon,
  getFavoriteIcons,
  toggleFavoriteIcon,
  PALETTE_COLORS,
  PaletteColor,
} from '../../utils/iconLibrary';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon?: string;
  selectedColor?: string;
  selectedBg?: string;
  onSelectIcon: (iconName: string, color?: string, bg?: string) => void;
  title?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIcon = 'Calendar',
  selectedColor,
  selectedBg,
  onSelectIcon,
  title = 'Select an Icon',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentColor, setCurrentColor] = useState<string>(selectedColor || '#3B82F6');
  const [currentBg, setCurrentBg] = useState<string>(selectedBg || '');
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const [recentIcons, setRecentIcons] = useState<string[]>(() => getRecentIcons());
  const [favoriteIcons, setFavoriteIcons] = useState<string[]>(() => getFavoriteIcons());

  const filteredIcons = useMemo(() => {
    if (activeCategory === 'favorites') {
      return searchIcons(searchQuery).filter((i) => favoriteIcons.includes(i));
    }
    if (activeCategory === 'recents') {
      return searchIcons(searchQuery).filter((i) => recentIcons.includes(i));
    }
    return searchIcons(searchQuery, activeCategory === 'all' ? undefined : activeCategory);
  }, [searchQuery, activeCategory, favoriteIcons, recentIcons]);

  if (!isOpen) return null;

  const handlePickIcon = (name: string) => {
    saveRecentIcon(name);
    setRecentIcons(getRecentIcons());
    onSelectIcon(name, currentColor, currentBg);
    onClose();
  };

  const handleToggleFav = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    toggleFavoriteIcon(name);
    setFavoriteIcons(getFavoriteIcons());
  };

  const SelectedIconComponent = getIconComponent(selectedIcon);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: currentBg || 'rgba(59, 130, 246, 0.1)',
                borderColor: currentColor || '#3B82F6',
                color: currentColor || '#3B82F6',
              }}
            >
              <SelectedIconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                150+ verified icons across 15 categories with custom colors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Color Palette Strip */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Color:</span>
            <div className="flex items-center gap-1.5">
              {PALETTE_COLORS.map((p) => {
                const isSelected = currentColor === p.accent;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCurrentColor(p.accent);
                      setCurrentBg(p.bgLight);
                    }}
                    title={p.label}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-sm' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: p.accent }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {hoveredIcon ? `<${hoveredIcon} />` : `${filteredIcons.length} icons available`}
          </div>
        </div>

        {/* Search Bar & Category Filter */}
        <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search icons by name or concept (e.g., calculator, code, trophy)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({ALL_CURATED_ICONS.length})
            </button>

            <button
              onClick={() => setActiveCategory('favorites')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'favorites'
                  ? 'bg-amber-500 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Star size={12} className={favoriteIcons.length > 0 ? 'fill-current text-amber-400' : ''} />
              <span>Favorites ({favoriteIcons.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory('recents')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'recents'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock size={12} />
              <span>Recents</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

            {ICON_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name} ({cat.icons.length})
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Grid */}
        <div className="p-4 overflow-y-auto flex-1 scrollbar-thin">
          {filteredIcons.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
              <p className="text-xs font-semibold">No icons match "{searchQuery}"</p>
              <p className="text-[11px] text-slate-500">Try searching for concepts like chart, lab, run, code, or book.</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 gap-2.5">
              {filteredIcons.map((iconName) => {
                const IconComp = getIconComponent(iconName);
                const isSelected = selectedIcon === iconName;
                const isFav = favoriteIcons.includes(iconName);

                return (
                  <div
                    key={iconName}
                    onClick={() => handlePickIcon(iconName)}
                    onMouseEnter={() => setHoveredIcon(iconName)}
                    onMouseLeave={() => setHoveredIcon(null)}
                    className={`group relative p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs'
                    }`}
                  >
                    <IconComp
                      className="w-5 h-5 transition-transform group-hover:scale-110"
                      style={{ color: isSelected ? currentColor : undefined }}
                    />
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-full text-center group-hover:text-slate-900 dark:group-hover:text-white">
                      {iconName}
                    </span>

                    {/* Favorite star toggle on hover or active */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFav(e, iconName)}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      className={`absolute top-1 right-1 p-1 rounded-md transition-opacity ${
                        isFav ? 'opacity-100 text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-400'
                      }`}
                    >
                      <Star size={11} className={isFav ? 'fill-current' : ''} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Selected:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{selectedIcon}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
