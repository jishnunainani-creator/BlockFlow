import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Goal } from '../../types/timetable';
import { loadGoals, saveGoals } from '../../utils/storage';
import { calculateGoalMetrics } from '../../utils/goalEngine';
import { GoalWizardModal } from '../Goals/GoalWizardModal';
import { GoalDetailModal } from '../Goals/GoalDetailModal';
import { ScheduleGoalBlockModal } from '../Goals/ScheduleGoalBlockModal';
import { AIGoalScheduleModal } from '../Goals/AIGoalScheduleModal';
import {
  Target,
  Plus,
  Clock,
  Calendar,
  Sparkles,
  TrendingUp,
  BarChart3,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { currentWeekScheduledBlocks, scheduledBlocks, addToast } = useTimetable();
  const allBlocks = currentWeekScheduledBlocks?.length > 0 ? currentWeekScheduledBlocks : scheduledBlocks || [];

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Sub-modal states for direct card quick actions
  const [scheduleGoal, setScheduleGoal] = useState<Goal | null>(null);
  const [aiScheduleGoal, setAiScheduleGoal] = useState<Goal | null>(null);

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  const handleSaveGoal = (newGoal: Goal) => {
    const updated = [newGoal, ...goals];
    setGoals(updated);
    saveGoals(updated);
    addToast(`Created Long-Term Goal: "${newGoal.title}"! 🎯`, 'success');
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    const updated = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    setGoals(updated);
    saveGoals(updated);
    setSelectedGoal(updatedGoal);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter((g) => g.id !== goalId);
    setGoals(updated);
    saveGoals(updated);
    addToast('Deleted Goal', 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-400" />
            <span>Goal-Based Long-Term Planner</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Convert long-term ambition into executable calendar actions ({goals.length} active goals)
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Set New Long-Term Goal</span>
        </button>
      </div>

      {/* Main Goals Grid or Clean Empty State */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const metrics = calculateGoalMetrics(goal, allBlocks);

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                style={{ borderLeftColor: goal.color || '#8B5CF6' }}
                className="p-5 rounded-2xl bg-slate-900 border-l-[5px] border-y border-r border-slate-800 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                        {goal.category}
                      </span>
                      <h3 className="text-base font-bold text-white leading-snug group-hover:text-purple-300 transition-colors">
                        {goal.title}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 shrink-0 font-mono">
                      {metrics.planProgressPct}% Plan
                    </span>
                  </div>

                  {/* Dual Metrics Summary Bars */}
                  <div className="space-y-2 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                        <span>Plan Progress</span>
                        <span className="text-white font-mono">{metrics.planProgressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          style={{ width: `${metrics.planProgressPct}%`, backgroundColor: goal.color || '#8B5CF6' }}
                          className="h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                        <span>Weekly Commitment Adherence</span>
                        <span className="text-emerald-400 font-mono">{metrics.commitmentAdherencePct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          style={{ width: `${metrics.commitmentAdherencePct}%` }}
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
                    <span>Target: {goal.targetWeeklyHours}h/week</span>
                    <span>Deadline: {goal.targetDate || goal.deadline}</span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAiScheduleGoal(goal);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    <Sparkles size={13} /> AI Schedule
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setScheduleGoal(goal);
                    }}
                    className="text-purple-400 hover:underline font-bold text-xs flex items-center gap-1"
                  >
                    + Schedule Block <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
            <Target size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Long-Term Goals Defined Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Tell BlockFlow where you want to reach, your target deadline, and your weekly commitment. BlockFlow will convert your ambition into executable timetable actions.
            </p>
          </div>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg inline-flex items-center gap-2 transition-all"
          >
            <Plus size={16} /> Set New Long-Term Goal
          </button>
        </div>
      )}

      {/* Creation Wizard Modal */}
      <GoalWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSaveGoal={handleSaveGoal}
      />

      {/* Goal Detail Modal */}
      <GoalDetailModal
        goal={selectedGoal}
        isOpen={selectedGoal !== null}
        onClose={() => setSelectedGoal(null)}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={handleDeleteGoal}
      />

      {/* Quick Action Sub-modals from cards */}
      <ScheduleGoalBlockModal
        goal={scheduleGoal}
        isOpen={scheduleGoal !== null}
        onClose={() => setScheduleGoal(null)}
      />

      <AIGoalScheduleModal
        goal={aiScheduleGoal}
        isOpen={aiScheduleGoal !== null}
        onClose={() => setAiScheduleGoal(null)}
      />
    </div>
  );
};
