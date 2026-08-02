import React, { useState } from 'react';
import { Goal, GoalComponent, GoalMilestone, ScheduledBlock } from '../../types/timetable';
import { calculateGoalMetrics } from '../../utils/goalEngine';
import { useTimetable } from '../../context/TimetableContext';
import { ScheduleGoalBlockModal } from './ScheduleGoalBlockModal';
import { AIGoalBreakdownModal } from './AIGoalBreakdownModal';
import { AIGoalScheduleModal } from './AIGoalScheduleModal';
import {
  Target,
  Clock,
  Calendar,
  Sparkles,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  Layers,
  Flag,
  Flame,
  ShieldAlert,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

interface GoalDetailModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateGoal: (updatedGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  goal,
  isOpen,
  onClose,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const { currentWeekScheduledBlocks, scheduledBlocks, addToast } = useTimetable();
  const allBlocks = currentWeekScheduledBlocks?.length > 0 ? currentWeekScheduledBlocks : scheduledBlocks || [];

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isAIScheduleOpen, setIsAIScheduleOpen] = useState(false);

  // New sub-component form state
  const [newCompTitle, setNewCompTitle] = useState('');
  const [newCompHours, setNewCompHours] = useState(10);
  const [showAddComp, setShowAddComp] = useState(false);

  // New milestone form state
  const [newMileTitle, setNewMileTitle] = useState('');
  const [newMileWeight, setNewMileWeight] = useState(25);
  const [showAddMile, setShowAddMile] = useState(false);

  if (!isOpen || !goal) return null;

  const metrics = calculateGoalMetrics(goal, allBlocks);
  const linkedBlocks = allBlocks.filter((b) => b && b.goalId === goal.id);

  // Add Component
  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompTitle.trim()) return;

    const newComp: GoalComponent = {
      id: `comp-${Date.now()}`,
      title: newCompTitle.trim(),
      targetHours: newCompHours,
      completedHours: 0,
      status: 'pending',
    };

    const updated: Goal = {
      ...goal,
      components: [...(goal.components || []), newComp],
    };

    onUpdateGoal(updated);
    setNewCompTitle('');
    setShowAddComp(false);
    addToast('Added sub-component to Goal plan! 🎯', 'success');
  };

  // Add Milestone
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMileTitle.trim()) return;

    const newMile: GoalMilestone = {
      id: `mile-${Date.now()}`,
      title: newMileTitle.trim(),
      targetDate: goal.targetDate || '2026-12-31',
      isUnlocked: false,
      weightPct: newMileWeight,
    };

    const updated: Goal = {
      ...goal,
      milestones: [...(goal.milestones || []), newMile],
    };

    onUpdateGoal(updated);
    setNewMileTitle('');
    setShowAddMile(false);
    addToast('Added intermediate milestone to Goal plan! 🚩', 'success');
  };

  // Toggle Milestone Unlock
  const handleToggleMilestone = (mileId: string) => {
    const updatedMilestones = (goal.milestones || []).map((m) => {
      if (m.id === mileId) {
        const next = !m.isUnlocked;
        if (next) addToast(`Unlocked Goal Milestone: "${m.title}"! 🏆`, 'success');
        return { ...m, isUnlocked: next, unlockedDate: next ? new Date().toLocaleDateString() : undefined };
      }
      return m;
    });

    onUpdateGoal({ ...goal, milestones: updatedMilestones });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950/60" style={{ borderLeft: `6px solid ${goal.color}` }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {goal.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Deadline: {goal.targetDate} ({metrics.daysRemaining} days left)
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">{goal.title}</h2>
              {goal.description && <p className="text-xs text-slate-400 mt-1">{goal.description}</p>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete goal "${goal.title}"?`)) {
                    onDeleteGoal(goal.id);
                    onClose();
                  }
                }}
                className="text-slate-500 hover:text-rose-400 p-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
                title="Delete Goal"
              >
                <Trash2 size={16} />
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
            {/* DUAL METRICS DISPLAY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Metric 1: Plan Progress */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <BarChart3 size={16} /> Overall Plan Progress
                  </span>
                  <span className="text-lg font-black text-white font-mono">{metrics.planProgressPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-purple-500"
                    style={{ width: `${metrics.planProgressPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {metrics.totalCompletedHours}h completed out of {metrics.totalRequiredHours}h required total
                </p>
              </div>

              {/* Metric 2: Commitment Adherence */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <TrendingUp size={16} /> Weekly Commitment Adherence
                  </span>
                  <span className="text-lg font-black text-white font-mono">{metrics.commitmentAdherencePct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-emerald-500"
                    style={{ width: `${metrics.commitmentAdherencePct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {metrics.weeklyCompletedHours}h done this week out of {goal.targetWeeklyHours}h target commitment
                </p>
              </div>
            </div>

            {/* PURPOSE & MOTIVATION BOX */}
            {goal.purpose && (
              <div className="bg-gradient-to-r from-purple-950/20 to-slate-950 border border-purple-500/20 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1">
                  <Flame size={12} className="text-amber-400" /> Purpose &amp; Motivation
                </span>
                <p className="text-xs text-slate-200 italic leading-relaxed">"{goal.purpose}"</p>
                {goal.derailObstacle && (
                  <p className="text-[11px] text-rose-300/80 pt-1 border-t border-purple-500/10 flex items-center gap-1">
                    <ShieldAlert size={12} className="text-rose-400 shrink-0" />
                    <span>Watch out for: {goal.derailObstacle}</span>
                  </p>
                )}
              </div>
            )}

            {/* ACTION TOOLBAR */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setIsScheduleOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
              >
                <Plus size={14} /> + Schedule Block
              </button>
              <button
                onClick={() => setIsAIScheduleOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/30 flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-indigo-400" /> ✨ AI Schedule Goal Slots
              </button>
              <button
                onClick={() => setIsBreakdownOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-purple-400" /> ✨ AI Breakdown Plan
              </button>
            </div>

            {/* SUB-COMPONENTS SECTION */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                  <Layers size={14} className="text-purple-400" /> Goal Plan Sub-Components ({(goal.components || []).length})
                </h3>
                <button
                  onClick={() => setShowAddComp(!showAddComp)}
                  className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add Component
                </button>
              </div>

              {showAddComp && (
                <form onSubmit={handleAddComponent} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Component Title (e.g. Operating Systems Revision)"
                    value={newCompTitle}
                    onChange={(e) => setNewCompTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newCompHours}
                    onChange={(e) => setNewCompHours(Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-lg">
                    Add
                  </button>
                </form>
              )}

              {goal.components && goal.components.length > 0 ? (
                <div className="space-y-2">
                  {goal.components.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{c.title}</span>
                      <span className="font-mono text-slate-400">{c.completedHours} / {c.targetHours}h</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  No sub-components defined yet. Click "✨ AI Breakdown Plan" to automatically generate a plan.
                </div>
              )}
            </div>

            {/* INTERMEDIATE MILESTONES SECTION */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                  <Flag size={14} className="text-emerald-400" /> Intermediate Milestones ({(goal.milestones || []).length})
                </h3>
                <button
                  onClick={() => setShowAddMile(!showAddMile)}
                  className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add Milestone
                </button>
              </div>

              {showAddMile && (
                <form onSubmit={handleAddMilestone} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Milestone Title (e.g. Complete Syllabus Phase 1)"
                    value={newMileTitle}
                    onChange={(e) => setNewMileTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={newMileWeight}
                    onChange={(e) => setNewMileWeight(Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg">
                    Add
                  </button>
                </form>
              )}

              {goal.milestones && goal.milestones.length > 0 ? (
                <div className="space-y-2">
                  {goal.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(m.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                        m.isUnlocked
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className={m.isUnlocked ? 'text-emerald-400' : 'text-slate-600'} />
                        <span className={`font-bold ${m.isUnlocked ? 'line-through opacity-70' : ''}`}>{m.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{m.weightPct}% weight</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  No intermediate milestones added yet. Click "+ Add Milestone" or "✨ AI Breakdown Plan".
                </div>
              )}
            </div>

            {/* LINKED TIMETABLE BLOCKS SECTION */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-400" /> Linked Timetable Blocks ({linkedBlocks.length})
              </h3>
              {linkedBlocks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {linkedBlocks.map((b) => (
                    <div key={b.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white block">{b.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{b.duration} mins</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        b.status === 'completed' || b.status === 'faster' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {b.status || 'Scheduled'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  No timetable blocks currently linked. Click "+ Schedule Block" to schedule an activity on your timetable.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <ScheduleGoalBlockModal goal={goal} isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} />

      <AIGoalBreakdownModal
        goal={goal}
        isOpen={isBreakdownOpen}
        onClose={() => setIsBreakdownOpen(false)}
        onApplyBreakdown={onUpdateGoal}
      />

      <AIGoalScheduleModal goal={goal} isOpen={isAIScheduleOpen} onClose={() => setIsAIScheduleOpen(false)} />
    </>
  );
};
