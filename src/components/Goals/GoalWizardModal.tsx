import React, { useState, useId } from 'react';
import { Goal, SmartCriteria } from '../../types/timetable';
import {
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Clock,
  Sparkles,
  X,
  Compass,
  BarChart2,
  Smile,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  CalendarPlus,
  BookOpen,
} from 'lucide-react';
import { DAYS_OF_WEEK } from '../../utils/timeUtils';

interface GoalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Goal, planImmediately?: boolean) => void;
}

const CATEGORIES = [
  'Academics',
  'Career & Work',
  'Skill Development',
  'Fitness & Health',
  'Personal Growth',
  'Creative Project',
];

const PRESET_COLORS = [
  '#3659C9', // BlockFlow Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#EF4444', // Red
];

const POPULAR_UNITS = ['chapters', 'problems', 'hours', 'assignments', 'modules', 'projects'];

const STEP_LABELS = [
  { step: 1, letter: 'S', title: 'Specific' },
  { step: 2, letter: 'M', title: 'Measurable' },
  { step: 3, letter: 'A', title: 'Achievable' },
  { step: 4, letter: 'R', title: 'Relevant' },
  { step: 5, letter: 'T', title: 'Time-bound' },
  { step: 6, letter: '✓', title: 'Review' },
];

export const GoalWizardModal: React.FC<GoalWizardModalProps> = ({ isOpen, onClose, onSaveGoal }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // S - Specific
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academics');
  const [specificDetails, setSpecificDetails] = useState('');
  const [color, setColor] = useState('#3659C9');

  // M - Measurable
  const [measurableType, setMeasurableType] = useState<'quantity' | 'effort'>('quantity');
  const [targetValue, setTargetValue] = useState<number>(6);
  const [unit, setUnit] = useState<string>('chapters');
  const [currentValue, setCurrentValue] = useState<number>(0);

  // A - Achievable
  const [estimatedTotalHours, setEstimatedTotalHours] = useState<number>(12);
  const [dailyAvailableHours, setDailyAvailableHours] = useState<number>(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]); // Mon, Wed, Fri
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState<number>(60);
  const [preferredEnergyWindow, setPreferredEnergyWindow] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  // R - Relevant
  const [motivation, setMotivation] = useState('');

  // T - Time-bound
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21); // Default ~3 weeks
    return d.toISOString().split('T')[0];
  });

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Accessible IDs for form controls
  const titleInputId = useId();
  const categorySelectId = useId();
  const specificDetailsInputId = useId();
  const targetValueInputId = useId();
  const currentProgressInputId = useId();
  const unitInputId = useId();
  const totalEffortInputId = useId();
  const dailyTimeInputId = useId();
  const motivationInputId = useId();
  const startDateInputId = useId();
  const deadlineInputId = useId();

  if (!isOpen) return null;

  // Feasibility calculation
  const studyDaysNeeded = dailyAvailableHours > 0 ? Math.ceil(estimatedTotalHours / dailyAvailableHours) : estimatedTotalHours;

  const startMs = new Date(startDate).getTime();
  const deadlineMs = new Date(deadline).getTime();
  const daysAvailable = Math.max(0, Math.ceil((deadlineMs - startMs) / (1000 * 60 * 60 * 24)));
  const isTimelineFeasible = daysAvailable >= studyDaysNeeded;

  const handleNext = () => {
    setValidationError(null);

    if (step === 1) {
      if (!title.trim()) {
        setValidationError('Please enter what you want to achieve.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (targetValue <= 0) {
        setValidationError('Please enter a target value greater than 0.');
        return;
      }
      if (!unit.trim()) {
        setValidationError('Please specify a unit of measurement.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (estimatedTotalHours <= 0) {
        setValidationError('Please estimate the total hours required.');
        return;
      }
      if (dailyAvailableHours <= 0) {
        setValidationError('Please enter realistic available hours per day.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      if (!deadline) {
        setValidationError('Please choose a completion deadline.');
        return;
      }
      if (new Date(deadline) < new Date(startDate)) {
        setValidationError('Deadline cannot be earlier than your start date.');
        return;
      }
      setStep(6);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (step > 1) {
      setStep((step - 1) as any);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort()
    );
  };

  const handleSave = (planImmediately: boolean) => {
    const smartData: SmartCriteria = {
      specificDetails: specificDetails.trim() || undefined,
      measurableType,
      targetValue: Number(targetValue),
      currentValue: Number(currentValue),
      unit: unit.trim(),
      estimatedTotalHours: Number(estimatedTotalHours),
      dailyAvailableHours: Number(dailyAvailableHours),
      preferredDays: selectedDays,
      preferredSessionMinutes,
      preferredEnergyWindow,
      motivation: motivation.trim() || undefined,
      startDate,
      deadline,
    };

    const newGoal: Goal = {
      id: `smart-goal-${Date.now()}`,
      title: title.trim(),
      category,
      color,
      status: 'active',
      createdAt: Date.now(),
      smart: smartData,
    };

    onSaveGoal(newGoal, planImmediately);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-wizard-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[94vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl text-white shadow-sm shrink-0"
              style={{ backgroundColor: color }}
            >
              <Target size={18} />
            </div>
            <div>
              <h2 id="goal-wizard-title" className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                Create a SMART Goal
              </h2>
              <p className="text-xs text-slate-400">
                Step {step} of 6: <strong className="text-slate-200">{STEP_LABELS[step - 1]?.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close goal wizard"
          >
            <X size={18} />
          </button>
        </div>

        {/* Guided Stepper Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none py-1">
            {STEP_LABELS.map((item) => {
              const isCurrent = step === item.step;
              const isDone = step > item.step;
              return (
                <div
                  key={item.step}
                  onClick={() => {
                    if (isDone) setStep(item.step as any);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 ${
                    isCurrent
                      ? 'bg-[#3659C9]/15 text-[#3659C9] font-bold border border-[#3659C9]/30'
                      : isDone
                      ? 'text-slate-300 hover:text-white cursor-pointer hover:bg-slate-800/60'
                      : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-[#3659C9] text-white'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? <Check size={11} /> : item.letter}
                  </span>
                  <span className="hidden sm:inline font-medium">{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-200 scrollbar-thin">
          {validationError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span className="font-medium">{validationError}</span>
            </div>
          )}

          {/* ════ STEP 1: SPECIFIC ════ */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              {/* Guidance Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-[#3659C9]">
                  <Compass size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">The Specific Principle</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Declare a clear finish line instead of a vague wish. State exactly what milestone you will complete.
                </p>
                <div className="pt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700">
                    Example
                  </span>
                  <span className="italic">"Complete the first six chapters of Data Structures"</span>
                </div>
              </div>

              {/* Goal Title Input */}
              <div className="space-y-2">
                <label htmlFor={titleInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  What do you want to accomplish? <span className="text-rose-400">*</span>
                </label>
                <p className="text-xs text-slate-400">A clear, actionable sentence summarizing your outcome.</p>
                <input
                  id={titleInputId}
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Complete the first six chapters of Data Structures"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3659C9] transition-colors"
                />
              </div>

              {/* Category & Color Accent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="space-y-2">
                  <label htmlFor={categorySelectId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Category
                  </label>
                  <p className="text-xs text-slate-400">Organize and filter your priorities.</p>
                  <select
                    id={categorySelectId}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#3659C9]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Visual Color Theme
                  </label>
                  <p className="text-xs text-slate-400">Accent color used on timetable blocks.</p>
                  <div className="flex items-center gap-2 pt-0.5">
                    {PRESET_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-7 h-7 rounded-lg transition-all ${
                          color === hex ? 'scale-110 ring-2 ring-white shadow-md' : 'opacity-70 hover:opacity-100'
                        }`}
                        aria-label={`Select color ${hex}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Specific Details */}
              <div className="space-y-2 pt-1">
                <label htmlFor={specificDetailsInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Scope &amp; Included Topics <span className="text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <p className="text-xs text-slate-400">List specific sub-topics, chapters, or deliverables to prevent scope creep.</p>
                <textarea
                  id={specificDetailsInputId}
                  rows={3}
                  placeholder="e.g. Master Arrays, Linked Lists, Stacks, Queues, Trees, and Graph theory with practice problems."
                  value={specificDetails}
                  onChange={(e) => setSpecificDetails(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3659C9] transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ════ STEP 2: MEASURABLE ════ */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              {/* Guidance Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-[#3659C9]">
                  <BarChart2 size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">The Measurable Principle</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  How will you measure tangible progress? Choosing a unit allows BlockFlow to calculate completion percentages and timetable hours.
                </p>
              </div>

              {/* Measurement Mode Selector */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Tracking Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMeasurableType('quantity');
                      if (unit === 'hours') setUnit('chapters');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      measurableType === 'quantity'
                        ? 'bg-slate-800/90 border-[#3659C9] text-white shadow-sm ring-1 ring-[#3659C9]/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">Quantity-Based</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Track count of finished items: chapters, problem sets, or assignments.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMeasurableType('effort');
                      setUnit('hours');
                      setTargetValue(estimatedTotalHours);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      measurableType === 'effort'
                        ? 'bg-slate-800/90 border-[#3659C9] text-white shadow-sm ring-1 ring-[#3659C9]/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">Effort-Based</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Track total hours invested in focused study blocks.
                    </p>
                  </button>
                </div>
              </div>

              {/* Target & Completed Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor={targetValueInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Target Amount <span className="text-rose-400">*</span>
                  </label>
                  <p className="text-xs text-slate-400">Total count needed to consider this goal done.</p>
                  <input
                    id={targetValueInputId}
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#3659C9]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor={currentProgressInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Already Completed
                  </label>
                  <p className="text-xs text-slate-400">Starting progress (defaults to 0).</p>
                  <input
                    id={currentProgressInputId}
                    type="number"
                    min={0}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#3659C9]"
                  />
                </div>
              </div>

              {/* Unit of Measurement */}
              <div className="space-y-2">
                <label htmlFor={unitInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Unit Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id={unitInputId}
                  type="text"
                  placeholder="e.g. chapters, problems, assignments, hours"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3659C9]"
                />
                
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400 mr-1">Quick presets:</span>
                  {POPULAR_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        unit.toLowerCase() === u
                          ? 'bg-[#3659C9] border-[#3659C9] text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 3: ACHIEVABLE ════ */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              {/* Guidance Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-[#3659C9]">
                  <Smile size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">The Achievable Principle</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Is this goal realistic given your schedule? Balance total required effort against daily bandwidth to prevent burnout and abandoned timetables.
                </p>
              </div>

              {/* Effort & Daily Available Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor={totalEffortInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Total Estimated Effort (Hours) <span className="text-rose-400">*</span>
                  </label>
                  <p className="text-xs text-slate-400">Total hours needed across the entire goal.</p>
                  <input
                    id={totalEffortInputId}
                    type="number"
                    min={1}
                    value={estimatedTotalHours}
                    onChange={(e) => setEstimatedTotalHours(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#3659C9]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor={dailyTimeInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Daily Available Study Time (Hours) <span className="text-rose-400">*</span>
                  </label>
                  <p className="text-xs text-slate-400">Sustainable focus hours per study day.</p>
                  <input
                    id={dailyTimeInputId}
                    type="number"
                    step={0.5}
                    min={0.5}
                    max={12}
                    value={dailyAvailableHours}
                    onChange={(e) => setDailyAvailableHours(Math.max(0.5, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#3659C9]"
                  />
                </div>
              </div>

              {/* Preferred Study Days */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Days You Can Realistically Study
                </label>
                <p className="text-xs text-slate-400">Select days to distribute focus blocks across your weekly schedule.</p>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = selectedDays.includes(d.index);
                    return (
                      <button
                        key={d.index}
                        type="button"
                        onClick={() => toggleDay(d.index)}
                        className={`py-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                          isSelected
                            ? 'bg-[#3659C9] border-[#3659C9] text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session Duration & Energy Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Session Duration
                  </label>
                  <select
                    value={preferredSessionMinutes}
                    onChange={(e) => setPreferredSessionMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#3659C9]"
                  >
                    <option value={30}>30 mins (Quick sprint)</option>
                    <option value={45}>45 mins (Pomodoro block)</option>
                    <option value={60}>60 mins (Standard 1h block)</option>
                    <option value={90}>90 mins (Deep focus block)</option>
                    <option value={120}>120 mins (2h Intensive)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Preferred Time of Day
                  </label>
                  <select
                    value={preferredEnergyWindow}
                    onChange={(e) => setPreferredEnergyWindow(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#3659C9]"
                  >
                    <option value="morning">Morning (09:00 AM)</option>
                    <option value="afternoon">Afternoon (02:00 PM)</option>
                    <option value="evening">Evening (07:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Feasibility Calculator Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Clock size={15} className="text-[#3659C9]" /> Feasibility Assessment
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {studyDaysNeeded} Study Days Needed
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 py-1 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Work</p>
                    <p className="text-base font-bold text-white font-mono mt-1">{estimatedTotalHours}h</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Daily Pace</p>
                    <p className="text-base font-bold text-white font-mono mt-1">{dailyAvailableHours}h/day</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Days Needed</p>
                    <p className="text-base font-bold text-[#3659C9] font-mono mt-1">~{studyDaysNeeded} days</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  At <strong>{dailyAvailableHours}h/day</strong>, you will need approximately{' '}
                  <strong className="text-white">{studyDaysNeeded} study sessions</strong> to complete{' '}
                  <strong>{estimatedTotalHours} total hours</strong> comfortably.
                </p>
              </div>
            </div>
          )}

          {/* ════ STEP 4: RELEVANT ════ */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              {/* Guidance Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-[#3659C9]">
                  <HelpCircle size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">The Relevant Principle</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Why does this goal matter right now? When your timetable gets crowded, having a clear "Why" provides psychological friction against skipping sessions.
                </p>
              </div>

              {/* Motivation Input */}
              <div className="space-y-2">
                <label htmlFor={motivationInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Why is this goal important to you? <span className="text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <p className="text-xs text-slate-400">Connect this goal to your broader semester, career, or personal vision.</p>
                <textarea
                  id={motivationInputId}
                  rows={4}
                  autoFocus
                  placeholder="e.g. Core foundation for technical internship interviews and high-stakes end-term examinations."
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3659C9] transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Guided Prompts */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Prompting Questions</p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#3659C9] font-bold">•</span>
                    <span>Does this directly unlock an exam grade, internship, or key project?</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#3659C9] font-bold">•</span>
                    <span>What happens to your trajectory if this is delayed or abandoned?</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ════ STEP 5: TIME-BOUND ════ */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              {/* Guidance Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-[#3659C9]">
                  <Calendar size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">The Time-Bound Principle</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Every goal needs a completion date. We compare your target deadline against the ~{studyDaysNeeded} required study days to confirm your schedule is realistic.
                </p>
              </div>

              {/* Start Date and Target Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor={startDateInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Start Date
                  </label>
                  <p className="text-xs text-slate-400">When you begin active work.</p>
                  <input
                    id={startDateInputId}
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#3659C9]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor={deadlineInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Target Deadline <span className="text-rose-400">*</span>
                  </label>
                  <p className="text-xs text-slate-400">Target completion date.</p>
                  <input
                    id={deadlineInputId}
                    type="date"
                    min={startDate}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#3659C9]"
                  />
                </div>
              </div>

              {/* Timeline Feasibility Check Card */}
              <div
                className={`p-5 rounded-2xl border space-y-3.5 ${
                  isTimelineFeasible
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Schedule Feasibility Verdict
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                      isTimelineFeasible
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isTimelineFeasible ? 'Realistic Timeline' : 'Tight Schedule'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <span>Available time span: <strong className="text-white">{daysAvailable} days</strong></span>
                  <span>Study days needed: <strong className="text-white">~{studyDaysNeeded} days</strong></span>
                </div>

                {isTimelineFeasible ? (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    With <strong>{daysAvailable} days</strong> until your deadline, you have plenty of room for rest and revision alongside the ~{studyDaysNeeded} required study days.
                  </p>
                ) : (
                  <p className="text-xs text-amber-200 leading-relaxed">
                    Tight schedule: You need ~{studyDaysNeeded} study days at {dailyAvailableHours}h/day, but only {daysAvailable} days remain before your deadline. Consider dedicating more hours daily or extending the deadline.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ════ STEP 6: REVIEW ════ */}
          {step === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-sm font-bold text-white">Review your SMART Goal Plan</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Confirm the framework details below. After saving, you can instantly place study sessions into your timetable.
                </p>
              </div>

              {/* 5 SMART Scorecard Cards */}
              <div className="space-y-3">
                {/* S - Specific */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#3659C9] uppercase tracking-wider">
                      S — Specific Ambition
                    </span>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    {specificDetails && (
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">{specificDetails}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-white underline shrink-0 font-medium"
                  >
                    Edit
                  </button>
                </div>

                {/* M - Measurable */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      M — Measurable Metric
                    </span>
                    <p className="text-sm font-semibold text-white">
                      Target: {targetValue} {unit}
                    </p>
                    <p className="text-xs text-slate-400">
                      Current progress: {currentValue} of {targetValue} {unit} completed
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs text-slate-400 hover:text-white underline shrink-0 font-medium"
                  >
                    Edit
                  </button>
                </div>

                {/* A - Achievable */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      A — Achievable Pace
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {estimatedTotalHours} hours total effort · {dailyAvailableHours}h/day
                    </p>
                    <p className="text-xs text-slate-400">
                      ~{studyDaysNeeded} study days on {selectedDays.length} days/week · {preferredSessionMinutes}m blocks
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs text-slate-400 hover:text-white underline shrink-0 font-medium"
                  >
                    Edit
                  </button>
                </div>

                {/* R - Relevant */}
                {motivation && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                        R — Relevant Reason
                      </span>
                      <p className="text-xs text-slate-300 italic leading-relaxed">"{motivation}"</p>
                    </div>
                    <button
                      onClick={() => setStep(4)}
                      className="text-xs text-slate-400 hover:text-white underline shrink-0 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* T - Time-bound */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      T — Time-Bound Deadline
                    </span>
                    <p className="text-sm font-semibold text-white">
                      Deadline: {new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-400">{daysAvailable} days available from start date</p>
                  </div>
                  <button
                    onClick={() => setStep(5)}
                    className="text-xs text-slate-400 hover:text-white underline shrink-0 font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/70">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors border border-slate-700"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors border border-slate-700"
              >
                Save Goal Only
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-xl transition-colors shadow-md"
              >
                <CalendarPlus size={16} />
                <span>Save &amp; Plan Schedule</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
