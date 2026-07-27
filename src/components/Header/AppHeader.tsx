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
    <header className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between gap-3 shrink-0 select-none backdrop-blur-xl z-30">
      {/* Official BlockFlow Brand & Logo */}
      <div className="flex items-center gap-3">
        <BlockFlowLogo size="md" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-white tracking-tight">
              BlockFlow
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>v3.0 AI</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Plan visually. Execute consistently. Improve intelligently.
          </p>
        </div>
      </div>

      {/* Center: Week Navigation & Date Range */}
      <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
        <button
          onClick={handlePrevWeek}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title="Previous Week"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 px-2">
          <span className="text-xs font-bold text-slate-200 tracking-wide">
            {dateRangeLabel}
          </span>
          {currentWeekId === thisWeekId && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Current
            </span>
          )}
        </div>

        <button
          onClick={handleNextWeek}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title="Next Week"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {currentWeekId !== thisWeekId && (
          <button
            onClick={handleTodayWeek}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Today
          </button>
        )}

        {/* Duplicate Week */}
        <button
          onClick={handleDuplicateWeek}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all"
          title="Copy this timetable to next week"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Duplicate Week</span>
        </button>

        {/* Clear Week */}
        <button
          onClick={clearCurrentWeek}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
          title="Clear active week schedule"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right AI & Controls Triggers */}
      <div className="flex items-center gap-2">
        {/* AI Insights Panel Trigger */}
        <button
          onClick={() => setIsAIInsightsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
          title="Open AI Productivity Intelligence & Smart Schedule"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden lg:inline">AI Insights</span>
        </button>

        {/* Weekly AI Report Modal Trigger */}
        <button
          onClick={() => setIsAIReportOpen(true)}
          className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 shadow transition-all"
          title="Weekly AI Review Report"
        >
          <Award className="w-4 h-4" />
        </button>

        {/* Resolution Selector */}
        <ResolutionSelector />

        {/* Analytics Dashboard Trigger */}
        <button
          onClick={() => setIsAnalyticsOpen(true)}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow transition-all"
          title="Productivity Analytics Dashboard"
        >
          <PieChart className="w-4 h-4 text-indigo-400" />
        </button>

        {/* Templates Trigger */}
        <button
          onClick={() => setIsTemplatesOpen(true)}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow transition-all"
          title="Saved Timetable Templates"
        >
          <Bookmark className="w-4 h-4 text-purple-400" />
        </button>

        {/* Cloud Sync Trigger */}
        <button
          onClick={() => setIsSyncOpen(true)}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow transition-all"
          title="Cloud Backup & Sync"
        >
          <Cloud className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Notifications Toggle */}
        <button
          onClick={enableNotifications}
          className={`p-2 rounded-xl border transition-all ${
            notificationsEnabled
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
          }`}
          title={notificationsEnabled ? 'Notifications active' : 'Enable browser notifications'}
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Theme Switcher Toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow transition-all"
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
        >
          {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
          {theme === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
          {theme === 'system' && <Monitor className="w-4 h-4 text-sky-400" />}
        </button>

        {/* Undo & Redo */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
              canUndo
                ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
              canRedo
                ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700/80 shadow-md active:scale-95 transition-all"
        >
          <Download className="w-4 h-4 text-indigo-400" />
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
