import React, { useState, useEffect } from 'react';
import { LibraryBlock, Priority, PRIORITY_CONFIG } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import {
  X,
  Code,
  Briefcase,
  Dumbbell,
  Book,
  Target,
  Brain,
  Coffee,
  Sparkles,
  User,
  Laptop,
  Heart,
  Zap,
  Music,
  Terminal,
  Globe,
  PlusCircle,
  Plus,
  Check,
  ArrowLeft,
  ArrowRight,
  Sparkle,
} from 'lucide-react';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: Omit<LibraryBlock, 'id'> | LibraryBlock) => void;
  editingBlock?: LibraryBlock | null;
}

export const AVAILABLE_ICONS = [
  { id: 'code', label: 'Code', Icon: Code },
  { id: 'briefcase', label: 'Work', Icon: Briefcase },
  { id: 'dumbbell', label: 'Gym', Icon: Dumbbell },
  { id: 'book', label: 'Reading', Icon: Book },
  { id: 'target', label: 'Target', Icon: Target },
  { id: 'brain', label: 'Revision', Icon: Brain },
  { id: 'coffee', label: 'Break', Icon: Coffee },
  { id: 'sparkles', label: 'Goal', Icon: Sparkles },
  { id: 'user', label: 'Personal', Icon: User },
  { id: 'laptop', label: 'Study', Icon: Laptop },
  { id: 'heart', label: 'Health', Icon: Heart },
  { id: 'zap', label: 'Energy', Icon: Zap },
  { id: 'music', label: 'Hobby', Icon: Music },
  { id: 'terminal', label: 'Dev', Icon: Terminal },
  { id: 'globe', label: 'Meeting', Icon: Globe },
];

export const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B', // Slate
];

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBlock,
}) => {
  const { customCategories, addCustomCategory } = useTimetable();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [color, setColor] = useState('#EF4444');
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [icon, setIcon] = useState('code');

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (editingBlock) {
      setTitle(editingBlock.title);
      setDescription(editingBlock.description || '');
      setPriority(editingBlock.priority);
      setColor(editingBlock.color);
      setDefaultDuration(editingBlock.defaultDuration);
      setIcon(editingBlock.icon || 'code');
    } else {
      setTitle('');
      setDescription('');
      setPriority('high');
      setColor('#EF4444');
      setDefaultDuration(60);
      setIcon('code');
    }
    setCurrentStep(1);
  }, [editingBlock, isOpen]);

  const handlePriorityChange = (newPriority: Priority) => {
    setPriority(newPriority);
    if (PRIORITY_CONFIG[newPriority]) {
      setColor(PRIORITY_CONFIG[newPriority].defaultColor);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCustomCategory(newCatName.trim());
    setPriority(newCatName.trim());
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingBlock) {
      onSave({
        ...editingBlock,
        title: title.trim(),
        description: description.trim(),
        priority,
        color,
        defaultDuration,
        icon,
      });
    } else {
      onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        color,
        defaultDuration,
        icon,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const basePriorities: { key: string; label: string; badge: string }[] = [
    { key: 'high', label: 'High Priority', badge: '🔴' },
    { key: 'medium', label: 'Medium Priority', badge: '🟠' },
    { key: 'low', label: 'Low Priority', badge: '🟢' },
    { key: 'personal', label: 'Personal', badge: '🔵' },
    { key: 'meetings', label: 'Meetings', badge: '🟣' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 flex flex-col min-h-[460px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingBlock ? 'Edit Activity Block' : 'Create New Activity Block'}
              </h3>
              <p className="text-xs text-slate-400">Step {currentStep} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Visual Progress Bar */}
        <div className="flex items-center justify-between mb-5 px-1 shrink-0">
          <div
            onClick={() => setCurrentStep(1)}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${
              currentStep === 1 ? 'text-indigo-400 font-bold' : 'text-slate-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 1
                  ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/20'
                  : currentStep > 1
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-[10px] uppercase tracking-wider">1. Details</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 transition-all ${
              currentStep >= 2 ? 'bg-indigo-500' : 'bg-slate-800'
            }`}
          />

          <div
            onClick={() => title.trim() && setCurrentStep(2)}
            className={`flex-1 flex flex-col items-center gap-1 transition-all ${
              title.trim() ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            } ${currentStep === 2 ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 2
                  ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/20'
                  : currentStep > 2
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className="text-[10px] uppercase tracking-wider">2. Style</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 transition-all ${
              currentStep === 3 ? 'bg-indigo-500' : 'bg-slate-800'
            }`}
          />

          <div
            onClick={() => title.trim() && setCurrentStep(3)}
            className={`flex-1 flex flex-col items-center gap-1 transition-all ${
              title.trim() ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            } ${currentStep === 3 ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 3
                  ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </div>
            <span className="text-[10px] uppercase tracking-wider">3. Duration</span>
          </div>
        </div>

        {/* Wizard Step Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
          
          {/* STEP 1: Activity Name & Description */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Activity Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. DSA Practice, Internship, Gym, Reading"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && title.trim() && setCurrentStep(2)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Solve 2 LeetCode Medium problems daily, Sprint standup, Upper body workout"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Category & Color Accent */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in flex-1">
              {/* Category / Priority */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Category / Priority Level
                  </label>
                  {!isAddingCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Category</span>
                    </button>
                  )}
                </div>

                {isAddingCategory && (
                  <div className="mb-3 p-2 bg-slate-800/90 border border-indigo-500/40 rounded-xl flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Category name (e.g. Gaming, Side Project)"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {basePriorities.map((item) => {
                    const active = priority === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handlePriorityChange(item.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-slate-800 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        <span>{item.badge}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  {customCategories.map((cat) => {
                    const active = priority === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handlePriorityChange(cat)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-indigo-900/60 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        <span>✨</span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Accent */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-2.5">
                    {PRESET_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-transform ${
                          color.toLowerCase() === hex.toLowerCase()
                            ? 'scale-110 border-white ring-2 ring-white/50 shadow-md'
                            : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {color.toLowerCase() === hex.toLowerCase() && (
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                    title="Custom color picker"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Duration & Icon Selection */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in flex-1">
              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Visual Icon
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {AVAILABLE_ICONS.map(({ id: iconId, label, Icon }) => (
                    <button
                      key={iconId}
                      type="button"
                      onClick={() => setIcon(iconId)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                        icon === iconId
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50 shadow-sm'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] truncate max-w-full font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Scheduled Duration */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Default Scheduled Duration
                </label>
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 45, 60, 90, 120, 180, 240].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDefaultDuration(mins)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        defaultDuration === mins
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md ring-1 ring-indigo-400/50'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {mins < 60 ? `${mins}m` : `${mins / 60}h ${mins % 60 ? `${mins % 60}m` : ''}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Wizard Controls */}
          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-all border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/50 rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                disabled={!title.trim()}
                onClick={() => title.trim() && setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all ${
                  title.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                style={{ backgroundColor: color }}
                className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{editingBlock ? 'Save Changes' : 'Create Activity Block'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
