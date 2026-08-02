import React, { useState } from 'react';
import { Goal } from '../../types/timetable';
import { Target, ArrowRight, ArrowLeft, Check, Calendar, Clock, Flame, ShieldAlert, Sparkles, X } from 'lucide-react';

interface GoalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Goal) => void;
}

export const GoalWizardModal: React.FC<GoalWizardModalProps> = ({ isOpen, onClose, onSaveGoal }) => {
  const [step, setStep] = useState<number>(1);

  // Step 1: Goal Overview
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Career');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8B5CF6');

  // Step 2: Purpose & Motivation
  const [purpose, setPurpose] = useState('');
  const [derailObstacle, setDerailObstacle] = useState('');

  // Step 3: Target Deadline
  const [targetDate, setTargetDate] = useState(() => {
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 3);
    return defaultDate.toISOString().split('T')[0];
  });

  // Step 4: Time Commitment
  const [targetWeeklyHours, setTargetWeeklyHours] = useState(10);
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState(90);
  const [preferredEnergyWindow, setPreferredEnergyWindow] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  if (!isOpen) return null;

  // Calculate remaining days & total required hours dynamically
  const targetTime = new Date(targetDate).getTime();
  const nowTime = new Date().getTime();
  const diffDays = Math.max(1, Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24)));
  const diffWeeks = Math.max(1, Math.ceil(diffDays / 7));
  const calculatedTotalHours = targetWeeklyHours * diffWeeks;

  const handleFinish = () => {
    if (!title.trim()) return;

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      purpose: purpose.trim(),
      derailObstacle: derailObstacle.trim(),
      targetDate,
      targetWeeklyHours,
      preferredSessionMinutes,
      preferredEnergyWindow,
      totalRequiredHours: calculatedTotalHours,
      color,
      createdAt: Date.now(),
      components: [],
      milestones: [],
      // Compatibility fields
      deadline: new Date(targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      targetHoursPerDay: Math.round((targetWeeklyHours / 7) * 10) / 10,
      progressPct: 0,
    };

    onSaveGoal(newGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
              Step {step} of 5 — Goal Wizard
            </span>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <Target className="text-purple-400" size={20} />
              <span>Define Long-Term Ambition</span>
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="h-1 w-full bg-slate-950">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: GOAL OVERVIEW */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  What do you want to achieve? <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crack CAT Exam with 99+ Percentile, Launch SaaS Platform"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Career">Career</option>
                    <option value="Academics">Academics</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Skill Development">Skill Development</option>
                    <option value="Financial">Financial</option>
                    <option value="Personal Growth">Personal Growth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Accent Color</label>
                  <div className="flex gap-2 items-center pt-1">
                    {['#8B5CF6', '#10B981', '#F43F5E', '#F59E0B', '#0EA5E9'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          color === c ? 'scale-110 border-white' : 'border-transparent opacity-60'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core scope and expected outcome..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PURPOSE & MOTIVATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1 flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-400" />
                  Why does this goal matter to you?
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Achieving this goal unlocks my dream tier-1 master's program and secures financial freedom..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none min-h-[90px]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Your AI Coach uses your personal motivation during low consistency periods.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-rose-400" />
                  What obstacle is most likely to derail you? (Optional)
                </label>
                <textarea
                  value={derailObstacle}
                  onChange={(e) => setDerailObstacle(e.target.value)}
                  placeholder="e.g. Procrastinating on difficult math topics during late evenings..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none min-h-[70px]"
                />
              </div>
            </div>
          )}

          {/* STEP 3: TARGET DEADLINE */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-400" />
                  Target Completion Date
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Dynamic Calculations */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Dynamic Timeline Analysis</span>
                <div className="grid grid-cols-2 gap-3 text-center pt-1">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-2xl font-black text-white">{diffDays}</span>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Days Remaining</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-2xl font-black text-purple-400">{diffWeeks}</span>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Weeks Remaining</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TIME COMMITMENT */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-400" />
                    Weekly Hours Commitment
                  </label>
                  <span className="text-sm font-black text-purple-400 font-mono">{targetWeeklyHours} hrs/week</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={targetWeeklyHours}
                  onChange={(e) => setTargetWeeklyHours(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Session Duration</label>
                  <select
                    value={preferredSessionMinutes}
                    onChange={(e) => setPreferredSessionMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 hr)</option>
                    <option value={90}>90 minutes (1.5 hrs)</option>
                    <option value={120}>120 minutes (2 hrs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Energy Window</label>
                  <select
                    value={preferredEnergyWindow}
                    onChange={(e) => setPreferredEnergyWindow(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="morning">Morning (Peak Focus)</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & CONFIRM */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase text-slate-400">{category}</span>
                  <span className="text-xs font-bold text-purple-400 font-mono">{targetDate}</span>
                </div>

                <h3 className="text-lg font-black text-white">{title || 'Untitled Goal'}</h3>
                {description && <p className="text-xs text-slate-300 italic">"{description}"</p>}

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Weekly Commitment</span>
                    <span className="text-white font-bold">{targetWeeklyHours} hours / week</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Required</span>
                    <span className="text-purple-400 font-bold">{calculatedTotalHours} hours total</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              disabled={step === 1 && !title.trim()}
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-md"
            >
              Next Step <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg"
            >
              <Check size={16} /> Create Goal &amp; Define Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
