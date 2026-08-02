import React from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { useTimetable } from '../../context/TimetableContext';
import { Sparkles, TrendingUp, Target, Award, ArrowRight, X, AlertCircle } from 'lucide-react';

interface WeeklyAIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeeklyAIReviewModal({ isOpen, onClose }: WeeklyAIReviewModalProps) {
  const { dailyScores, performanceSummary, reflectionInsights } = useExecution();
  const { currentWeekId, currentWeekScheduledBlocks } = useTimetable();

  if (!isOpen) return null;

  const scoreList = Object.values(dailyScores || {});
  const hasData = scoreList.length > 0;

  const totalScore = scoreList.reduce((sum, s) => sum + (s.overallScore || 0), 0);
  const avgScore = hasData ? Math.round(totalScore / scoreList.length) : 0;

  const totalPlannedMins = scoreList.reduce((sum, s) => sum + (s.totalPlannedMinutes || 0), 0);
  const totalDoneMins = scoreList.reduce((sum, s) => sum + (s.totalCompletedMinutes || 0), 0);
  const totalCompletedHours = Math.round((totalDoneMins / 60) * 10) / 10;
  const completionPct = totalPlannedMins > 0 ? Math.round((totalDoneMins / totalPlannedMins) * 100) : avgScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div className="p-8 relative space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Sparkles size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Sunday Synthesis</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Your Weekly Mentor Report</h2>
              <span className="text-xs text-slate-400 font-mono">Week ID: {currentWeekId}</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-2 rounded-full">
              <X size={18} />
            </button>
          </div>

          {hasData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase">
                    <TrendingUp size={16} /> Avg Execution Score
                  </div>
                  <div className="text-3xl font-black text-white">{avgScore}%</div>
                  <div className="text-[10px] text-slate-500">Derived from daily scores</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase">
                    <Target size={16} /> Deep Work Completed
                  </div>
                  <div className="text-3xl font-black text-white">{totalCompletedHours}h</div>
                  <div className="text-[10px] text-slate-500">Total focus duration</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold uppercase">
                    <Award size={16} /> Completion Rate
                  </div>
                  <div className="text-3xl font-black text-white">{completionPct}%</div>
                  <div className="text-[10px] text-slate-500">Tasks finished</div>
                </div>
              </div>

              {/* AI Performance Recommendations */}
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-indigo-400" size={18} /> AI Recommendations for Next Week
                </h3>
                {performanceSummary.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-300">
                    {performanceSummary.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">▸</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Complete your daily timetable blocks and reflections to build customized mentor recommendations.
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all text-xs shadow-md"
              >
                Close Report <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">Insufficient Historical Data</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Complete your daily timetable blocks for at least 2 days this week to generate your authentic Weekly Mentor Report.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
