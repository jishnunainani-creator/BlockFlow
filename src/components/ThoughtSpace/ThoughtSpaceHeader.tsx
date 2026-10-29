import React from 'react';
import {
  Brain,
  Search,
  X,
  Download,
  Upload,
  Pin,
  Archive,
  Layers,
  ArrowUpDown,
  ShieldCheck,
} from 'lucide-react';
import {
  ThoughtFilterOption,
  ThoughtSortOption,
} from '../../types/thoughtSpace';

interface ThoughtSpaceHeaderProps {
  totalCount: number;
  activeCount: number;
  pinnedCount: number;
  archivedCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filter: ThoughtFilterOption;
  onFilterChange: (f: ThoughtFilterOption) => void;
  sort: ThoughtSortOption;
  onSortChange: (s: ThoughtSortOption) => void;
  onExport: () => void;
  onOpenImport: () => void;
}

export const ThoughtSpaceHeader: React.FC<ThoughtSpaceHeaderProps> = ({
  totalCount,
  activeCount,
  pinnedCount,
  archivedCount,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  onExport,
  onOpenImport,
}) => {
  return (
    <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      {/* Top Row: Title, Privacy Pill & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Thought Space
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {activeCount} active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>A calm, local-first space for unconstrained thinking and hierarchical ideas.</span>
            <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              100% Local-Only
            </span>
          </p>
        </div>

        {/* Action Buttons: Export & Import */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExport}
            disabled={totalCount === 0}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            title="Download portable JSON backup file"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Notes</span>
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Import notes from JSON backup"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Notes</span>
          </button>
        </div>
      </div>

      {/* Second Row: Search, Tabs & Sorting */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search thoughts, ideas, keywords..."
            className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs & Sort Dropdown */}
        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>All ({activeCount})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange('pinned')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filter === 'pinned'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <Pin className="w-3 h-3" />
                <span>Pinned ({pinnedCount})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange('archived')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filter === 'archived'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <Archive className="w-3 h-3" />
                <span>Archived ({archivedCount})</span>
              </span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as ThoughtSortOption)}
              className="appearance-none pl-7 pr-6 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="updated_desc">Recently Edited</option>
              <option value="created_desc">Created Date</option>
              <option value="title_asc">Title (A–Z)</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
