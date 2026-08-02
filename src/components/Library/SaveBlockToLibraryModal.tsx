import React, { useState, useEffect } from 'react';
import { ScheduledBlock, LibraryBlock, Priority, PRIORITY_CONFIG } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { AVAILABLE_ICONS } from './BlockModal';
import { minutesToTimeStr, formatDuration } from '../../utils/timeUtils';
import {
  X,
  Bookmark,
  Check,
  AlertCircle,
  Clock,
  Tag,
  Link,
  Plus,
  Sparkles,
} from 'lucide-react';

interface SaveBlockToLibraryModalProps {
  isOpen: boolean;
  block: ScheduledBlock | null;
  onClose: () => void;
  onSuccess?: (libBlock: LibraryBlock) => void;
}

export function normalizeActivityTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export const SaveBlockToLibraryModal: React.FC<SaveBlockToLibraryModalProps> = ({
  isOpen,
  block,
  onClose,
  onSuccess,
}) => {
  const { libraryBlocks, addLibraryBlockAndLinkScheduled, updateScheduledBlock, addToast } = useTimetable();

  const [mode, setMode] = useState<'form' | 'similar_found'>('form');
  const [matchedLibBlock, setMatchedLibBlock] = useState<LibraryBlock | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [priority, setPriority] = useState<Priority>('medium');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('code');
  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    if (!block || !isOpen) return;

    const normTitle = normalizeActivityTitle(block.title);
    const existing = libraryBlocks.find(
      (lib) => normalizeActivityTitle(lib.title) === normTitle
    );

    if (existing) {
      setMatchedLibBlock(existing);
      setMode('similar_found');
    } else {
      setMatchedLibBlock(null);
      setMode('form');
    }

    setTitle(block.title);
    setDescription(block.description || '');
    setDefaultDuration(block.duration || 60);
    setPriority(block.priority || 'medium');
    setColor(block.color || '#3B82F6');
    setIcon(block.icon || 'code');
    setIsFixed(block.isFixed || false);
  }, [block, isOpen, libraryBlocks]);

  if (!isOpen || !block) return null;

  const handleLinkExisting = () => {
    if (!matchedLibBlock) return;
    updateScheduledBlock(block.id, { blockId: matchedLibBlock.id });
    addToast(`Linked "${block.title}" to existing Activity Library block! 🔗`, 'success');
    if (onSuccess) onSuccess(matchedLibBlock);
    onClose();
  };

  const handleSaveNew = () => {
    if (!title.trim()) return;

    const newLibBlock = addLibraryBlockAndLinkScheduled(
      {
        title: title.trim(),
        description: description.trim(),
        defaultDuration,
        priority,
        color,
        icon,
      },
      [block.id]
    );

    if (onSuccess) onSuccess(newLibBlock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Save to Activity Library
              </h3>
              <p className="text-xs text-slate-400">Convert timetable block into reusable activity</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode 1: Similar Activity Found Alert */}
        {mode === 'similar_found' && matchedLibBlock ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-200">Similar Activity Found in Library</h4>
                <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                  A reusable activity with a matching title already exists in your Activity Library.
                </p>
              </div>
            </div>

            {/* Matched Activity Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{matchedLibBlock.title}</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{
                    color: matchedLibBlock.color,
                    borderColor: `${matchedLibBlock.color}40`,
                    backgroundColor: `${matchedLibBlock.color}15`,
                  }}
                >
                  {matchedLibBlock.priority}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(matchedLibBlock.defaultDuration)}
                </span>
                {matchedLibBlock.description && (
                  <span className="truncate max-w-[200px] text-slate-500">
                    · {matchedLibBlock.description}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleLinkExisting}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Link className="w-4 h-4" />
                Link Existing Activity
              </button>

              <button
                onClick={() => setMode('form')}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Save as New Activity
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Mode 2: Save Dialog Form */
          <div className="p-6 space-y-4">
            {/* Title Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Activity Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. Self Study, Fitness, DSA Practice"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                placeholder="Add default notes, requirements or goals..."
              />
            </div>

            {/* Duration & Category Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Default Duration */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Default Duration
                </label>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1h 30m</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>

              {/* Category / Priority */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                  <option value="personal">Personal / Wellness</option>
                  <option value="meetings">Meetings / Social</option>
                </select>
              </div>
            </div>

            {/* Schedule Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Schedule Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsFixed(true)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    isFixed
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  📌 Fixed Block
                </button>

                <button
                  type="button"
                  onClick={() => setIsFixed(false)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    !isFixed
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  🔄 Flexible Block
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveNew}
                disabled={!title.trim()}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Bookmark className="w-4 h-4" />
                Save to Library
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
