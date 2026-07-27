import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getISOWeekString,
  getWeekDateRangeLabel,
  getAdjacentWeekId,
} from '../../utils/timeUtils';
import { ResolutionSelector } from '../Timetable/ResolutionSelector';
import { ExportModal } from '../Export/ExportModal';
import { AnalyticsModal } from '../Analytics/AnalyticsModal';
import { TemplatesModal } from '../Templates/TemplatesModal';
import { CloudSyncModal } from '../Sync/CloudSyncModal';
import { AIInsightsPanel } from '../AI/AIInsightsPanel';
import { WeeklyAIReportModal } from '../AI/WeeklyAIReportModal';
import { BlockFlowLogo } from '../Brand/BlockFlowLogo';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Trash2,
  RotateCcw,
  RotateCw,
  Download,
  PieChart,
  Bookmark,
  Cloud,
  Sun,
  Moon,
  Monitor,
  Bell,
  Sparkles,
  Award,
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const {
    currentWeekId,
    setCurrentWeekId,
    duplicateCurrentWeekTo,
    clearCurrentWeek,
    undo,
    redo,
    canUndo,
    canRedo,
    enableNotifications,
    notificationsEnabled,
  } = useTimetable();

  const { theme, setTheme } = useTheme();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);
  const [isAIReportOpen, setIsAIReportOpen] = useState(false);

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

  const handleDuplicateWeek = () => {
    const nextWeekId = getAdjacentWeekId(currentWeekId, 1);
    duplicateCurrentWeekTo(nextWeekId);
    setCurrentWeekId(nextWeekId);
  };

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <header className="min-h-16 bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none backdrop-blur-xl z-30">
      {/* Official BlockFlow Brand & Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <BlockFlowLogo size="md" />
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              BlockFlow
            </h1>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              <span>v3.0 AI</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">
            Plan visually. Execute consistently. Improve intelligently.
          </p>
        </div>
      </div>

      {/* Center & Right Action Controls Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none max-w-full py-0.5">
        {/* Week Navigation */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 p-1 rounded-xl sm:rounded-2xl border border-slate-800 shadow-inner shrink-0">
          <button
            onClick={handlePrevWeek}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="flex items-center gap-1 px-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-200 tracking-wide whitespace-nowrap">
              {dateRangeLabel}
            </span>
            {currentWeekId === thisWeekId && (
              <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline">
                Current
              </span>
            )}
          </div>

          <button
            onClick={handleNextWeek}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {currentWeekId !== thisWeekId && (
            <button
              onClick={handleTodayWeek}
              className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Today
            </button>
          )}

          <button
            onClick={handleDuplicateWeek}
            className="p-1 sm:px-2.5 sm:py-0.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] sm:text-xs font-semibold flex items-center gap-1"
            title="Duplicate Week"
          >
            <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden lg:inline">Duplicate</span>
          </button>

          <button
            onClick={clearCurrentWeek}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Clear Week"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* AI Insights Panel Trigger */}
        <button
          onClick={() => setIsAIInsightsOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-[11px] sm:text-xs shadow-md border border-indigo-400/30 shrink-0"
          title="AI Insights"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>AI Insights</span>
        </button>

        {/* Weekly AI Report Modal Trigger */}
        <button
          onClick={() => setIsAIReportOpen(true)}
          className="p-1.5 sm:p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0"
          title="Weekly AI Review Report"
        >
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Resolution Selector */}
        <ResolutionSelector />

        {/* Analytics */}
        <button
          onClick={() => setIsAnalyticsOpen(true)}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 shrink-0"
          title="Analytics"
        >
          <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
        </button>

        {/* Templates */}
        <button
          onClick={() => setIsTemplatesOpen(true)}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 shrink-0"
          title="Templates"
        >
          <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
        </button>

        {/* Cloud Sync */}
        <button
          onClick={() => setIsSyncOpen(true)}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 shrink-0"
          title="Cloud Sync"
        >
          <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
        </button>

        {/* Notifications */}
        <button
          onClick={enableNotifications}
          className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${
            notificationsEnabled
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
          }`}
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Theme Switcher */}
        <button
          onClick={cycleTheme}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 shrink-0"
          title={`Theme: ${theme.toUpperCase()}`}
        >
          {theme === 'dark' && <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />}
          {theme === 'light' && <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
          {theme === 'system' && <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />}
        </button>

        {/* Undo & Redo */}
        <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1 rounded-lg transition-all ${
              canUndo ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-600 opacity-50'
            }`}
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1 rounded-lg transition-all ${
              canRedo ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-600 opacity-50'
            }`}
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="flex items-center gap-1.5 py-1 sm:py-2 px-2.5 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700/80 shadow-md shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Feature Modals & Drawers */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />
      <TemplatesModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
      <CloudSyncModal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} />
      <AIInsightsPanel isOpen={isAIInsightsOpen} onClose={() => setIsAIInsightsOpen(false)} />
      <WeeklyAIReportModal isOpen={isAIReportOpen} onClose={() => setIsAIReportOpen(false)} />
    </header>
  );
};
