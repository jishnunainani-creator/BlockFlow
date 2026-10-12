import React, { useState, useEffect } from 'react';
import {
  Target,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Compass,
  BarChart2,
  Smile,
  HelpCircle,
  CheckCircle2,
  CalendarPlus,
  BookOpen,
  Layers,
  ArrowDown,
  RefreshCw,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { setSmartOnboardingSeen } from '../../utils/storage';

interface SmartOnboardingModalProps {
  isOpen: boolean;
  initialStep?: number; // 0 = Entry Screen, 1..6 = Visual Guide Steps
  onClose: () => void;
  onStartCreateGoal: () => void;
}

interface SmartPrinciple {
  letter: 'S' | 'M' | 'A' | 'R' | 'T';
  name: string;
  tagline: string;
  color: string;
  question: string;
  explanation: string;
  pitfall: string;
  weakExample: string;
  betterExample: string;
  connectionNote: string;
  personalNote?: string;
}

const SMART_PRINCIPLES: SmartPrinciple[] = [
  {
    letter: 'S',
    name: 'Specific',
    tagline: 'Define exact outcome',
    color: '#3659C9',
    question: 'What exactly do you want to accomplish?',
    explanation: 'A clear goal defines a precise finish line instead of leaving you with an ambiguous wish.',
    pitfall: 'Without Specificity, you can never tell if a study session actually brought you closer to finishing.',
    weakExample: 'I want to study more biology.',
    betterExample: 'Complete theoretical reading and revision notes for the first six chapters of biology.',
    connectionNote: 'Specificity provides the foundation. Without it, you cannot measure progress or estimate required time.',
  },
  {
    letter: 'M',
    name: 'Measurable',
    tagline: 'Countable results',
    color: '#06B6D4',
    question: 'How will you measure your progress?',
    explanation: 'Choose a unit you can count, track, or verify so you always know your exact percentage completed.',
    pitfall: 'Without Measurement, motivation fades because you cannot see visible proof of your daily momentum.',
    weakExample: 'I want to get better at coding problems.',
    betterExample: 'Solve and understand 20 medium algorithmic practice problems.',
    connectionNote: 'Measurable targets let BlockFlow compute your progress bar and remaining hours.',
  },
  {
    letter: 'A',
    name: 'Achievable',
    tagline: 'Realistic bandwidth',
    color: '#10B981',
    question: 'Is this realistic given your available time and daily energy?',
    explanation: 'Calibrate the total required work against your real-life schedule. A great plan challenges you without assuming impossible 14-hour days.',
    pitfall: 'Without Achievability, impossible schedules lead to guilt, burnout, and early abandonment.',
    weakExample: 'Study 6 hours every day despite having full-time lectures and homework.',
    betterExample: 'Dedicate 1 focused hour on 4 available days each week.',
    connectionNote: 'Achievability ensures your timetable has breathing room for breaks and unexpected delays.',
    personalNote: 'Achievability is personal: adjust your pace based on your semester workload and energy levels.',
  },
  {
    letter: 'R',
    name: 'Relevant',
    tagline: 'Meaningful purpose',
    color: '#8B5CF6',
    question: 'Why does this goal matter to you right now?',
    explanation: 'Connect the goal to something significant: an exam, a career aspiration, or a skill you genuinely care about.',
    pitfall: 'Without Relevance, you abandon the goal as soon as other demands compete for your attention.',
    weakExample: 'Learn a random framework just because it was trending online.',
    betterExample: 'Master Python fundamentals because it is required for my end-term coursework project.',
    connectionNote: 'Relevance provides the mental conviction to show up when sessions feel challenging.',
  },
  {
    letter: 'T',
    name: 'Time-bound',
    tagline: 'Definite deadline',
    color: '#F59E0B',
    question: 'When do you want to achieve it by?',
    explanation: 'A definite deadline creates a healthy sense of direction and allows you to pace work across weeks.',
    pitfall: 'Without a Deadline, tasks expand indefinitely and get postponed to next week forever.',
    weakExample: 'I will complete this course someday.',
    betterExample: 'Complete all six chapters by 30 November (21 days from today).',
    connectionNote: 'Time boundaries enable BlockFlow to calculate how many study sessions you need per week.',
  },
];

const GUIDE_STEPS = [
  { step: 1, label: 'Overview' },
  { step: 2, label: 'The 5 Principles' },
  { step: 3, label: 'Connected Framework' },
  { step: 4, label: 'Complete Example' },
  { step: 5, label: 'Timetable Integration' },
  { step: 6, label: 'Get Started' },
];

export const SmartOnboardingModal: React.FC<SmartOnboardingModalProps> = ({
  isOpen,
  initialStep = 0,
  onClose,
  onStartCreateGoal,
}) => {
  const [step, setStep] = useState<number>(initialStep);
  const [activePrincipleIndex, setActivePrincipleIndex] = useState<number>(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep, isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' && step > 0 && step < 6) {
        setStep((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && step > 1) {
        setStep((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleSkip = () => {
    setSmartOnboardingSeen(true);
    onClose();
  };

  const handleFinishAndCreate = () => {
    setSmartOnboardingSeen(true);
    onClose();
    onStartCreateGoal();
  };

  const handleFinishAndExplore = () => {
    setSmartOnboardingSeen(true);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-guide-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col max-h-[94vh]">
        
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TOP BAR / STEPPER NAVIGATION (Hidden on Entry Screen step 0)  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {step > 0 ? (
          <div className="border-b border-slate-800 bg-slate-950/70 px-5 sm:px-8 py-3.5">
            <div className="flex items-center justify-between gap-4">
              {/* Stepper info */}
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#3659C9]/20 text-[#3659C9] border border-[#3659C9]/40 flex items-center justify-center text-xs font-bold">
                  {step}
                </span>
                <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                  Step {step} of 6: <strong className="text-white ml-1 font-bold">{GUIDE_STEPS[step - 1]?.label}</strong>
                </span>
                <span className="text-xs font-semibold text-slate-300 sm:hidden">
                  Step {step}/6
                </span>
              </div>

              {/* Desktop Stepper Dots */}
              <div className="hidden md:flex items-center gap-2">
                {GUIDE_STEPS.map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setStep(s.step)}
                    className={`h-2 rounded-full transition-all ${
                      step === s.step
                        ? 'w-8 bg-[#3659C9]'
                        : step > s.step
                        ? 'w-3.5 bg-emerald-500/80 hover:bg-emerald-500'
                        : 'w-3.5 bg-slate-800 hover:bg-slate-700'
                    }`}
                    title={s.label}
                    aria-label={`Jump to step ${s.step}: ${s.label}`}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors font-medium"
                >
                  Skip guide
                </button>
                <button
                  onClick={handleSkip}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close guide"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Top bar for Entry Screen */
          <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800/60">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              BlockFlow · Learning Guide
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors font-medium"
            >
              Skip
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MODAL MAIN CONTENT BODY (Spacious, Scannable & Guided)        */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-8 flex-1 text-slate-200 scrollbar-thin">
          
          {/* ────────────────────────────────────────────────────────── */}
          {/* STEP 0 — ENTRY SCREEN (First-time welcome)                  */}
          {/* ────────────────────────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-8 text-center max-w-2xl mx-auto py-4 sm:py-6 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-[#3659C9]/15 border border-[#3659C9]/30 text-[#3659C9] flex items-center justify-center mx-auto shadow-md">
                <Target size={32} />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3659C9] bg-[#3659C9]/10 px-3.5 py-1.5 rounded-full border border-[#3659C9]/20 inline-block">
                  SMART Time Management Framework
                </span>
                <h2 id="smart-guide-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Turn your goals into a plan.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
                  SMART helps you turn a vague intention into a clear goal, break it into manageable steps, and make time for it in your daily schedule.
                </p>
              </div>

              {/* Visual 3-Stage Progression Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left pt-2">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3659C9]">
                      Stage 01
                    </span>
                    <h3 className="text-sm font-bold text-white">Specific Target</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Define a concrete finish line instead of a vague desire.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      "Complete 6 chapters"
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Stage 02
                    </span>
                    <h3 className="text-sm font-bold text-white">Realistic Effort</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Match total study hours with your available weekly bandwidth.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      "1 hour · 4 days/week"
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      Stage 03
                    </span>
                    <h3 className="text-sm font-bold text-white">Timetable Slots</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Reserve collision-free focus blocks on your timetable.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      "Mon & Wed @ 9:00 AM"
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <BookOpen size={16} />
                  <span>Learn how SMART works</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={handleSkip}
                  className="w-full sm:w-auto px-6 py-3.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
                >
                  Skip guide
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* STEP 1 — INTRODUCE SMART (The 5-Node Flow Path)             */}
          {/* ────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-7 animate-fade-in">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3659C9]">
                  Step 1 · The Foundation
                </span>
                <h2 id="smart-guide-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  A goal is more useful when you know exactly what you're working toward.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  SMART is a method for transforming ambiguous desires into concrete, calendar-protected execution. Trace how a goal moves from an idea to momentum:
                </p>
              </div>

              {/* Visual Connected Sequence */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  The Path from Intention to Execution:
                </div>

                <div className="space-y-3">
                  {/* Node 1 */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-200">Vague Intention</span>
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          Ambiguous
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 italic font-serif">
                        "I want to get better at coding."
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Unclear scope. Because there is no defined finish line, it is easy to put off until tomorrow.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center text-slate-600">
                    <ArrowDown size={18} />
                  </div>

                  {/* Node 2 */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-[#3659C9]/50 flex items-start gap-4 ring-1 ring-[#3659C9]/20">
                    <div className="w-8 h-8 rounded-lg bg-[#3659C9]/20 text-[#3659C9] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-[#3659C9]/40">
                      2
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">SMART Goal</span>
                        <span className="text-[10px] font-bold text-[#3659C9] bg-[#3659C9]/10 px-2.5 py-0.5 rounded-full border border-[#3659C9]/20">
                          Clear Finish Line
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium">
                        "Solve 20 beginner coding problems by the end of this month."
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Clear target (20 problems), definite boundary (this month). You know what "done" looks like.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center text-slate-600">
                    <ArrowDown size={18} />
                  </div>

                  {/* Node 3 */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-200">Actionable Steps</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                          Digestible
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        "Solve one problem at a time and review mistakes."
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Breaks down an intimidating 20-problem total into daily, bite-sized tasks.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center text-slate-600">
                    <ArrowDown size={18} />
                  </div>

                  {/* Node 4 */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-emerald-500/40">
                      4
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-emerald-300">Scheduled Time Blocks</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          Protected Time
                        </span>
                      </div>
                      <p className="text-sm text-emerald-200 font-medium">
                        "Reserve 30-minute blocks on Mon, Wed & Fri in your timetable."
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Prevents everyday distractions and reactive tasks from crowding out your goal.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center text-slate-600">
                    <ArrowDown size={18} />
                  </div>

                  {/* Node 5 */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/40 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-purple-500/40">
                      5
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-purple-300">Measurable Progress</span>
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                          Visual Feedback
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 font-mono font-bold">
                        14 / 20 problems completed (70%)
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Instant clarity on where you stand, reinforcing confidence and consistency.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Insight Callout */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3.5">
                <Sparkles size={20} className="text-[#3659C9] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-sm font-bold text-white block">Key Takeaway</strong>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    SMART provides clear direction. Scheduling turns that direction into protected daily reality. Whether for exams, fitness, or career projects, the framework remains the same.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* STEP 2 — THE FIVE PRINCIPLES (Clear Tabbed Deep-Dive)        */}
          {/* ────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-7 animate-fade-in">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3659C9]">
                  Step 2 · The 5 Principles
                </span>
                <h2 id="smart-guide-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  What each letter stands for.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  SMART is an acronym for five simple questions you answer when planning any project:
                </p>
              </div>

              {/* Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {SMART_PRINCIPLES.map((p, idx) => (
                  <button
                    key={p.letter}
                    onClick={() => setActivePrincipleIndex(idx)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                      activePrincipleIndex === idx
                        ? 'bg-slate-800 text-white border-slate-700 shadow-sm ring-1 ring-slate-600'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.letter}
                    </span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Principle Detailed Card */}
              {(() => {
                const current = SMART_PRINCIPLES[activePrincipleIndex];
                return (
                  <div className="p-6 sm:p-7 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-3.5">
                        <span
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-md"
                          style={{ backgroundColor: current.color }}
                        >
                          {current.letter}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">
                            {current.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">{current.tagline}</p>
                        </div>
                      </div>

                      <span className="text-xs text-slate-400 font-mono font-medium">
                        Principle {activePrincipleIndex + 1} of 5
                      </span>
                    </div>

                    {/* Guiding Question Section */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        The Core Question to Ask Yourself
                      </span>
                      <p className="text-base font-semibold text-white">
                        "{current.question}"
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {current.explanation}
                      </p>
                    </div>

                    {/* Real-World Contrast: Before & After */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                          ✗ Vague (Easy to procrastinate)
                        </span>
                        <p className="text-xs text-slate-300 italic font-serif">
                          "{current.weakExample}"
                        </p>
                        <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                          {current.pitfall}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          ✓ SMART (Easy to schedule)
                        </span>
                        <p className="text-xs text-white font-medium">
                          "{current.betterExample}"
                        </p>
                        <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">
                          {current.connectionNote}
                        </p>
                      </div>
                    </div>

                    {/* Note if available */}
                    {current.personalNote && (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                        <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>{current.personalNote}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* STEP 3 — CONNECTED SMART DIAGRAM                           */}
          {/* ────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-7 animate-fade-in">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3659C9]">
                  Step 3 · Unified System
                </span>
                <h2 id="smart-guide-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  How the five principles work together.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  A goal is not merely one isolated rule. It is a complete system where each letter supports the next:
                </p>
              </div>

              {/* Connecting Chain */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {SMART_PRINCIPLES.map((p, idx) => {
                    const isSelected = activePrincipleIndex === idx;
                    return (
                      <div key={p.letter} className="relative flex flex-col items-center">
                        <button
                          onClick={() => setActivePrincipleIndex(idx)}
                          className={`w-full p-4 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-slate-800 border-white/60 shadow-lg ring-2 ring-white/20'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                          aria-label={`Select principle ${p.name}`}
                        >
                          <div
                            className="w-9 h-9 rounded-lg mx-auto flex items-center justify-center text-sm font-black text-white shadow-sm mb-2"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.letter}
                          </div>
                          <span className="block text-xs font-bold text-white">
                            {p.name}
                          </span>
                          <span className="block text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {p.tagline}
                          </span>
                        </button>

                        {/* Connector arrow between nodes */}
                        {idx < SMART_PRINCIPLES.length - 1 && (
                          <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-600 font-bold">
                            →
                          </div>
                        )}
                        {idx < SMART_PRINCIPLES.length - 1 && (
                          <div className="md:hidden py-1 text-slate-600">
                            ↓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Node Deep-Dive */}
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: SMART_PRINCIPLES[activePrincipleIndex].color }}
                    />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                      The Role of {SMART_PRINCIPLES[activePrincipleIndex].letter} ({SMART_PRINCIPLES[activePrincipleIndex].name})
                    </h4>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    "{SMART_PRINCIPLES[activePrincipleIndex].question}"
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {SMART_PRINCIPLES[activePrincipleIndex].connectionNote}
                  </p>
                  <p className="text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 leading-relaxed">
                    ⚠️ <strong>Warning:</strong> {SMART_PRINCIPLES[activePrincipleIndex].pitfall}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* STEP 4 — DEMONSTRATE ONE COMPLETE GOAL                     */}
          {/* ────────────────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-7 animate-fade-in">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3659C9]">
                  Step 4 · Complete Example
                </span>
                <h2 id="smart-guide-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  See it in action: A realistic student goal.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Notice how an everyday study commitment is broken down into structured timetable focus sessions:
                </p>
              </div>

              {/* Goal Card Banner */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#3659C9]/20 text-[#3659C9] border border-[#3659C9]/30 uppercase">
                    Student Example · Biology
                  </span>
                  <span className="text-xs text-slate-400 font-medium">3-Week Study Target</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  "Complete six chapters of biology in three weeks."
                </h3>

                {/* 5 SMART Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[#3659C9] font-bold text-[11px] uppercase block">S — Specific</span>
                    <p className="text-slate-300">Read and complete revision notes for Chapters 1 through 6.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-bold text-[11px] uppercase block">M — Measurable</span>
                    <p className="text-slate-300">Target of 6 chapters, checked off one chapter at a time.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-emerald-400 font-bold text-[11px] uppercase block">A — Achievable</span>
                    <p className="text-slate-300">12 total hours (2h/chapter) scheduled across 3 weeks (4h/week).</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-purple-400 font-bold text-[11px] uppercase block">R — Relevant</span>
                    <p className="text-slate-300">Mandatory curriculum requirement for upcoming end-term exams.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-amber-400 font-bold text-[11px] uppercase block mb-1">T — Time-Bound</span>
                  <p className="text-slate-300">Deadline set to exactly 21 days from today.</p>
                </div>
              </div>

              {/* How it breaks down into schedule */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Interactive Chapter Explorer
                  </h4>
                  <p className="text-xs text-slate-300">
                    Click any chapter to see how BlockFlow allocates focus blocks in your timetable:
                  </p>
                </div>

                {/* 6 chapter pills */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {[1, 2, 3, 4, 5, 6].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setActiveChapterIndex(ch - 1)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        activeChapterIndex === ch - 1
                          ? 'bg-[#3659C9] border-[#3659C9] text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">Ch. {ch}</span>
                      <span className="text-[10px] opacity-80 block">2 hours</span>
                    </button>
                  ))}
                </div>

                {/* Chapter schedule detail */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
                  <div className="space-y-1">
                    <span className="font-bold text-white block text-sm">
                      Chapter {activeChapterIndex + 1}: Core Theoretical Concepts
                    </span>
                    <span className="text-slate-400 text-xs">
                      Reserved as two 60-minute focus blocks on Mon &amp; Wed at 09:00 AM.
                    </span>
                  </div>
                  <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shrink-0 self-start sm:self-auto">
                    ✓ 2 Timetable Blocks Reserved
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* STEP 5 — CONNECT SMART TO BLOCKFLOW                        */}
          {/* ────────────────────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-7 animate-fade-in">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3659C9]">
                  Step 5 · BlockFlow Integration
                </span>
                <h2 id="smart-guide-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  From goal definition to timetable reality.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Here is the 5-step workflow you will follow inside BlockFlow:
                </p>
              </div>

              {/* 5-step lifecycle cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3.5 hover:border-slate-700 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#3659C9]/20 text-[#3659C9] flex items-center justify-center font-bold text-xs shrink-0 border border-[#3659C9]/30">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white">Define</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Write a clear outcome title, optional scope notes, and your countable target.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3.5 hover:border-slate-700 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 border border-cyan-500/30">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white">Estimate</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Determine total required effort and see how many study days you realistically need.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3.5 hover:border-slate-700 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white">Schedule</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Review collision-free open slots and add focus blocks straight into your timetable.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3.5 hover:border-slate-700 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-500/30">
                    4
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white">Track</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Log progress with quick +1 buttons as you finish chapters or practice tasks.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3.5 hover:border-slate-700 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/30">
                    5
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white">Adjust</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      If unexpected events happen or assignments shift, revise dates without guilt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Crucial Productivity Realism Warning */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle size={16} />
                  <span>Productivity Truth: Intention vs Execution</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Creating a goal does not automatically mean the work is done. A scheduled session is planned intention, not proof of completion. BlockFlow helps protect your time; the learning and focus comes from you.
                </p>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* STEP 6 — TAKE ACTION (Final completion screen)             */}
          {/* ────────────────────────────────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-8 text-center max-w-xl mx-auto py-6 sm:py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 inline-block">
                  Onboarding Complete
                </span>
                <h2 id="smart-guide-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Ready to make your goal happen?
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md mx-auto">
                  You now know how to turn an intention into a clear plan and protect time for it in your daily timetable.
                </p>
              </div>

              {/* Summary pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs max-w-md mx-auto py-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[#3659C9] font-bold block text-xs">S</span>
                  <span className="text-slate-300 text-xs">Specific</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-cyan-400 font-bold block text-xs">M</span>
                  <span className="text-slate-300 text-xs">Measurable</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-emerald-400 font-bold block text-xs">A</span>
                  <span className="text-slate-300 text-xs">Achievable</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-purple-400 font-bold block text-xs">R</span>
                  <span className="text-slate-300 text-xs">Relevant</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-amber-400 font-bold block text-xs">T</span>
                  <span className="text-slate-300 text-xs">Time-bound</span>
                </div>
              </div>

              {/* Primary & Secondary Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleFinishAndCreate}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Target size={16} />
                  <span>Create my first SMART goal</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={handleFinishAndExplore}
                  className="w-full sm:w-auto px-6 py-3.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700"
                >
                  Explore SMART Goals
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* FOOTER CONTROLS (Steps 1 to 5)                                */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {step > 0 && step < 6 && (
          <div className="px-6 py-4 sm:px-8 sm:py-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/70">
            {step > 1 ? (
              <button
                onClick={() => setStep((prev) => prev - 1)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors border border-slate-700"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={() => setStep(0)}
                className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Intro
              </button>
            )}

            <button
              onClick={() => setStep((prev) => prev + 1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              <span>{step === 5 ? 'Review Summary' : 'Next Step'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
