import React from 'react';
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
  Shield,
  User,
  Crown,
  Brain,
  CheckSquare,
} from 'lucide-react';

export type NavView =
  | 'dashboard'
  | 'calendar'
  | 'goals'
  | 'assignments'
  | 'focus'
  | 'library'
  | 'templates'
  | 'analytics'
  | 'execution'
  | 'ai-insights'
  | 'reminders'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userEmail?: string | null;
  onOpenAuth: () => void;
  onOpenFocusMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  userEmail,
  onOpenAuth,
  onOpenFocusMode,
}) => {
  const navItems: { id: NavView; label: string; icon: React.FC<{ className?: string }>; badge?: string; action?: () => void }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'goals', label: 'Goals & Outcomes', icon: Target },
    { id: 'assignments', label: 'Assignment Tracker', icon: CheckSquare, badge: 'NEW' },
    { id: 'focus', label: 'Smart Focus Mode', icon: Zap, badge: 'PRO', action: onOpenFocusMode },
    { id: 'library', label: 'Activity Library', icon: LayoutGrid },
    { id: 'templates', label: 'Templates', icon: Bookmark },
    { id: 'analytics', label: 'Analytics & Reflection', icon: BarChart3 },
    { id: 'execution', label: 'Execution Intelligence', icon: Brain, badge: 'NEW' },
    { id: 'ai-insights', label: 'AI Coach', icon: Sparkles, badge: 'AI' },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const displayName = userEmail ? userEmail.split('@')[0] : 'Jishnu';
  const displayEmail = userEmail || 'jishnu@blockflow.ai';

  return (
    <aside
      className={`hidden md:flex h-full bg-slate-900 border-r border-slate-800 flex-col justify-between transition-all duration-200 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header & Logo */}
      <div>
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <BlockFlowLogo size="sm" />
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-bold text-white leading-none tracking-tight">
                  BlockFlow
                </h1>
                <span className="text-[10px] text-indigo-400 font-semibold">Execution OS</span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) item.action();
                  onSelectView(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pinned Bottom User Profile Card */}
      <div className="p-3 border-t border-slate-800">
        {!isCollapsed ? (
          <div
            onClick={onOpenAuth}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
              {displayName[0].toUpperCase()}
            </div>
            <div className="truncate flex-1 text-left">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <Crown className="w-3 h-3 text-amber-400 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mt-0.5">
                Pro Plan · Execution OS
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex justify-center p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-indigo-400 hover:text-white transition-colors"
            title={`${displayName} (${displayEmail})`}
          >
            <User className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
