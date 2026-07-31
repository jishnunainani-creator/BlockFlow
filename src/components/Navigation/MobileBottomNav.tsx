import React, { useState } from 'react';
import { NavView } from './Sidebar';
import { Calendar, Plus, Bot, BarChart3, Settings, Sparkles, FileText, Upload, Brain, Moon } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenAddBlock: () => void;
  onOpenAISchedule: (tab: 'voice' | 'text' | 'import') => void;
  onOpenEndOfDay?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenAddBlock,
  onOpenAISchedule,
  onOpenEndOfDay,
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <>
      {/* ── QUICK ACTION FLOATING MENU ── */}
      {showQuickActions && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end p-4 animate-fade-in"
          onClick={() => setShowQuickActions(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</span>
              <button
                type="button"
                onClick={() => setShowQuickActions(false)}
                className="text-xs text-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setShowQuickActions(false); onOpenAddBlock(); }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-white transition-all text-left"
            >
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Create Activity Block</p>
                <p className="text-[10px] text-indigo-300">Add custom subject, class or task</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setShowQuickActions(false); onOpenAISchedule('voice'); }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-white transition-all text-left"
            >
              <div className="p-2 rounded-xl bg-purple-600 text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">AI Schedule Assistant</p>
                <p className="text-[10px] text-purple-300">Voice or text auto-scheduling</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setShowQuickActions(false); onOpenAISchedule('import'); }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-white transition-all text-left"
            >
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Import Timetable</p>
                <p className="text-[10px] text-emerald-300">Upload JSON or syllabus schedule</p>
              </div>
            </button>

            {onOpenEndOfDay && (
              <button
                type="button"
                onClick={() => { setShowQuickActions(false); onOpenEndOfDay(); }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/40 text-white transition-all text-left"
              >
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">End My Day</p>
                  <p className="text-[10px] text-slate-400">Daily review &amp; reflection ritual</p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── FIXED BOTTOM NAVIGATION BAR (< 768px) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 flex items-center justify-around h-16 px-2 select-none">
        
        {/* 1. Calendar */}
        <button
          type="button"
          onClick={() => onSelectView('calendar')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentView === 'calendar' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Calendar</span>
        </button>

        {/* 2. Growth (Execution Intelligence) */}
        <button
          type="button"
          onClick={() => onSelectView('execution')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentView === 'execution' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Growth</span>
        </button>

        {/* 3. Center ADD Floating Action Button */}
        <div className="relative -top-5 flex-1 flex justify-center">
          <button
            type="button"
            onClick={() => setShowQuickActions(true)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center border-2 border-slate-950 active:scale-90 hover:scale-105 transition-all"
            title="Quick Action"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. AI Coach */}
        <button
          type="button"
          onClick={() => onSelectView('ai-insights')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentView === 'ai-insights' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">AI</span>
        </button>

        {/* 5. Settings */}
        <button
          type="button"
          onClick={() => onSelectView('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentView === 'settings' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Settings</span>
        </button>
      </nav>
    </>
  );
};
