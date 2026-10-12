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

interface InnerProps {
  goal: Goal;
  onClose: () => void;
  onApplyBreakdown: (updatedGoal: Goal) => void;
}

const AIGoalBreakdownModalContent: React.FC<InnerProps> = ({ goal, onClose, onApplyBreakdown }) => {
  const { addToast } = useTimetable();
  const proposal = generateAIGoalBreakdown(goal);

  const [selectedCompIndices, setSelectedCompIndices] = useState<Set<number>>(
    () => new Set(proposal.components.map((_, i) => i))
  );
  const [selectedMileIndices, setSelectedMileIndices] = useState<Set<number>>(
    () => new Set(proposal.milestones.map((_, i) => i))
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
    addToast(`Applied breakdown to "${goal.title}"`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-medium text-[#3659C9] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} /> AI Breakdown
            </span>
            <h3 className="text-base font-bold text-white mt-1">{goal.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {/* Components Proposal */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers size={14} className="text-slate-400" /> Proposed Sub-Components
            </h4>
            <div className="space-y-1.5">
              {proposal.components.map((c, i) => (
                <div
                  key={i}
                  onClick={() => toggleComp(i)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                    selectedCompIndices.has(i)
                      ? 'bg-slate-800/80 border-[#3659C9] text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {selectedCompIndices.has(i) ? (
                      <CheckSquare className="text-[#3659C9] shrink-0" size={16} />
                    ) : (
                      <Square className="text-slate-500 shrink-0" size={16} />
                    )}
                    <span className="text-xs font-medium">{c.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{c.targetHours}h target</span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones Proposal */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Flag size={14} className="text-slate-400" /> Proposed Milestones
            </h4>
            <div className="space-y-1.5">
              {proposal.milestones.map((m, i) => (
                <div
                  key={i}
                  onClick={() => toggleMile(i)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                    selectedMileIndices.has(i)
                      ? 'bg-slate-800/80 border-[#3659C9] text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {selectedMileIndices.has(i) ? (
                      <CheckSquare className="text-[#3659C9] shrink-0" size={16} />
                    ) : (
                      <Square className="text-slate-500 shrink-0" size={16} />
                    )}
                    <span className="text-xs font-medium">{m.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{m.weightPct}% weight</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 flex gap-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-1/2 py-2 rounded-lg font-medium text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="w-1/2 py-2 rounded-lg font-semibold text-xs bg-[#3659C9] hover:bg-[#2F4EB8] text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> Apply Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};

export const AIGoalBreakdownModal: React.FC<AIGoalBreakdownModalProps> = ({
  goal,
  isOpen,
  onClose,
  onApplyBreakdown,
}) => {
  if (!isOpen || !goal) return null;

  return (
    <AIGoalBreakdownModalContent
      goal={goal}
      onClose={onClose}
      onApplyBreakdown={onApplyBreakdown}
    />
  );
};
