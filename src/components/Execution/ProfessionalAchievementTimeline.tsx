import React from 'react';
import { CustomMilestone } from '../../types/executionOS';
import { loadCustomMilestones, SYSTEM_MILESTONE_DEFINITIONS } from '../../utils/assignmentStorage';
import { extractMetricsFromData, calculateMilestones } from '../../utils/milestoneEngine';
import { useExecution } from '../../context/ExecutionContext';
import { useTimetable } from '../../context/TimetableContext';
import { loadAssignments } from '../../utils/assignmentStorage';
import { Trophy, Star, Zap, Code, BookOpen, Medal, CheckCircle2 } from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  focus: Zap,
  consistency: Star,
  career: Code,
  learning: BookOpen,
  personal: Medal,
};

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  focus: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  consistency: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  career: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  learning: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  personal: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
};

export default function ProfessionalAchievementTimeline() {
  const { currentWeekScheduledBlocks, scheduledBlocks } = useTimetable();
  const { dailyScores, reflections, streaks } = useExecution();
  const assignments = loadAssignments();

  const custom = loadCustomMilestones();
  const metrics = extractMetricsFromData({
    scheduledBlocks: currentWeekScheduledBlocks || scheduledBlocks,
    dailyScores,
    reflections,
    assignments,
    goals: [],
    streaks,
  });

  const { updatedSystemMilestones } = calculateMilestones(
    SYSTEM_MILESTONE_DEFINITIONS,
    custom,
    metrics
  );

  const allMilestones = [...updatedSystemMilestones, ...custom];
  const unlocked = allMilestones.filter((m) => m.isUnlocked);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Trophy className="text-indigo-400" size={20} />
            Professional Achievement Timeline
          </h2>
          <p className="text-slate-400 text-sm">
            Verified productivity milestones derived from your actual execution history
          </p>
        </div>
        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs font-bold text-indigo-400">
          {unlocked.length} Earned
        </span>
      </div>

      {unlocked.length > 0 ? (
        <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
          {unlocked.map((m) => {
            const Icon = CATEGORY_ICONS[m.category] || Trophy;
            const cfg = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.focus;

            return (
              <div key={m.id} className="relative">
                <div
                  className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full ${cfg.bg} ${cfg.border} border-2 flex items-center justify-center`}
                >
                  <Icon size={14} className={cfg.color} />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-200">{m.title}</h3>
                    <span className="text-xs font-medium text-slate-500">
                      {m.earnedDate || 'Unlocked'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400/90 font-semibold">
                      Verified Achievement
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 text-center space-y-2">
          <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No Unlocked Achievements Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Complete your scheduled activity blocks, daily reflections, and focus sessions in BlockFlow to automatically earn verified milestones!
          </p>
        </div>
      )}
    </div>
  );
}
