import React, { useState } from 'react';
import { NavView } from './Sidebar';
import {
  Calendar,
  Plus,
  Bot,
  Upload,
  Brain,
  Moon,
  Target,
  CheckSquare,
  User,
  Menu,
  LayoutDashboard,
  Sun,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenAddBlock: () => void;
  onOpenAISchedule: (tab: 'voice' | 'text' | 'import') => void;
  onOpenEndOfDay?: () => void;
  userEmail?: string | null;
  onOpenAuth?: () => void;
  onOpenMobileMenu?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenAddBlock,
  onOpenAISchedule,
  onOpenEndOfDay,
  userEmail,
  onOpenAuth,
  onOpenMobileMenu,
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
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Actions</span>
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
              onClick={() => { setShowQuickActions(false); onSelectView('my-day'); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-white transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-amber-500 text-white">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">My Day</p>
                <p className="text-[10px] text-slate-400">Daily command centre, schedule & tasks</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setShowQuickActions(false); onSelectView('dashboard'); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-white transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-[#3659C9] text-white">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">Home Dashboard</p>
                <p className="text-[10px] text-slate-400">Daily mission, KPIs & overview</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setShowQuickActions(false); onOpenAddBlock(); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-white transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-[#3659C9] text-white">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">Create Activity Block</p>
                <p className="text-[10px] text-slate-400">Add custom subject, class or task</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setShowQuickActions(false); onOpenAISchedule('voice'); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-white transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-slate-700 text-slate-200">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">AI Schedule Assistant</p>
                <p className="text-[10px] text-slate-400">Voice or text auto-scheduling</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setShowQuickActions(false); onOpenAISchedule('import'); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-white transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-slate-700 text-slate-200">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">Import Timetable</p>
                <p className="text-[10px] text-slate-400">Upload JSON or syllabus schedule</p>
              </div>
            </button>

            {onOpenEndOfDay && (
              <button
                type="button"
                onClick={() => { setShowQuickActions(false); onOpenEndOfDay(); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-white transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-slate-700 text-slate-200">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">End My Day</p>
                  <p className="text-[10px] text-slate-400">Daily review &amp; reflection ritual</p>
                </div>
              </button>
            )}

            {onOpenAuth && (
              <button
                type="button"
                onClick={() => { setShowQuickActions(false); onOpenAuth(); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-white transition-colors text-left mt-1"
              >
                <div className="p-2 rounded-lg bg-slate-700 text-slate-200">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{userEmail ? `Account (${userEmail})` : 'Sign In / Account'}</p>
                  <p className="text-[10px] text-slate-400">{userEmail ? 'Manage session & Cloud Sync' : 'Access account & save timetable'}</p>
                </div>
              </button>
            )}

            {onOpenMobileMenu && (
              <button
                type="button"
                onClick={() => { setShowQuickActions(false); onOpenMobileMenu(); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-white transition-colors text-left mt-1"
              >
                <div className="p-2 rounded-lg bg-slate-700 text-slate-200">
                  <Menu className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Browse All Sections</p>
                  <p className="text-[10px] text-slate-400">Open complete grouped navigation menu</p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── FIXED BOTTOM NAVIGATION BAR (< 768px) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex items-center justify-around h-16 px-1 select-none">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectView('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'dashboard'
              ? 'text-[#3659C9] dark:text-[#4F73E3] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Home Dashboard"
          aria-label="Home Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        {/* 2. Calendar */}
        <button
          type="button"
          onClick={() => onSelectView('calendar')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'calendar'
              ? 'text-[#3659C9] dark:text-[#4F73E3] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Calendar & Timetable"
          aria-label="Calendar & Timetable"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Calendar</span>
        </button>

        {/* 3. Center ADD Floating Action Button */}
        <div className="relative -top-5 flex-1 flex justify-center">
          <button
            type="button"
            onClick={() => setShowQuickActions(true)}
            className="w-12 h-12 rounded-full bg-[#3659C9] dark:bg-[#4F73E3] text-white shadow-lg flex items-center justify-center border-2 border-slate-900 active:scale-95 transition-transform"
            title="Quick Action Menu"
            aria-label="Quick Action Menu"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Goals */}
        <button
          type="button"
          onClick={() => onSelectView('goals')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'goals'
              ? 'text-[#3659C9] dark:text-[#4F73E3] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Goals & Planning"
          aria-label="Goals & Planning"
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Goals</span>
        </button>

        {/* 5. Sections Menu */}
        <button
          type="button"
          onClick={() => (onOpenMobileMenu ? onOpenMobileMenu() : onSelectView('settings'))}
          className="flex flex-col items-center justify-center flex-1 py-1 transition-colors text-slate-400 hover:text-slate-200"
          title="Browse All Sections"
          aria-label="Browse All Sections"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Sections</span>
        </button>
      </nav>
    </>
  );
};
