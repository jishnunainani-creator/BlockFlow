import React, { useState } from 'react';
import { Goal, GoalComponent, GoalMilestone } from '../../types/timetable';
import { generateAIGoalBreakdown } from '../../utils/goalEngine';
import { useTimetable } from '../../context/TimetableContext';
import { Sparkles, Check, CheckSquare, Square, X, Layers, Flag } from 'lucide-react';

interface AIGoalBreakdownModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyBreakdown: (updatedGoal: Goal) => void;
}

export const AIGoalBreakdownModal: React.FC<AIGoalBreakdownModalProps> = ({
  goal,
  isOpen,
  onClose,
  onApplyBreakdown,
}) => {
  const { addToast } = useTimetable();

  if (!isOpen || !goal) return null;

  const proposal = generateAIGoalBreakdown(goal);
  const [selectedCompIndices, setSelectedCompIndices] = useState<Set<number>>(
    new Set(proposal.components.map((_, i) => i))
  );
  const [selectedMileIndices, setSelectedMileIndices] = useState<Set<number>>(
    new Set(proposal.milestones.map((_, i) => i))
  );

  const toggleComp = (idx: number) => {
    setSelectedCompIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleMile = (idx: number) => {
    setSelectedMileIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleConfirm = () => {
    const newComps: GoalComponent[] = proposal.components
      .filter((_, i) => selectedCompIndices.has(i))
      .map((c, i) => ({ ...c, id: `comp-${Date.now()}-${i}` }));

    const newMiles: GoalMilestone[] = proposal.milestones
      .filter((_, i) => selectedMileIndices.has(i))
      .map((m, i) => ({ ...m, id: `mile-${Date.now()}-${i}` }));

    const updatedGoal: Goal = {
      ...goal,
      components: [...(goal.components || []), ...newComps],
      milestones: [...(goal.milestones || []), ...newMiles],
    };

    onApplyBreakdown(updatedGoal);
    addToast(`Applied AI Breakdown to Goal: "${goal.title}"! ✨`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase flex items-center gap-1">
              <Sparkles size={12} /> AI Goal Breakdown Proposal
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">{goal.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {/* Components Proposal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-400" /> Proposed Sub-Components
            </h4>
            <div className="space-y-1.5">
              {proposal.components.map((c, i) => (
                <div
                  key={i}
                  onClick={() => toggleComp(i)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    selectedCompIndices.has(i)
                      ? 'bg-slate-950 border-purple-500/50 text-white'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {selectedCompIndices.has(i) ? (
                      <CheckSquare className="text-purple-400 shrink-0" size={16} />
                    ) : (
                      <Square className="text-slate-600 shrink-0" size={16} />
                    )}
                    <span className="text-xs font-bold">{c.title}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">{c.targetHours}h target</span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones Proposal */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Flag size={14} className="text-emerald-400" /> Proposed Milestones
            </h4>
            <div className="space-y-1.5">
              {proposal.milestones.map((m, i) => (
                <div
                  key={i}
                  onClick={() => toggleMile(i)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    selectedMileIndices.has(i)
                      ? 'bg-slate-950 border-emerald-500/50 text-white'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {selectedMileIndices.has(i) ? (
                      <CheckSquare className="text-emerald-400 shrink-0" size={16} />
                    ) : (
                      <Square className="text-slate-600 shrink-0" size={16} />
                    )}
                    <span className="text-xs font-bold">{m.title}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">{m.weightPct}% weight</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex gap-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="w-1/2 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> Apply Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
