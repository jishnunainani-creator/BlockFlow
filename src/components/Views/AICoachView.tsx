import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getProductivityDNA, generateWeeklyAIReport } from '../../utils/aiProductivityEngine';
import { WeeklyAIReportModal } from '../AI/WeeklyAIReportModal';
import {
  Sparkles,
  Zap,
  Dna,
  Clock,
  Calendar,
  Award,
  TrendingUp,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const AICoachView: React.FC = () => {
  const { currentWeekScheduledBlocks, currentWeekId } = useTimetable();
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  const dna = getProductivityDNA();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span>AI Productivity Coach & DNA Profile</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Private execution intelligence learning your peak hours, optimal session lengths, and habits over time
          </p>
        </div>

        <button
          onClick={() => setShowWeeklyReport(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Sunday Reflection Report</span>
        </button>
      </div>

      {/* ── PERSONAL PRODUCTIVITY DNA CARDS GRID ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Dna className="w-4 h-4 text-indigo-400" />
          <span>Personal Productivity DNA (Learned Habits)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Peak Focus Window</span>
            <div className="text-base font-bold text-white mt-1">{dna.peakFocusWindow}</div>
            <p className="text-[10px] text-indigo-400 font-semibold mt-1">94% Completion Rate</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Preferred Session</span>
            <div className="text-base font-bold text-white mt-1">{dna.preferredSessionMinutes} minutes</div>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">Optimal focus length</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Max Effective Study</span>
            <div className="text-base font-bold text-white mt-1">{dna.maxEffectiveDailyHours} hours / day</div>
            <p className="text-[10px] text-purple-400 font-semibold mt-1">Prevents burnout limit</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Most Productive Day</span>
            <div className="text-base font-bold text-white mt-1">{dna.mostProductiveDay}</div>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">Highest execution score</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Fatigue Drop-off</span>
            <div className="text-base font-bold text-white mt-1">{dna.leastProductiveTime}</div>
            <p className="text-[10px] text-amber-400 font-semibold mt-1">Avoid complex study</p>
          </div>
        </div>
      </div>

      {/* ── AI COACH ADVICE CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Execution Habit Insight</span>
            </h4>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              High Impact
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            "You complete workouts 96% of the time before breakfast, but skip late-night study sessions after 9 PM. Mapped recommendations: Schedule your hardest DSA sheets between 9 AM – 11:30 AM."
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Life Balance Analysis</span>
            </h4>
            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              Balanced
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Learning</span>
              <span className="font-bold text-indigo-400">45%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Career</span>
              <span className="font-bold text-emerald-400">35%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Health</span>
              <span className="font-bold text-rose-400">20%</span>
            </div>
          </div>
        </div>
      </div>

      <WeeklyAIReportModal isOpen={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} />
    </div>
  );
};
