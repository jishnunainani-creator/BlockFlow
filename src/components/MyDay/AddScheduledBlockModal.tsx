import React, { useState, useEffect } from 'react';
import { LibraryBlock, Priority, ScheduledBlock, Goal } from '../../types/timetable';
import { getISOWeekString, minutesToTimeStr, timeStrToMinutes } from '../../utils/timeUtils';
import { X, Clock, Calendar, Check, Target, LayoutGrid } from 'lucide-react';
import { PRESET_COLORS } from '../Library/BlockModal';

interface AddScheduledBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  libraryBlocks: LibraryBlock[];
  goals: Goal[];
  onAddBlock: (block: Omit<ScheduledBlock, 'id' | 'weekId'>) => void;
}

export const AddScheduledBlockModal: React.FC<AddScheduledBlockModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  libraryBlocks,
  goals,
  onAddBlock,
}) => {
  const [selectedLibraryBlockId, setSelectedLibraryBlockId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState('#3B82F6');
  const [priority, setPriority] = useState<Priority>('medium');
  const [goalId, setGoalId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedLibraryBlockId('');
      setTitle('');
      setDescription('');
      setStartTimeStr('09:00');
      setDuration(60);
      setColor('#3B82F6');
      setPriority('medium');
      setGoalId('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectLibraryBlock = (libBlock: LibraryBlock) => {
    setSelectedLibraryBlockId(libBlock.id);
    setTitle(libBlock.title);
    setDescription(libBlock.description || '');
    setColor(libBlock.color);
    setPriority(libBlock.priority);
    setDuration(libBlock.defaultDuration || 60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dayOfWeek = (selectedDate.getDay() + 6) % 7;
    const startMinutes = timeStrToMinutes(startTimeStr);
    const selectedGoal = goals.find((g) => g.id === goalId);

    onAddBlock({
      blockId: selectedLibraryBlockId || `block-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      color,
      priority,
      icon: 'code',
      dayOfWeek,
      startMinutes,
      duration,
      status: 'scheduled',
      goalId: selectedGoal ? selectedGoal.id : undefined,
      goalTitle: selectedGoal ? selectedGoal.title : undefined,
    });

    onClose();
  };

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Schedule Activity Block
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              For {formattedDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Select from Library Blocks */}
          {libraryBlocks && libraryBlocks.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quick Preset from Library
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {libraryBlocks.slice(0, 8).map((lib) => (
                  <button
                    key={lib.id}
                    type="button"
                    onClick={() => handleSelectLibraryBlock(lib)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors ${
                      selectedLibraryBlockId === lib.id
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: lib.color }}
                    />
                    <span>{lib.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Block Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep Work: Database Schema"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Time & Duration Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour (60m)</option>
                <option value={90}>1.5 hours (90m)</option>
                <option value={120}>2 hours (120m)</option>
                <option value={180}>3 hours (180m)</option>
              </select>
            </div>
          </div>

          {/* Priority & Goal Link Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 capitalize"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Linked Goal (Optional)
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">None</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Color Accent
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.slice(0, 10).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-white shadow-xs' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes or deliverables..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Schedule Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
