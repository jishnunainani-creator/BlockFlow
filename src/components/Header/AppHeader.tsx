import React, { useState } from 'react';
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
  Calendar as CalendarIcon,
  Plus,
  Mic,
  FileText,
  Bot,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';

import { ResolutionSelector } from '../Timetable/ResolutionSelector';
import { FeasibilityBadge } from '../ExecutionOS/FeasibilityBadge';

interface AppHeaderProps {
  onOpenAISchedule?: (tab: 'voice' | 'text' | 'import') => void;
  onOpenAICommandCenter?: () => void;
  userEmail?: string | null;
  onOpenAuth?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenAISchedule,
  onOpenAICommandCenter,
  userEmail,
  onOpenAuth,
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
  const currentProfileConfig = DEMO_PROFILES.find(p => p.id === activeProfile);

  const activeSearchQuery = searchQuery.trim().toLowerCase();
  const matchCount = activeSearchQuery !== ''
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

  return (
    <header className="h-16 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-30 select-none">
      {/* ── LEFT: WEEK NAVIGATION & DATE RANGE ── */}
      <div className="flex items-center gap-2 font-mono">
        <button
          onClick={handleTodayWeek}
          className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-colors ${
            currentWeekId === thisWeekId
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          Today
        </button>

        <div className="flex items-center gap-0.5 bg-slate-950 rounded-xl border border-slate-800 p-0.5">
          <button
            onClick={handlePrevWeek}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNextWeek}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs font-bold text-slate-300 ml-1 whitespace-nowrap hidden md:inline">
          {dateRangeLabel}
        </span>

        {/* Live Schedule Feasibility Badge */}
        <div className="hidden lg:block ml-2">
          <FeasibilityBadge blocks={currentWeekScheduledBlocks} compact />
        </div>

        {/* Demo Workspace Badge */}
        {isDemoMode && (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm animate-pulse-subtle">
            <span>{currentProfileConfig?.icon || '🎭'} Demo Workspace ({currentProfileConfig?.title || 'Active'})</span>
            <button
              onClick={clearDemoData}
              className="ml-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-colors"
              title="Exit Demo Mode & Restore Real Data"
            >
              <RotateCcw size={10} /> Exit Demo
            </button>
          </div>
        )}
      </div>

      {/* ── CENTER: PRIMARY AI SCHEDULING ACTION BUTTONS ── */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onOpenAISchedule && onOpenAISchedule('text')}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Block</span>
        </button>

        <button
          onClick={() => onOpenAISchedule && onOpenAISchedule('voice')}
          className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
          title="Voice Scheduling"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>🎤 AI Schedule</span>
        </button>

        <button
          onClick={() => onOpenAISchedule && onOpenAISchedule('import')}
          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all hidden sm:flex"
          title="Import Schedule"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>📄 Import Schedule</span>
        </button>

        <button
          onClick={() => onOpenAICommandCenter && onOpenAICommandCenter()}
          className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-purple-400 hover:text-purple-300 rounded-xl transition-all"
          title="AI Command Center"
        >
          <Bot className="w-4 h-4" />
        </button>
      </div>

      {/* ── RIGHT: GRID INTERVAL SELECTOR, SEARCH & NOTIFICATIONS ── */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <ResolutionSelector />

        {/* Live Active Calendar Search Bar */}
        <div className="relative w-36 sm:w-44 md:w-52">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search timetable..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-14 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />

          {searchQuery && (
            <div className="absolute right-2 top-1.5 flex items-center gap-1">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                  matchCount > 0
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {matchCount}
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white p-0.5 rounded-full"
                title="Clear Search"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={enableNotifications}
          className={`p-2 rounded-xl border transition-colors ${
            notificationsEnabled
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Account / Auth Button */}
        {onOpenAuth && (
          userEmail ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all shrink-0"
              title={`Logged in as ${userEmail}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[90px] sm:max-w-[140px]">{userEmail}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )
        )}
      </div>
    </header>
  );
};
