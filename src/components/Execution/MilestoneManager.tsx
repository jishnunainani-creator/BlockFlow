import React, { useState, useEffect, useRef } from 'react';
import { CustomMilestone } from '../../types/executionOS';
import { loadCustomMilestones, saveCustomMilestones, SYSTEM_MILESTONE_DEFINITIONS, loadAssignments } from '../../utils/assignmentStorage';
import { extractMetricsFromData, calculateMilestones } from '../../utils/milestoneEngine';
import { useTimetable } from '../../context/TimetableContext';
import { useExecution } from '../../context/ExecutionContext';
import FutureMeModal from './FutureMeModal';
import {
  Trophy,
  Star,
  Zap,
  Code,
  BookOpen,
  Medal,
  Plus,
  CheckCircle2,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Mail,
  TrendingUp,
  Award,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  focus: Zap,
  consistency: Star,
  career: Code,
  learning: BookOpen,
  personal: Medal,
};

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  focus: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  consistency: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  career: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  learning: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  personal: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
};

export default function MilestoneManager() {
  const { currentWeekScheduledBlocks, scheduledBlocks, addToast } = useTimetable();
  const { dailyScores, reflections, streaks } = useExecution();
  const assignments = loadAssignments();

  const [customMilestones, setCustomMilestones] = useState<CustomMilestone[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<CustomMilestone | null>(null);

  // Custom Milestone Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CustomMilestone['category']>('focus');
  const [measurementType, setMeasurementType] = useState<CustomMilestone['measurementType']>('hours');
  const [targetValue, setTargetValue] = useState<number>(100);
  const [targetDate, setTargetDate] = useState<string>('');

  // Future Me Modal
  const [isFutureMeOpen, setIsFutureMeOpen] = useState(false);

  // Track previously unlocked IDs to prevent duplicate toasts
  const prevUnlockedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setCustomMilestones(loadCustomMilestones());
  }, []);

  const persistCustomMilestones = (updated: CustomMilestone[]) => {
    setCustomMilestones(updated);
    saveCustomMilestones(updated);
  };

  // Extract canonical metrics & calculate milestones dynamically
  const metrics = extractMetricsFromData({
    scheduledBlocks: currentWeekScheduledBlocks || scheduledBlocks,
    dailyScores,
    reflections,
    assignments,
    goals: [],
    streaks,
  });

  const { updatedSystemMilestones, newlyUnlocked } = calculateMilestones(
    SYSTEM_MILESTONE_DEFINITIONS,
    customMilestones,
    metrics
  );

  // Trigger toast notifications when a milestone is newly unlocked
  useEffect(() => {
    newlyUnlocked.forEach((m) => {
      if (!prevUnlockedIdsRef.current.has(m.id)) {
        addToast(`🏆 Milestone Unlocked: ${m.title}!`, 'success');
        prevUnlockedIdsRef.current.add(m.id);
      }
    });
  }, [newlyUnlocked, addToast]);

  // Combine system milestones and custom milestones
  const allMilestones = [...updatedSystemMilestones, ...customMilestones];
  const activeMilestones = allMilestones.filter((m) => !m.isArchived);

  const filteredMilestones = activeMilestones.filter((m) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'custom') return m.isCustom;
    return m.category === activeCategory;
  });

  const achieved = filteredMilestones.filter((m) => m.isUnlocked);
  const inProgress = filteredMilestones.filter((m) => !m.isUnlocked);

  const totalAchievedCount = activeMilestones.filter((m) => m.isUnlocked).length;
  const totalCount = activeMilestones.length;

  const handleSaveMilestone = () => {
    if (!title || !description) {
      addToast('Please enter a milestone title and description', 'warning');
      return;
    }

    if (editingId) {
      const updated = customMilestones.map((m) =>
        m.id === editingId
          ? {
              ...m,
              title,
              description,
              category,
              measurementType,
              targetValue: Number(targetValue),
              targetDate: targetDate || undefined,
            }
          : m
      );
      persistCustomMilestones(updated);
      addToast('Custom milestone updated successfully! 🏆', 'success');
    } else {
      const newMilestone: CustomMilestone = {
        id: `custom-m-${Date.now()}`,
        title,
        description,
        category,
        measurementType,
        targetValue: Number(targetValue),
        currentValue: 0,
        targetDate: targetDate || undefined,
        isUnlocked: false,
        isCustom: true,
      };
      persistCustomMilestones([newMilestone, ...customMilestones]);
      addToast('Custom milestone created! 🎯', 'success');
    }

    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('focus');
    setMeasurementType('hours');
    setTargetValue(100);
    setTargetDate('');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = customMilestones.filter((m) => m.id !== id);
    persistCustomMilestones(updated);
    setSelectedMilestone(null);
    addToast('Custom milestone removed', 'info');
  };

  return (
    <div className="space-y-6 text-slate-200 select-none">
      {/* ── TOP SUMMARY BAR ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Milestones &amp; Achievement Timeline
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {totalAchievedCount} / {totalCount} Earned
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Automatic milestone progress derived directly from your execution logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFutureMeOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Mail size={14} className="text-purple-400" />
              <span>Future Me Capsule</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus size={16} />
              <span>Add Custom Milestone</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/80">
          {['all', 'focus', 'consistency', 'career', 'learning', 'personal', 'custom'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── IN-PROGRESS MILESTONES ── */}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>In-Progress Milestones</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{inProgress.length} active goals</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((m) => {
              const Icon = CATEGORY_ICONS[m.category] || Trophy;
              const cfg = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.focus;
              const progressPct = Math.min(100, Math.round((m.currentValue / m.targetValue) * 100));

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMilestone(m)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all cursor-pointer space-y-3 shadow-sm group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center`}>
                        <Icon size={18} className={cfg.color} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                          {m.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium capitalize">{m.category}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400">{progressPct}%</span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{m.description}</p>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>
                        {m.currentValue} / {m.targetValue} {m.measurementType}
                      </span>
                      {m.targetDate && <span>Target: {m.targetDate}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACHIEVED MILESTONES ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Medal className="w-4 h-4 text-emerald-400" />
            <span>Achieved Milestones</span>
          </h3>
          <span className="text-xs text-emerald-400 font-medium">{achieved.length} completed</span>
        </div>

        {achieved.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achieved.map((m) => {
              const Icon = CATEGORY_ICONS[m.category] || Trophy;
              const cfg = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.focus;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMilestone(m)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all cursor-pointer space-y-3 shadow-sm group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center`}>
                        <Icon size={18} className={cfg.color} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                          {m.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium capitalize">{m.category}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Unlocked
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{m.description}</p>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 size={12} /> Verified Milestone
                    </span>
                    <span className="text-slate-500 font-medium">{m.earnedDate || 'Earned'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No Achieved Milestones Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Every new BlockFlow account starts with a clean achievement history. Complete your daily timetable blocks, focus sessions, and reflections to unlock your first verified milestone!
            </p>
          </div>
        )}
      </div>

      {/* ── MILESTONE DETAIL MODAL ── */}
      {selectedMilestone && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedMilestone(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedMilestone.title}</h3>
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                    {selectedMilestone.category} Milestone
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMilestone(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              {selectedMilestone.description}
            </p>

            {/* Progress / Status Block */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Progress</span>
                <span className="text-white">
                  {selectedMilestone.currentValue} / {selectedMilestone.targetValue} {selectedMilestone.measurementType}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (selectedMilestone.currentValue / selectedMilestone.targetValue) * 100)}%` }}
                />
              </div>
            </div>

            {/* AI Insights & Velocity */}
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
              <strong className="text-indigo-300 font-bold flex items-center gap-1">
                <Sparkles size={14} /> AI Progress Velocity
              </strong>
              <p className="text-[11px] leading-relaxed">
                {selectedMilestone.isUnlocked
                  ? `Achieved on ${selectedMilestone.earnedDate || 'recent activity'}. Derived from actual BlockFlow execution records.`
                  : `Currently at ${selectedMilestone.currentValue} ${selectedMilestone.measurementType} out of ${selectedMilestone.targetValue}. Keep completing scheduled blocks to unlock!`}
              </p>
            </div>

            {/* Actions for Custom Milestones */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              {selectedMilestone.isCustom ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(selectedMilestone.id);
                      setTitle(selectedMilestone.title);
                      setDescription(selectedMilestone.description);
                      setCategory(selectedMilestone.category);
                      setMeasurementType(selectedMilestone.measurementType);
                      setTargetValue(selectedMilestone.targetValue);
                      setTargetDate(selectedMilestone.targetDate || '');
                      setSelectedMilestone(null);
                      setIsFormOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-semibold flex items-center gap-1"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMilestone.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 font-semibold flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold">Automatic System Milestone</span>
              )}

              <button
                onClick={() => setSelectedMilestone(null)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT CUSTOM MILESTONE MODAL ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingId ? 'Edit Custom Milestone' : 'New Custom Milestone'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Milestone Name</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Master React 19 & Next.js App Router"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white h-20 resize-none focus:outline-none focus:border-indigo-500"
                  placeholder="Why this milestone matters to your career..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="focus">Focus</option>
                    <option value="consistency">Consistency</option>
                    <option value="career">Career</option>
                    <option value="learning">Learning</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Measurement Type</label>
                  <select
                    value={measurementType}
                    onChange={(e) => setMeasurementType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="score">Score (%)</option>
                    <option value="count">Count</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Value</label>
                  <input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Date (Optional)</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilestone}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
              >
                Save Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Future Me Modal */}
      <FutureMeModal isOpen={isFutureMeOpen} onClose={() => setIsFutureMeOpen(false)} />
    </div>
  );
}
