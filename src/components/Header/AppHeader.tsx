import React, { useState, useRef, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useDemo } from '../../context/DemoContext';
import { DEMO_PROFILES } from '../../types/demo';
import {
  getISOWeekString,
  getWeekDateRangeLabel,
  getAdjacentWeekId,
} from '../../utils/timeUtils';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Plus,
  Mic,
  FileText,
  Bot,
  RotateCcw,
  X,
  Menu,
  MoreHorizontal,
  User,
  Settings,
  LogOut,
  Sparkles,
  Home,
} from 'lucide-react';

import { ResolutionSelector } from '../Timetable/ResolutionSelector';
import { FeasibilityBadge } from '../ExecutionOS/FeasibilityBadge';

interface AppHeaderProps {
  onOpenAISchedule?: (tab: 'voice' | 'text' | 'import') => void;
  onOpenAICommandCenter?: () => void;
  userEmail?: string | null;
  onOpenAuth?: () => void;
  onOpenMobileMenu?: () => void;
  onNavigateHome?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenAISchedule,
  onOpenAICommandCenter,
  userEmail,
  onOpenAuth,
  onOpenMobileMenu,
  onNavigateHome,
}) => {
  const {
    currentWeekId,
    setCurrentWeekId,
    enableNotifications,
    notificationsEnabled,
    currentWeekScheduledBlocks,
    searchQuery,
    setSearchQuery,
  } = useTimetable();

  const { isDemoMode, activeProfile, clearDemoData } = useDemo();
  const currentProfileConfig = DEMO_PROFILES.find((p) => p.id === activeProfile);

  // Dropdown states
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const overflowRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Click outside and escape handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (overflowRef.current && !overflowRef.current.contains(target)) {
        setIsOverflowOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(target)) {
        setIsMobileSearchOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOverflowOpen(false);
        setIsProfileOpen(false);
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Autofocus when mobile search is opened
  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  const activeSearchQuery = searchQuery.trim().toLowerCase();
  const matchCount =
    activeSearchQuery !== ''
      ? (currentWeekScheduledBlocks || []).filter((b) => {
          return (
            b.title.toLowerCase().includes(activeSearchQuery) ||
            (b.description && b.description.toLowerCase().includes(activeSearchQuery)) ||
            (b.goalTitle && b.goalTitle.toLowerCase().includes(activeSearchQuery)) ||
            (b.priority && b.priority.toLowerCase().includes(activeSearchQuery))
          );
        }).length
      : 0;

  const dateRangeLabel = getWeekDateRangeLabel(currentWeekId);
  const thisWeekId = getISOWeekString();

  const handlePrevWeek = () => {
    setCurrentWeekId(getAdjacentWeekId(currentWeekId, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekId(getAdjacentWeekId(currentWeekId, 1));
  };

  const handleTodayWeek = () => {
    setCurrentWeekId(thisWeekId);
  };

  const displayName = userEmail ? userEmail.split('@')[0] : 'Guest';
  const initial = displayName ? displayName[0].toUpperCase() : 'U';

  return (
    <header className="h-14 px-3 sm:px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-30 select-none">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── LEFT: NAVIGATION & DATE CONTROLS ──                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0 flex items-center gap-1 text-xs"
            title="Return to Dashboard"
            aria-label="Return to Dashboard"
          >
            <Home className="w-4 h-4" />
            <span className="hidden xl:inline text-slate-400 font-medium text-[11px]">Dashboard</span>
          </button>
        )}

        <button
          onClick={handleTodayWeek}
          className={`px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors shrink-0 ${
            currentWeekId === thisWeekId
              ? 'bg-[#3659C9] dark:bg-[#4F73E3] text-white border-transparent'
              : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:text-white'
          }`}
          title="Jump to current week"
        >
          Today
        </button>

        <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg border border-slate-700/60 p-0.5 shrink-0">
          <button
            onClick={handlePrevWeek}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            title="Previous Week"
            aria-label="Previous Week"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={handleNextWeek}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            title="Next Week"
            aria-label="Next Week"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-300 ml-1 whitespace-nowrap hidden lg:inline">
          {dateRangeLabel}
        </span>

        {/* Demo Workspace Badge */}
        {isDemoMode && (
          <div className="hidden xl:flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <span>Demo</span>
            <button
              onClick={clearDemoData}
              className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-semibold uppercase flex items-center gap-0.5 transition-colors"
              title="Exit Demo Mode"
            >
              <RotateCcw size={9} /> Exit
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── CENTRE: PRIMARY TIMETABLE ACTIONS ──                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Primary Action 1: New Block */}
        <button
          type="button"
          onClick={() => onOpenAISchedule && onOpenAISchedule('text')}
          className="px-2.5 sm:px-3 py-1.5 bg-[#3659C9] hover:bg-[#2B47A8] dark:bg-[#4F73E3] dark:hover:bg-[#6384ED] text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
          title="Create a new activity block"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Block</span>
          <span className="sm:hidden">Block</span>
        </button>

        {/* Primary Action 2: AI Schedule */}
        <button
          type="button"
          onClick={() => onOpenAISchedule && onOpenAISchedule('voice')}
          className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
          title="Voice and smart AI scheduling"
        >
          <Mic className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">AI Schedule</span>
          <span className="sm:hidden">AI</span>
        </button>

        {/* Primary Action 3: Current Grid Interval */}
        <ResolutionSelector forceCompact />

        {/* Live Feasibility Badge (shown on larger screens) */}
        <div className="hidden 2xl:block">
          <FeasibilityBadge blocks={currentWeekScheduledBlocks} compact />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── RIGHT: UTILITIES (SEARCH, OVERFLOW, BELL, PROFILE) ──    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Desktop Inline Search Bar (Visible on lg+) */}
        <div className="relative hidden lg:block w-36 xl:w-44">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search timetable..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-12 py-1.5 bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#3659C9] transition-colors"
          />

          {searchQuery && (
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              <span
                className={`text-[9px] font-medium px-1.5 py-0.5 rounded font-mono ${
                  matchCount > 0
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {matchCount}
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded-full"
                title="Clear Search"
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile/Tablet Search Trigger & Popover (Visible on < lg) */}
        <div className="relative lg:hidden" ref={mobileSearchRef}>
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`p-1.5 rounded-lg border transition-colors relative ${
              isMobileSearchOpen || searchQuery
                ? 'bg-slate-700 border-slate-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700/60'
            }`}
            title="Search Timetable"
            aria-label="Search Timetable"
          >
            <Search className="w-4 h-4" />
            {searchQuery && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#3659C9]" />
            )}
          </button>

          {isMobileSearchOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search blocks, goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-14 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#3659C9]"
                />
                {searchQuery && (
                  <div className="absolute right-2 flex items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded">
                      {matchCount}
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Overflow Menu for Secondary Actions (Import, AI Command Center) */}
        <div className="relative" ref={overflowRef}>
          <button
            type="button"
            onClick={() => setIsOverflowOpen(!isOverflowOpen)}
            aria-expanded={isOverflowOpen}
            aria-label="More timetable actions"
            className={`p-1.5 rounded-lg border transition-colors ${
              isOverflowOpen
                ? 'bg-slate-700 border-slate-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isOverflowOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1 z-50 animate-fade-in">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                More Actions
              </div>

              {onOpenAISchedule && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOverflowOpen(false);
                    onOpenAISchedule('import');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Import Schedule</span>
                </button>
              )}

              {onOpenAICommandCenter && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOverflowOpen(false);
                    onOpenAICommandCenter();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Bot className="w-3.5 h-3.5 text-slate-400" />
                  <span>AI Command Center</span>
                </button>
              )}

              <div className="mt-1 pt-1 border-t border-slate-800 px-2 py-1 text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-400" />
                <span>Shortcuts: Press 'G' then 'C'</span>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={enableNotifications}
          className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
            notificationsEnabled
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200'
          }`}
          title={notificationsEnabled ? 'Notifications active' : 'Enable notifications'}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* ── PROFILE / ACCOUNT DROPDOWN (NEVER CLIPPED) ── */}
        <div className="relative shrink-0" ref={profileRef}>
          {userEmail ? (
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-expanded={isProfileOpen}
              aria-label={`Account menu for ${userEmail}`}
              className="w-8 h-8 rounded-full bg-[#3659C9] hover:bg-[#2B47A8] dark:bg-[#4F73E3] text-white flex items-center justify-center font-semibold text-xs border border-slate-700/80 shadow-sm relative transition-colors focus:outline-none focus:ring-2 focus:ring-[#3659C9]"
              title={`Account: ${userEmail}`}
            >
              <span>{initial}</span>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (onOpenAuth ? onOpenAuth() : setIsProfileOpen(!isProfileOpen))}
              className="px-2.5 py-1.5 rounded-lg bg-[#3659C9] hover:bg-[#2B47A8] dark:bg-[#4F73E3] text-white text-xs font-medium transition-colors shrink-0 shadow-sm"
            >
              Sign In
            </button>
          )}

          {isProfileOpen && userEmail && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
              {/* User Details */}
              <div className="p-2 border-b border-slate-800 mb-1">
                <div className="text-xs font-semibold text-white truncate">{displayName}</div>
                <div className="text-[11px] text-slate-400 truncate">{userEmail}</div>
                <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Pro Plan · Active
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-0.5">
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Settings</span>
                  </button>
                )}

                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
