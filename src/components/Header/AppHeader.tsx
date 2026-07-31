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
} from 'lucide-react';

import { ResolutionSelector } from '../Timetable/ResolutionSelector';

interface AppHeaderProps {
  onOpenAISchedule?: (tab: 'voice' | 'text' | 'import') => void;
  onOpenAICommandCenter?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenAISchedule,
  onOpenAICommandCenter,
}) => {
  const {
    currentWeekId,
    setCurrentWeekId,
    enableNotifications,
    notificationsEnabled,
  } = useTimetable();

  const { isDemoMode, activeProfile, clearDemoData } = useDemo();
  const currentProfileConfig = DEMO_PROFILES.find(p => p.id === activeProfile);

  const [searchQuery, setSearchQuery] = useState('');

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
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0 select-none z-30 overflow-x-auto scrollbar-none">
      {/* ── LEFT: ← TODAY → & WEEK RANGE ── */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={handlePrevWeek}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleTodayWeek}
            className="px-2.5 py-1 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Today
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

      {/* ── CENTER: PRIMARY AI SCHEDULING ACTION BUTTONS (Section 53) ── */}
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

        <div className="relative hidden lg:block w-36">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
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
      </div>
    </header>
  );
};
