import React, { useState } from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { useTimetable } from '../../context/TimetableContext';
import { DailyExecutionScoreCard } from './DailyExecutionScoreCard';
import { MoodTracker } from './MoodTracker';
import { Check, X, ArrowRight, Star, Moon, Sparkles } from 'lucide-react';
import { DayRating, DAY_RATING_CONFIG, EnergyLevel, ENERGY_CONFIG } from '../../types/execution';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EndOfDayFlowModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { todayScore, saveDailyReflection, saveMood, performanceSummary, tomorrowSuggestions, streaks, achievements } = useExecution();
  const { currentWeekScheduledBlocks, updateBlockStatus } = useTimetable();
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Simplified reflection state for EOD flow
  const [dayRating, setDayRating] = useState<DayRating>('good');
  const [whatWentWell, setWhatWentWell] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('moderate');
  const [focusRating, setFocusRating] = useState(5);

  if (!isOpen) return null;

  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayBlocks = currentWeekScheduledBlocks
    .filter(b => b.dayOfWeek === todayIndex)
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const incompleteBlocks = todayBlocks.filter(b => !b.status || b.status === 'not_started' || b.status === 'in_progress');
  const completedBlocks = todayBlocks.filter(b => b.status === 'completed' || b.status === 'faster' || b.status === 'took_longer');

  const handleNext = () => {
    if (step === 4) {
      // Save reflection when moving past reflection step
      const today = new Date().toISOString().split('T')[0];
      saveDailyReflection({
        date: today,
        dayRating,
        whatWentWell,
        whatPreventedWork: '',
        improveTomorrow: '',
        gratitude: '',
        energyLevel,
        focusRating,
        scheduleRealistic: 'yes',
        distractions: [],
        additionalThoughts: '',
        createdAt: Date.now(),
      });
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const handleComplete = () => {
    setStep(1);
    onClose();
  };

  const stepLabels = ['Mission', 'Tasks', 'Score', 'Reflect', 'AI Summary', 'Tomorrow', 'Done'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">End of Day Review</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 px-5 py-3 bg-slate-950/30 border-b border-slate-800 overflow-x-auto">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                i + 1 < step ? 'bg-indigo-600 text-white' :
                i + 1 === step ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500' :
                'bg-slate-800 text-slate-500'
              }`}>
                {i + 1 < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${i + 1 === step ? 'text-indigo-300' : 'text-slate-500'}`}>
                {label}
              </span>
              {i < stepLabels.length - 1 && <div className={`w-4 h-px shrink-0 ${i + 1 < step ? 'bg-indigo-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Mission Status */}
          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-lg font-bold text-white">🎯 Daily Mission Status</h3>
              <p className="text-xs text-slate-400">Review today's completed activities ({completedBlocks.length}/{todayBlocks.length})</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {todayBlocks.map(block => (
                  <div key={block.id} className={`p-3 rounded-xl border flex items-center justify-between ${
                    block.status === 'completed' || block.status === 'faster' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className={`text-xs font-semibold ${block.status === 'completed' || block.status === 'faster' ? 'text-emerald-300 line-through opacity-70' : 'text-white'}`}>
                      {block.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{block.status || 'not_started'}</span>
                  </div>
                ))}
                {todayBlocks.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No activities scheduled today</p>}
              </div>
            </div>
          )}

          {/* Step 2: Mark Remaining */}
          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-lg font-bold text-white">📋 Mark Remaining Tasks</h3>
              <p className="text-xs text-slate-400">{incompleteBlocks.length} tasks still incomplete</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {incompleteBlocks.map(block => (
                  <div key={block.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{block.title}</span>
                    <button
                      onClick={() => updateBlockStatus(block.id, 'skipped')}
                      className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                ))}
                {incompleteBlocks.length === 0 && <p className="text-xs text-emerald-400 text-center py-4">All tasks handled! 🎉</p>}
              </div>
            </div>
          )}

          {/* Step 3: Execution Score */}
          {step === 3 && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-lg font-bold text-white">📊 Today's Execution Score</h3>
              <DailyExecutionScoreCard score={todayScore} />
            </div>
          )}

          {/* Step 4: Quick Reflection */}
          {step === 4 && (
            <div className="animate-fade-in space-y-5">
              <h3 className="text-lg font-bold text-white">📝 Quick Reflection</h3>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">How was your day?</label>
                <div className="flex gap-2">
                  {(Object.entries(DAY_RATING_CONFIG) as [DayRating, typeof DAY_RATING_CONFIG[DayRating]][]).map(([key, config]) => (
                    <button key={key} onClick={() => setDayRating(key)}
                      className={`flex-1 flex flex-col items-center p-2 rounded-xl border transition-all ${dayRating === key ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:bg-slate-800'}`}>
                      <span className="text-lg">{config.emoji}</span>
                      <span className="text-[9px] font-bold text-slate-400">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">What went well?</label>
                <textarea value={whatWentWell} onChange={e => setWhatWentWell(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Quick wins..." />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Focus Rating</label>
                <input type="range" min="1" max="10" value={focusRating} onChange={e => setFocusRating(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                  <span>1</span><span className="text-indigo-400 font-bold">{focusRating}/10</span><span>10</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: AI Summary */}
          {step === 5 && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> AI Performance Summary
              </h3>
              {performanceSummary.length > 0 ? (
                <ul className="space-y-3">
                  {performanceSummary.map((s, i) => (
                    <li key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5 shrink-0">▸</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">Mark activities as completed to generate insights.</p>
              )}
            </div>
          )}

          {/* Step 6: Tomorrow Suggestions */}
          {step === 6 && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-lg font-bold text-white">🌅 Tomorrow's Suggestions</h3>
              {tomorrowSuggestions.length > 0 ? (
                <ul className="space-y-3">
                  {tomorrowSuggestions.map((s, i) => (
                    <li key={i} className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5 shrink-0">💡</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">Suggestions will appear after more tracking data is collected.</p>
              )}
            </div>
          )}

          {/* Step 7: Completed */}
          {step === 7 && (
            <div className="animate-fade-in text-center py-8 space-y-6">
              <div className="text-6xl animate-bounce">🎉</div>
              <h3 className="text-2xl font-black text-white">Day Complete!</h3>
              <p className="text-sm text-slate-400">Great job reviewing your day. Consistency is key to growth.</p>
              
              {streaks.filter(s => s.isActive).length > 0 && (
                <div className="flex justify-center gap-3">
                  {streaks.filter(s => s.isActive).map(s => (
                    <div key={s.type} className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-300">
                      {s.icon} {s.label}: {s.currentCount} days 🔥
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex justify-end">
          {step < totalSteps ? (
            <button onClick={handleNext} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors">
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleComplete} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all">
              <Star size={14} /> Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
