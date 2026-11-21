import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Moon,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
  Sliders,
  CheckCircle2,
  SkipForward,
} from 'lucide-react';
import {
  DailyGoal,
  DayReflection,
  MissReasonTag,
  MISS_REASON_OPTIONS,
} from '../../types/dailyGoals';
import {
  loadDailyGoals,
  saveDailyGoals,
  loadDayReflection,
  saveDayReflection,
  incrementSmartGoalProgress,
} from '../../utils/dailyGoalsStorage';
import { computeDayScore, createCarriedGoal } from '../../utils/dailyGoalsEngine';
import { useExecution } from '../../context/ExecutionContext';

interface EndOfDayFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr?: string; // Optional custom date (defaults to today)
}

export const EndOfDayFlowModal: React.FC<EndOfDayFlowModalProps> = ({
  isOpen,
  onClose,
  dateStr: propDateStr,
}) => {
  const { saveDailyReflection: saveOldDailyReflection } = useExecution();

  const targetDateStr = useMemo(() => {
    return propDateStr || new Date().toISOString().split('T')[0];
  }, [propDateStr]);

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Goals for this date
  const [goals, setGoals] = useState<DailyGoal[]>([]);

  // Reflection form state
  const [energy, setEnergy] = useState<number>(3); // 1-5
  const [reasonTags, setReasonTags] = useState<Record<string, MissReasonTag[]>>({});
  const [win, setWin] = useState('');
  const [tomorrowFirstStep, setTomorrowFirstStep] = useState('');
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  // Load goals and any existing reflection for this date on mount/open
  useEffect(() => {
    if (!isOpen) return;

    const allGoals = loadDailyGoals();
    const dayGoals = allGoals.filter((g) => g.date === targetDateStr);
    setGoals(dayGoals);

    const existingReflection = loadDayReflection(targetDateStr);
    if (existingReflection) {
      setEnergy(existingReflection.energy || 3);
      setReasonTags(existingReflection.reasonTags || {});
      setWin(existingReflection.win || '');
      setTomorrowFirstStep(existingReflection.tomorrowFirstStep || '');
    } else {
      setEnergy(3);
      setReasonTags({});
      setWin('');
      setTomorrowFirstStep('');
    }
    setStep(1);
  }, [isOpen, targetDateStr]);

  if (!isOpen) return null;

  // Incomplete / missed goals that need reason tags
  const missedGoals = goals.filter(
    (g) => g.status === 'planned' || g.status === 'in_progress' || g.status === 'skipped' || g.status === 'partial'
  );

  // Compute weighted score breakdown
  const scoreResult = computeDayScore(goals);

  // Step 1: Update goal status
  const handleUpdateGoalOutcome = (
    goalId: string,
    outcome: 'done' | 'partial' | 'skipped' | 'carry',
    measureCurrent?: number
  ) => {
    if (outcome === 'carry') {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const [y, m, d] = targetDateStr.split('-').map(Number);
      const tomorrow = new Date(y, m - 1, d + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const { updatedSource, carriedGoal } = createCarriedGoal(goal, tomorrowStr);

      const allGoals = loadDailyGoals();
      const updatedAll = allGoals
        .map((g) => (g.id === goal.id ? updatedSource : g))
        .concat(carriedGoal);
      saveDailyGoals(updatedAll);

      setGoals((prev) => prev.map((g) => (g.id === goal.id ? updatedSource : g)));
      return;
    }

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const status = outcome === 'done' ? 'done' : outcome === 'partial' ? 'partial' : 'skipped';
        const current =
          measureCurrent !== undefined
            ? measureCurrent
            : outcome === 'done'
            ? g.measure.target || (g.measure.type === 'percent' ? 100 : 1)
            : g.measure.current;

        return {
          ...g,
          status,
          measure: { ...g.measure, current },
          completedAt: outcome === 'done' ? Date.now() : undefined,
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Toggle reason tag for a missed goal
  const handleToggleReasonTag = (goalId: string, tag: MissReasonTag) => {
    setReasonTags((prev) => {
      const existing = prev[goalId] || [];
      const updated = existing.includes(tag) ? existing.filter((t) => t !== tag) : [...existing, tag];
      return { ...prev, [goalId]: updated };
    });
  };

  // Final submit
  const handleFinalSave = () => {
    // 1. Save updated goals to storage
    const allGoals = loadDailyGoals();
    const otherGoals = allGoals.filter((g) => g.date !== targetDateStr);
    saveDailyGoals([...otherGoals, ...goals]);

    // Update progress on any linked SMART goals completed during reflection
    goals.forEach((g) => {
      if (g.status === 'done' && g.linkedSmartGoalId) {
        const incrementVal = g.measure.type === 'count' && g.measure.target ? g.measure.target : 1;
        incrementSmartGoalProgress(g.linkedSmartGoalId, incrementVal);
      }
    });

    // 2. Save DayReflection
    const reflectionRecord: DayReflection = {
      date: targetDateStr,
      energy,
      reasonTags,
      win: win.trim(),
      tomorrowFirstStep: tomorrowFirstStep.trim(),
      completedAt: Date.now(),
    };
    saveDayReflection(reflectionRecord);

    // 3. Save to execution context if available for compatibility
    if (saveOldDailyReflection) {
      saveOldDailyReflection({
        date: targetDateStr,
        dayRating: energy >= 4 ? 'excellent' : energy === 3 ? 'good' : 'average',
        whatWentWell: win.trim(),
        whatPreventedWork: Object.values(reasonTags).flat().join(', '),
        improveTomorrow: tomorrowFirstStep.trim(),
        gratitude: '',
        energyLevel: energy >= 4 ? 'high' : energy === 3 ? 'moderate' : 'low',
        focusRating: Math.round(energy * 2),
        scheduleRealistic: 'yes',
        distractions: [],
        additionalThoughts: '',
        createdAt: Date.now(),
      });
    }

    onClose();
  };

  const stepLabels = ['Goal Outcomes', 'Energy & Reasons', 'Wins & Next Steps', 'Day Summary'];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                End My Day Reflection
              </h2>
              <span className="text-xs text-slate-500 font-mono">Date: {targetDateStr}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center gap-1.5 px-6 py-3 bg-slate-50 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                  i + 1 < step
                    ? 'bg-emerald-600 text-white'
                    : i + 1 === step
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {i + 1 < step ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                  i + 1 === step
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {label}
              </span>
              {i < stepLabels.length - 1 && (
                <div
                  className={`w-4 h-px shrink-0 ${
                    i + 1 < step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* ── STEP 1: GOAL OUTCOMES ── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Step 1: Review Goal Outcomes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Confirm what got finished, adjust partial progress, or carry unfinished goals forward.
                </p>
              </div>

              {goals.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No daily goals were recorded for {targetDateStr}.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {goals.map((g) => {
                    const isDone = g.status === 'done';
                    const isPartial = g.status === 'partial';
                    const isSkipped = g.status === 'skipped';
                    const isCarried = g.status === 'carried';

                    return (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                              {g.title}
                            </span>
                            <span className="text-[10px] text-slate-500 capitalize">
                              Priority: {g.priority} • Type: {g.measure.type}
                            </span>
                          </div>

                          {/* Outcome Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateGoalOutcome(g.id, 'done')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                                isDone
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <CheckCircle2 size={12} />
                              <span>Done</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateGoalOutcome(g.id, 'partial')}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                isPartial
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              Partial
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateGoalOutcome(g.id, 'skipped')}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                isSkipped
                                  ? 'bg-slate-600 text-white border-slate-600'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              Skip
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateGoalOutcome(g.id, 'carry')}
                              disabled={isCarried}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                isCarried
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                              }`}
                            >
                              {isCarried ? 'Carried' : 'Carry ➡️'}
                            </button>
                          </div>
                        </div>

                        {/* Partial Progress Slider / Stepper if partial */}
                        {isPartial && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <span className="text-[11px] text-slate-500 shrink-0">Progress:</span>
                            <input
                              type="range"
                              min="0"
                              max={g.measure.target || (g.measure.type === 'percent' ? 100 : 10)}
                              value={g.measure.current || 0}
                              onChange={(e) =>
                                handleUpdateGoalOutcome(g.id, 'partial', parseInt(e.target.value) || 0)
                              }
                              className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                              {g.measure.current || 0} / {g.measure.target || (g.measure.type === 'percent' ? 100 : 10)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: ENERGY & REASONS ── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Step 2: Energy &amp; Miss Reasons
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  How was your mental and physical energy today? Tag what caused delays on incomplete items.
                </p>
              </div>

              {/* Energy Level 1 to 5 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Energy Level ({energy}/5)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { val: 1, label: 'Drained', emoji: '😴' },
                    { val: 2, label: 'Low', emoji: '🥱' },
                    { val: 3, label: 'Moderate', emoji: '⚡' },
                    { val: 4, label: 'High', emoji: '🔥' },
                    { val: 5, label: 'Peak', emoji: '🚀' },
                  ].map((e) => (
                    <button
                      key={e.val}
                      type="button"
                      onClick={() => setEnergy(e.val)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        energy === e.val
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-xs scale-102'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-xl">{e.emoji}</span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {e.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Miss Reason Chips per Incomplete Goal */}
              {missedGoals.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                    What got in the way for these goals?
                  </label>

                  <div className="space-y-3">
                    {missedGoals.map((mg) => {
                      const selectedTags = reasonTags[mg.id] || [];
                      return (
                        <div
                          key={mg.id}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
                        >
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {mg.title}
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {MISS_REASON_OPTIONS.map((opt) => {
                              const isSelected = selectedTags.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleToggleReasonTag(mg.id, opt.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: WINS & NEXT STEPS ── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Step 3: Celebrate a Win &amp; Plan Tomorrow's First Step
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Small daily wins compound over semesters. End on an empowering note.
                </p>
              </div>

              {/* One Win */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  What went well today? (One key win)
                </label>
                <textarea
                  rows={3}
                  value={win}
                  onChange={(e) => setWin(e.target.value)}
                  placeholder="e.g. Mastered organic chemistry reaction mechanisms and stayed focused for 90 minutes straight..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Tomorrow's First Step */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                  What is the very first step you will take tomorrow?
                </label>
                <input
                  type="text"
                  value={tomorrowFirstStep}
                  onChange={(e) => setTomorrowFirstStep(e.target.value)}
                  placeholder="e.g. Open chapter 5 at 9:00 AM before checking messages..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* ── STEP 4: DAY SUMMARY WITH COMPUTED WEIGHTED SCORE ── */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in text-center sm:text-left">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Step 4: Your Day Score Summary
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Computed purely from your verified achievements today.
                </p>
              </div>

              {/* Score Display Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                    Weighted Day Score
                  </span>
                  <div className="text-4xl font-black font-mono text-slate-900 dark:text-white">
                    {scoreResult.formattedScore}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {scoreResult.earnedPoints} earned points out of {scoreResult.maxPoints} maximum possible
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700/60"
                >
                  <Sliders size={13} />
                  <span>{showScoreBreakdown ? 'Hide Breakdown' : 'Tap for Breakdown'}</span>
                  {showScoreBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Expandable Score Breakdown */}
              {showScoreBreakdown && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-2 animate-fade-in">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Mathematical Weighting Scheme:
                  </span>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4 text-[11px]">
                    <li>High priority goals = 3 points</li>
                    <li>Medium priority goals = 2 points</li>
                    <li>Low priority goals = 1 point</li>
                    <li>Partial completion receives fractional credit proportional to progress</li>
                  </ul>

                  {goals.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                      {goals.map((g) => (
                        <div key={g.id} className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">
                            {g.title} ({g.priority})
                          </span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            Status: {g.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Win Recap */}
              {win && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold flex items-center gap-1.5 mb-1">
                    <Trophy size={13} className="text-amber-500" />
                    Today's Win:
                  </span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 italic">"{win}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-xs"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSave}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md"
            >
              <Check size={14} />
              <span>Save Reflection &amp; Finish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
