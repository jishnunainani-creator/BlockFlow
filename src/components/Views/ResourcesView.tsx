import React, { useState, useMemo, useEffect } from 'react';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';
import { ResourceCategory, ResourceItem, TaskShortcut } from '../../types/resources';
import { CATEGORIES, TASK_SHORTCUTS, CURATED_RESOURCES } from '../../data/resourcesData';
import { ResourceCard } from '../Resources/ResourceCard';
import { ResourceDetailModal } from '../Resources/ResourceDetailModal';
import {
  getFavoriteResourceIds,
  saveFavoriteResourceIds,
  getRecentResourceIds,
  recordRecentResourceId,
} from '../../utils/resourcePreferences';
import {
  Search,
  X,
  Star,
  RotateCcw,
  BookOpen,
  Sparkles,
  ExternalLink,
  History,
  SlidersHorizontal,
} from 'lucide-react';

interface ResourcesViewProps {
  onNavigate?: (view: NavView) => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>('all');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedResourceForModal, setSelectedResourceForModal] = useState<ResourceItem | null>(null);

  // Favorites & Recents state from localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteResourceIds());
  const [recentIds, setRecentIds] = useState<string[]>(() => getRecentResourceIds());

  // Keep localStorage synced when favoriteIds change
  useEffect(() => {
    saveFavoriteResourceIds(favoriteIds);
  }, [favoriteIds]);

  const handleToggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenLink = (resource: ResourceItem) => {
    // Record recent visit
    const updated = recordRecentResourceId(resource.id);
    setRecentIds(updated);
    // Safe external navigation
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleTaskShortcutClick = (shortcut: TaskShortcut) => {
    if (activeTaskId === shortcut.id) {
      // Toggle off
      setActiveTaskId(null);
      setSelectedCategory('all');
      setSearchQuery('');
    } else {
      setActiveTaskId(shortcut.id);
      if (shortcut.category) {
        setSelectedCategory(shortcut.category);
      }
      setSearchQuery('');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setActiveTaskId(null);
    setShowFavoritesOnly(false);
  };

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    activeTaskId !== null ||
    showFavoritesOnly;

  // Filter & Search resources
  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return CURATED_RESOURCES.filter((resource) => {
      // 1. Favorites only check
      if (showFavoritesOnly && !favoriteIds.includes(resource.id)) {
        return false;
      }

      // 2. Category check
      if (selectedCategory !== 'all' && resource.category !== selectedCategory) {
        return false;
      }

      // 3. Task shortcut check (if active)
      if (activeTaskId) {
        const task = TASK_SHORTCUTS.find((t) => t.id === activeTaskId);
        if (task) {
          const matchesTaskKeywords = resource.searchKeywords.some((kw) =>
            task.query.toLowerCase().includes(kw.toLowerCase()) ||
            kw.toLowerCase().includes(task.query.toLowerCase())
          );
          const matchesTaskCategory = resource.category === task.category;
          const matchesTaskDescription =
            resource.bestFor.some((b) => b.toLowerCase().includes(task.query.toLowerCase())) ||
            resource.primaryUseCases.some((u) => u.toLowerCase().includes(task.query.toLowerCase()));

          if (!matchesTaskKeywords && !matchesTaskCategory && !matchesTaskDescription) {
            return false;
          }
        }
      }

      // 4. Free-form text query
      if (query) {
        const nameMatch = resource.name.toLowerCase().includes(query);
        const descMatch = resource.description.toLowerCase().includes(query);
        const catMatch = resource.categoryLabel.toLowerCase().includes(query);
        const bestForMatch = resource.bestFor.some((b) => b.toLowerCase().includes(query));
        const useCasesMatch = resource.primaryUseCases.some((u) => u.toLowerCase().includes(query));
        const keywordsMatch = resource.searchKeywords.some((kw) => kw.toLowerCase().includes(query));

        if (!nameMatch && !descMatch && !catMatch && !bestForMatch && !useCasesMatch && !keywordsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedCategory, activeTaskId, showFavoritesOnly, favoriteIds]);

  // Map of recent resources for the quick strip
  const recentResources = useMemo(() => {
    if (recentIds.length === 0) return [];
    return recentIds
      .map((id) => CURATED_RESOURCES.find((r) => r.id === id))
      .filter((r): r is ResourceItem => Boolean(r));
  }, [recentIds]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 select-none scrollbar-thin">
      {/* ── BREADCRUMB ── */}
      <PageBreadcrumb items={[{ label: 'Resources' }]} onNavigate={onNavigate} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <span>Resources</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            The right tools for studying, creating and getting things done.
          </p>
        </div>

        {/* Saved count quick badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowFavoritesOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              showFavoritesOnly
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current text-amber-400' : 'text-slate-400'}`} />
            <span>Saved ({favoriteIds.length})</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        {/* Search Field */}
        <div className="relative max-w-2xl">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTaskId) setActiveTaskId(null);
            }}
            placeholder="Find a tool or describe what you need..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Task Shortcuts: "What are you trying to do?" */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>What are you trying to do?</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TASK_SHORTCUTS.map((shortcut) => {
              const isActive = activeTaskId === shortcut.id;
              return (
                <button
                  key={shortcut.id}
                  type="button"
                  onClick={() => handleTaskShortcutClick(shortcut)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all text-left ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {shortcut.label}
                  {isActive && <span className="ml-1.5 text-blue-200">✕</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Pills Row */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Categories</span>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset filters</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id && !activeTaskId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (activeTaskId) setActiveTaskId(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-slate-800 text-white border-slate-700 font-semibold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recently Opened Strip (if available) */}
        {recentResources.length > 0 && !isFiltered && (
          <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 flex-wrap text-xs">
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <History className="w-3.5 h-3.5" />
              <span>Recently opened:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {recentResources.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedResourceForModal(item)}
                  className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RESOURCE GRID / DIRECTORY ── */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
          <span>
            Showing <strong className="text-white">{filteredResources.length}</strong> of{' '}
            {CURATED_RESOURCES.length} resources
          </span>
          {showFavoritesOnly && (
            <span className="text-amber-400 font-medium">Filtered to favorites</span>
          )}
        </div>

        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isFavorite={favoriteIds.includes(resource.id)}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(item) => setSelectedResourceForModal(item)}
                onOpenLink={handleOpenLink}
              />
            ))}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="py-16 px-4 text-center rounded-xl bg-slate-900 border border-slate-800 max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">No tools match your query</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Try adjusting your search terms, selecting &quot;All Resources&quot;, or clearing the current filters.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RESOURCE DETAIL & PROMPT MODAL ── */}
      <ResourceDetailModal
        resource={selectedResourceForModal}
        isOpen={Boolean(selectedResourceForModal)}
        onClose={() => setSelectedResourceForModal(null)}
        isFavorite={selectedResourceForModal ? favoriteIds.includes(selectedResourceForModal.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onOpenLink={handleOpenLink}
      />
    </div>
  );
};
