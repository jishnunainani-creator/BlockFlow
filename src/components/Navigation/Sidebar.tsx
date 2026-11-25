import React, { useState, useEffect } from 'react';
import { BlockFlowLogo } from '../Brand/BlockFlowLogo';
import {
  Calendar,
  Target,
  Zap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Inbox,
  X,
  Sun,
  Sliders,
  MessageSquarePlus,
} from 'lucide-react';
import { getUnprocessedCount } from '../../utils/quickCaptureStorage';

export type NavView =
  | 'my-day'
  | 'dashboard'
  | 'calendar'
  | 'adaptive-planner'
  | 'task-inbox'
  | 'thought-space'
  | 'my-planners'
  | 'goals'
  | 'assignments'
  | 'focus'
  | 'library'
  | 'resources'
  | 'templates'
  | 'analytics'
  | 'execution'
  | 'ai-insights'
  | 'reminders'
  | 'settings'
  | 'feedback'
  | 'privacy-policy'
  | 'terms'
  | 'quick-add';

export interface NavItemConfig {
  id: NavView;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  action?: () => void;
}

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userEmail?: string | null;
  onOpenAuth: () => void;
  onOpenFocusMode?: () => void;
  onOpenQuickCapture?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Checks whether an 8-item primary navigation destination is active based on currentView,
 * including absorbed sub-views (e.g. library -> calendar, thought-space -> task-inbox).
 */
export function isPrimaryNavActive(itemId: NavView, currentView: NavView): boolean {
  if (itemId === currentView) return true;
  if (itemId === 'calendar' && ['calendar', 'library', 'templates', 'resources'].includes(currentView)) return true;
  if (itemId === 'adaptive-planner' && ['adaptive-planner', 'my-planners', 'assignments'].includes(currentView)) return true;
  if (itemId === 'task-inbox' && ['task-inbox', 'thought-space', 'quick-add'].includes(currentView)) return true;
  if (itemId === 'analytics' && ['analytics', 'dashboard', 'execution', 'ai-insights'].includes(currentView)) return true;
  if (itemId === 'settings' && ['settings', 'privacy-policy', 'terms', 'reminders'].includes(currentView)) return true;
  return false;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  userEmail,
  onOpenAuth,
  onOpenFocusMode,
  onOpenQuickCapture,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [unprocessedCount, setUnprocessedCount] = useState<number>(() => getUnprocessedCount());

  useEffect(() => {
    const handleCountUpdate = () => {
      setUnprocessedCount(getUnprocessedCount());
    };
    window.addEventListener('blockflow_quick_capture_changed', handleCountUpdate);
    window.addEventListener('storage', handleCountUpdate);
    return () => {
      window.removeEventListener('blockflow_quick_capture_changed', handleCountUpdate);
      window.removeEventListener('storage', handleCountUpdate);
    };
  }, []);

  // ── 8 CONSOLIDATED PRIMARY DESTINATIONS (Phase 6 Architecture) ──
  const primaryNavItems: NavItemConfig[] = React.useMemo(() => [
    { id: 'my-day', label: 'Today', icon: Sun },
    { id: 'calendar', label: 'Timetable', icon: Calendar },
    { id: 'adaptive-planner', label: 'Planner', icon: Sliders },
    { id: 'goals', label: 'Goals', icon: Target },
    {
      id: 'task-inbox',
      label: 'Inbox & Notes',
      icon: Inbox,
      badge: unprocessedCount > 0 ? String(unprocessedCount) : undefined,
    },
    { id: 'focus', label: 'Focus', icon: Zap },
    { id: 'analytics', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'feedback', label: 'Feedback', icon: MessageSquarePlus },
  ], [unprocessedCount]);

  // Handle Escape to close mobile drawer
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const handleItemClick = (item: NavItemConfig) => {
    if (item.action) {
      item.action();
    }
    onSelectView(item.id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const displayName = userEmail ? userEmail.split('@')[0] : 'Guest';
  const displayEmail = userEmail || 'Guest Mode (Local)';

  const renderNavContent = (isMobileDrawer: boolean) => {
    const isIconOnly = !isMobileDrawer && isCollapsed;

    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Navigation Items List */}
        <nav
          className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 scrollbar-thin select-none"
          aria-label="Main Navigation"
        >
          {/* Quick Capture Primary CTA */}
          {onOpenQuickCapture && (
            <div className="mb-3">
              <button
                type="button"
                data-tour="quick-capture-btn"
                onClick={() => {
                  onOpenQuickCapture();
                  if (isMobileDrawer && onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-2 py-2 rounded-xl text-xs font-medium transition-colors border ${
                  isIconOnly
                    ? 'justify-center px-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700/60 text-blue-600 dark:text-[#4F73E3]'
                    : 'px-3 bg-blue-50/70 dark:bg-[#3659C9]/10 hover:bg-blue-100/70 dark:hover:bg-[#3659C9]/20 border-blue-200 dark:border-[#3659C9]/30 text-blue-700 dark:text-[#60A5FA]'
                }`}
                title="Quick Capture (Q)"
                aria-label="Quick Capture"
              >
                <Zap className="w-4 h-4 shrink-0 text-amber-400" />
                {!isIconOnly && (
                  <span className="flex-1 text-left font-bold">Quick Capture</span>
                )}
                {!isIconOnly && (
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400">
                    Q
                  </kbd>
                )}
              </button>
            </div>
          )}

          {/* 8 Primary Destinations */}
          {primaryNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = isPrimaryNavActive(item.id, currentView);

            return (
              <button
                key={item.id}
                type="button"
                data-tour={`nav-${item.id}`}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative text-left group cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 dark:bg-indigo-600/20 dark:text-indigo-300 font-bold border border-indigo-500/25 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                } ${isIconOnly ? 'justify-center px-2' : ''}`}
                title={isIconOnly ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <IconComponent
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-indigo-400 dark:text-indigo-300'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                  aria-hidden="true"
                />

                {!isIconOnly && (
                  <span className="truncate flex-1 tracking-tight">{item.label}</span>
                )}

                {!isIconOnly && item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 shrink-0">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-[3px] bg-indigo-500 rounded-r"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Pinned Bottom User Profile Card */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 shrink-0">
          {!isIconOnly ? (
            <div
              onClick={() => {
                onOpenAuth();
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onOpenAuth();
                  if (onCloseMobile) onCloseMobile();
                }
              }}
              aria-label={`User profile for ${displayName}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                {displayName[0].toUpperCase()}
              </div>
              <div className="truncate flex-1 text-left">
                <p className="text-xs font-bold text-slate-200 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full flex justify-center p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title={`${displayName} (${displayEmail})`}
              aria-label={`User profile for ${displayName}`}
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── DESKTOP PERSISTENT ASIDE SIDEBAR (≥ 768px) ── */}
      <aside
        className={`hidden md:flex h-full bg-slate-950 border-r border-slate-800 flex-col justify-between transition-all duration-200 select-none z-30 shrink-0 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
        aria-label="Desktop Sidebar"
      >
        {/* Header & Logo (Click to navigate to Today / Timetable) */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => onSelectView('my-day')}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-85 transition-opacity focus:outline-none rounded-lg p-1 -m-1 cursor-pointer"
            title="Go to Today"
            aria-label="Go to Today"
          >
            <BlockFlowLogo size="sm" />
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-black text-white leading-none tracking-tight">
                  BlockFlow
                </h1>
                <span className="text-[10px] text-slate-500 font-medium">Daily Schedule</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Content */}
        {renderNavContent(false)}
      </aside>

      {/* ── MOBILE SLIDE-OUT DRAWER OVERLAY (< 768px) ── */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fade-in" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          <div className="relative z-50 w-72 max-w-[85vw] h-full bg-slate-950 border-r border-slate-800 flex flex-col justify-between shadow-2xl">
            <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  onSelectView('my-day');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center gap-3 min-w-0 text-left hover:opacity-85 transition-opacity focus:outline-none rounded-lg p-1 -m-1 cursor-pointer"
                title="Go to Today"
                aria-label="Go to Today"
              >
                <BlockFlowLogo size="sm" />
                <div className="truncate">
                  <h2 className="text-sm font-black text-white leading-none tracking-tight">
                    BlockFlow
                  </h2>
                  <span className="text-[10px] text-slate-500 font-medium">Daily Schedule</span>
                </div>
              </button>

              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
