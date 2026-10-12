import React, { useState, useEffect, useCallback } from 'react';
import { BlockFlowLogo } from '../Brand/BlockFlowLogo';
import {
  LayoutDashboard,
  Calendar,
  Target,
  Zap,
  LayoutGrid,
  Bookmark,
  BarChart3,
  Sparkles,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Brain,
  CheckSquare,
  Inbox,
  X,
  BookOpen,
  Sun,
  Sliders,
} from 'lucide-react';
import { getUnprocessedCount } from '../../utils/quickCaptureStorage';

export type NavView =
  | 'my-day'
  | 'dashboard'
  | 'calendar'
  | 'adaptive-planner'
  | 'task-inbox'
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
  | 'settings';

export interface NavItemConfig {
  id: NavView;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  action?: () => void;
}

export interface NavGroupConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
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

const STORAGE_COLLAPSED_GROUPS_KEY = 'blockflow_sidebar_collapsed_groups_v1';

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
  // ── 0. UNPROCESSED QUICK CAPTURE COUNT ──
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

  // ── 1. DEFINING THE NEW 5-GROUP INFORMATION ARCHITECTURE ──
  const navGroups: NavGroupConfig[] = React.useMemo(() => [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        { id: 'my-day', label: 'My Day', icon: Sun },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      id: 'plan',
      title: 'Plan & Organize',
      items: [
        { id: 'calendar', label: 'Calendar & Timetable', icon: Calendar },
        { id: 'adaptive-planner', label: 'Adaptive Planner', icon: Sliders },
        {
          id: 'task-inbox',
          label: 'Universal Inbox',
          icon: Inbox,
          badge: unprocessedCount > 0 ? String(unprocessedCount) : undefined,
        },
        { id: 'assignments', label: 'Assignment Tracker', icon: CheckSquare },
        { id: 'goals', label: 'Goals & Planning', icon: Target },
      ],
    },
    {
      id: 'focus',
      title: 'Focus & Improve',
      items: [
        { id: 'focus', label: 'Focus Mode', icon: Zap, action: onOpenFocusMode },
        { id: 'library', label: 'Activity Library', icon: LayoutGrid },
        { id: 'resources', label: 'Resources', icon: BookOpen },
        { id: 'templates', label: 'Templates', icon: Bookmark },
        { id: 'ai-insights', label: 'AI Coach', icon: Sparkles },
      ],
    },
    {
      id: 'insights',
      title: 'Insights',
      items: [
        { id: 'analytics', label: 'Analytics & Reflection', icon: BarChart3 },
        { id: 'execution', label: 'Execution Intelligence', icon: Brain },
      ],
    },
    {
      id: 'utilities',
      title: 'Utilities',
      items: [
        { id: 'reminders', label: 'Reminders', icon: Bell },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ], [onOpenFocusMode, unprocessedCount]);

  // ── 2. COLLAPSED GROUPS STATE WITH PERSISTENCE ──
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_COLLAPSED_GROUPS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback to all expanded
    }
    return {};
  });

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const updated = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem(STORAGE_COLLAPSED_GROUPS_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  }, []);

  // ── 3. PRESERVE ACTIVE ROUTE VISIBILITY ──
  // If active page belongs to a collapsed group, automatically expand it.
  useEffect(() => {
    const parentGroup = navGroups.find((g) => g.items.some((item) => item.id === currentView));
    if (parentGroup && collapsedGroups[parentGroup.id]) {
      setCollapsedGroups((prev) => {
        const updated = { ...prev, [parentGroup.id]: false };
        try {
          localStorage.setItem(STORAGE_COLLAPSED_GROUPS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  }, [currentView, navGroups, collapsedGroups]);

  // ── 4. HANDLE KEYBOARD SHORTCUT (Escape to close mobile drawer) ──
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

  // ── 5. NAVIGATION CONTENT RENDERER ──
  const renderNavContent = (isMobileDrawer: boolean) => {
    const isIconOnly = !isMobileDrawer && isCollapsed;

    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Scrollable Groups Container */}
        <nav
          className="flex-1 overflow-y-auto px-2 py-3 space-y-3.5 scrollbar-thin select-none"
          aria-label="Main Navigation"
        >
          {/* Quick Capture Primary CTA */}
          {onOpenQuickCapture && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => {
                  onOpenQuickCapture();
                  if (isMobileDrawer && onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  isIconOnly
                    ? 'justify-center px-2 bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-[#4F73E3]'
                    : 'px-3 bg-[#3659C9]/10 hover:bg-[#3659C9]/20 border-[#3659C9]/30 text-[#4F73E3] dark:text-[#60A5FA]'
                }`}
                title="Quick Capture (Q)"
                aria-label="Quick Capture"
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                {!isIconOnly && (
                  <span className="flex-1 text-left font-semibold">Quick Capture</span>
                )}
                {!isIconOnly && (
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">
                    Q
                  </kbd>
                )}
              </button>
            </div>
          )}

          {navGroups.map((group, groupIdx) => {
            const isGroupCollapsed = !isIconOnly && !!collapsedGroups[group.id];

            return (
              <div key={group.id} className="space-y-1">
                {/* Desktop Icon-only mode separator */}
                {isIconOnly && groupIdx > 0 && (
                  <div className="my-2 border-t border-slate-800/60" role="separator" />
                )}

                {/* Group Heading (Shown only when expanded) */}
                {!isIconOnly && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!isGroupCollapsed}
                    aria-controls={`group-items-${group.id}`}
                    className="w-full flex items-center justify-between px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3659C9]"
                  >
                    <span className="truncate">{group.title}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-slate-500 transition-transform duration-200 shrink-0 ${
                        isGroupCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                )}

                {/* Group Items List */}
                {(!isGroupCollapsed || isIconOnly) && (
                  <div
                    id={`group-items-${group.id}`}
                    className="space-y-0.5"
                    role="group"
                    aria-label={group.title}
                  >
                    {group.items.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = currentView === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative text-left group ${
                            isActive
                              ? 'bg-slate-800 text-slate-100 font-semibold shadow-xs'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          } ${isIconOnly ? 'justify-center px-2' : ''}`}
                          title={isIconOnly ? item.label : undefined}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <IconComponent
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-[#3659C9] dark:text-[#4F73E3]'
                                : 'text-slate-400 group-hover:text-slate-300'
                            }`}
                            aria-hidden="true"
                          />

                          {!isIconOnly && (
                            <span className="truncate flex-1">{item.label}</span>
                          )}

                          {!isIconOnly && item.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                              {item.badge}
                            </span>
                          )}

                          {isActive && (
                            <div
                              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#3659C9] dark:bg-[#4F73E3] rounded-r"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Pinned Bottom User Profile Card */}
        <div className="p-3 border-t border-slate-800/80 shrink-0">
          {!isIconOnly ? (
            <div
              onClick={() => {
                onOpenAuth();
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors group"
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
              <div className="w-8 h-8 rounded-full bg-[#3659C9] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {displayName[0].toUpperCase()}
              </div>
              <div className="truncate flex-1 text-left">
                <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{displayEmail}</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full flex justify-center p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
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
        className={`hidden md:flex h-full bg-slate-900 border-r border-slate-800 flex-col justify-between transition-all duration-200 select-none z-30 shrink-0 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        aria-label="Desktop Sidebar"
      >
        {/* Header & Logo (Click to navigate to Dashboard) */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => onSelectView('dashboard')}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-85 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3659C9] rounded-lg p-1 -m-1 cursor-pointer"
            title="Return to Dashboard"
            aria-label="Return to Dashboard"
          >
            <BlockFlowLogo size="sm" />
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-bold text-white leading-none tracking-tight">
                  BlockFlow
                </h1>
                <span className="text-[10px] text-slate-500 font-medium">Daily Schedule</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
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
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <div className="relative z-50 w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 flex flex-col justify-between shadow-2xl">
            {/* Mobile Drawer Header */}
            <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  onSelectView('dashboard');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center gap-3 min-w-0 text-left hover:opacity-85 transition-opacity focus:outline-none rounded-lg p-1 -m-1 cursor-pointer"
                title="Return to Dashboard"
                aria-label="Return to Dashboard"
              >
                <BlockFlowLogo size="sm" />
                <div className="truncate">
                  <h2 className="text-sm font-bold text-white leading-none tracking-tight">
                    BlockFlow
                  </h2>
                  <span className="text-[10px] text-slate-500 font-medium">Daily Schedule</span>
                </div>
              </button>

              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content */}
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
