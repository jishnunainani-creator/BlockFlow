import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { NavView } from './Sidebar';

export interface BreadcrumbItem {
  label: string;
  view?: NavView;
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItem[];
  currentPageLabel?: string;
  onNavigate?: (view: NavView) => void;
  className?: string;
}

export const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({
  items = [],
  currentPageLabel,
  onNavigate,
  className = '',
}) => {
  const allItems: BreadcrumbItem[] = [...items];
  if (currentPageLabel && !items.some((i) => i.label === currentPageLabel)) {
    allItems.push({ label: currentPageLabel });
  }

  const handleGo = (view: NavView) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      window.history.pushState({}, '', view === 'dashboard' ? '/dashboard' : `/${view}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={`flex items-center gap-1.5 text-xs text-slate-400 select-none pb-2 ${className}`}
    >
      <button
        type="button"
        onClick={() => handleGo('dashboard')}
        className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:underline"
        title="Return to Dashboard"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-medium">Dashboard</span>
      </button>

      {allItems.map((item, idx) => {
        const isLast = idx === allItems.length - 1;

        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
            {isLast || !item.view ? (
              <span className="text-slate-200 font-semibold truncate" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => item.view && handleGo(item.view)}
                className="text-slate-400 hover:text-white transition-colors truncate focus:outline-none focus-visible:underline cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
