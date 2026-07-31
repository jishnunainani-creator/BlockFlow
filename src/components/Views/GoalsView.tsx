import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Goal } from '../../types/timetable';
import {
  Target,
  Plus,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { addToast } = useTimetable();

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 'g1',
      title: 'Crack CAT Examination',
      category: 'Learning',
      deadline: 'November 2026',
      targetHoursPerDay: 2.0,
      progressPct: 42,
      color: '#8B5CF6',
    },
    {
      id: 'g2',
      title: 'Launch BlockFlow SaaS Platform',
      category: 'Career',
      deadline: 'August 2026',
      targetHoursPerDay: 3.5,
      progressPct: 65,
      color: '#10B981',
    },
    {
      id: 'g3',
      title: 'Maintain Peak Physical Fitness',
      category: 'Health',
      deadline: 'Ongoing',
      targetHoursPerDay: 1.0,
      progressPct: 88,
      color: '#F43F5E',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Career');
  const [deadline, setDeadline] = useState('');
  const [targetHours, setTargetHours] = useState(2);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      category,
      deadline: deadline.trim() || 'December 2026',
      targetHoursPerDay: targetHours,
      progressPct: 0,
      color: category === 'Learning' ? '#8B5CF6' : category === 'Health' ? '#F43F5E' : '#10B981',
    };

    setGoals((prev) => [newGoal, ...prev]);
    addToast(`Created Goal: "${newGoal.title}"! 🎯`, 'success');
    setTitle('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-400" />
            <span>Goal-Based Planning</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Connect daily timetable activities directly to long-term goals and outcomes ({goals.length} active goals)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Long-Term Goal</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <form
            onSubmit={handleCreateGoal}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span>Create New Goal</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Crack CAT Exam, Launch SaaS"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Career">Career</option>
                  <option value="Learning">Learning</option>
                  <option value="Health">Health</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Hours / Day</label>
                <input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={targetHours}
                  onChange={(e) => setTargetHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Deadline</label>
              <input
                type="text"
                placeholder="e.g. November 2026"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow"
              >
                Save Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((goal) => (
          <div
            key={goal.id}
            style={{ borderLeftColor: goal.color }}
            className="p-5 rounded-2xl bg-slate-900 border-l-[4px] border-y border-r border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{goal.category}</span>
                  <h3 className="text-base font-bold text-white leading-snug">{goal.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 shrink-0">
                  {goal.progressPct}% Done
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${goal.progressPct}%`, backgroundColor: goal.color }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Target: {goal.targetHoursPerDay}h/day</span>
                  <span>Deadline: {goal.deadline}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Scheduled</span>
              </span>
              <button className="text-purple-400 hover:underline font-semibold">
                + Schedule Block
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
