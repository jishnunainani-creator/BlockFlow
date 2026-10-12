import React from 'react';
import { ResourceItem } from '../../types/resources';
import { ExternalLink, Star, ArrowUpRight, HelpCircle } from 'lucide-react';

interface ResourceCardProps {
  resource: ResourceItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenDetails: (resource: ResourceItem) => void;
  onOpenLink: (resource: ResourceItem) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
  onOpenLink,
}) => {
  return (
    <div className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200">
      <div>
        {/* Card Header: Monogram, Name, Category, Favorite, Pricing */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Monogram / Brand Badge */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs select-none"
              style={{ backgroundColor: resource.accentColor }}
              aria-hidden="true"
            >
              {resource.monogram}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight truncate">
                  {resource.name}
                </h3>
                {resource.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                    {resource.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {resource.categoryLabel}
                </span>
                <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  {resource.pricing}
                </span>
              </div>
            </div>
          </div>

          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(resource.id);
            }}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            aria-label={isFavorite ? `Remove ${resource.name} from favorites` : `Save ${resource.name} to favorites`}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              isFavorite
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 border-amber-300 dark:border-amber-700/60'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* One-sentence Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          {resource.description}
        </p>

        {/* Best-For Tags / Chips */}
        {resource.bestFor && resource.bestFor.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {resource.bestFor.map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => onOpenDetails(resource)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Details & Prompts</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenLink(resource)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors group-hover:shadow"
        >
          <span>Open Site</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
