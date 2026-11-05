import React from 'react';
import { ScheduleAdjustmentRecommendation } from '../../utils/scheduleAdjustmentEngine';
import { formatMinutesToTimeString } from '../../utils/timeUtils';
import { AlertTriangle, ArrowRight, Check, X, Clock } from 'lucide-react';

interface ScheduleAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: ScheduleAdjustmentRecommendation;
  onApply: () => void;
}

export const ScheduleAdjustmentModal: React.FC<ScheduleAdjustmentModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  onApply,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Review Schedule Adjustment</h3>
              <p className="text-xs text-slate-400">Verified overrun detected in your execution logs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Evidence Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold text-white">Overrun Activity:</span>
            <span className="text-amber-400 font-bold">{recommendation.overrunBlockTitle}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Planned Duration:</span>
            <span className="text-slate-200">{recommendation.plannedMinutes} mins</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Actual Duration:</span>
            <span className="text-amber-300 font-medium">{recommendation.actualMinutes} mins (+{recommendation.overrunMinutes}m overrun)</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
            {recommendation.explanation}
          </p>
        </div>

        {/* Proposed Shifts Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Proposed Shifts ({recommendation.affectedBlocks.length} upcoming blocks)</span>
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {recommendation.affectedBlocks.map((b) => (
              <div
                key={b.id}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-slate-200 truncate max-w-[180px]">{b.title}</span>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="line-through">{formatMinutesToTimeString(b.currentStartMinutes)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-indigo-300 font-semibold">{formatMinutesToTimeString(b.proposedStartMinutes)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Adjustment to Timetable</span>
          </button>
        </div>
      </div>
    </div>
  );
};
