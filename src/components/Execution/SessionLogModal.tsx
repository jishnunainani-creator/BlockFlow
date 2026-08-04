import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { useTimetable } from '../../context/TimetableContext';
import { ScheduledBlock } from '../../types/timetable';
import { formatMinutesToTimeString } from '../../utils/timeUtils';
import { getTodayDateString } from '../../utils/executionStorage';
import { Sparkles, CheckCircle2, Clock, Star, BookOpen, X, AlertCircle } from 'lucide-react';

interface SessionLogModalProps {
  isOpen: boolean;
  block: ScheduledBlock | null;
  onClose: () => void;
}

export const SessionLogModal: React.FC<SessionLogModalProps> = ({ isOpen, block, onClose }) => {
  const { logSession } = useSession();
  const { addToast } = useTimetable();

  const [actualTitle, setActualTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopicsStr, setSubtopicsStr] = useState('');
  const [notes, setNotes] = useState('');
  const [sessionResult, setSessionResult] = useState<'completed' | 'partially_completed' | 'skipped'>('completed');
  const [focusRating, setFocusRating] = useState<number | undefined>(4);
  const [actualStartMinutes, setActualStartMinutes] = useState(0);
  const [actualDuration, setActualDuration] = useState(60);

  useEffect(() => {
    if (block && isOpen) {
      setActualTitle(block.title);
      setTopic('');
      setSubtopicsStr('');
      setNotes('');
      setSessionResult('completed');
      setFocusRating(4);
      setActualStartMinutes(block.startMinutes);
      setActualDuration(block.duration);
    }
  }, [block, isOpen]);

  if (!isOpen || !block) return null;

  const plannedTimeStr = `${formatMinutesToTimeString(block.startMinutes)} – ${formatMinutesToTimeString(
    block.startMinutes + block.duration
  )}`;

  const isStudy =
    block.title.toLowerCase().includes('study') ||
    block.title.toLowerCase().includes('dsa') ||
    block.title.toLowerCase().includes('read') ||
    block.title.toLowerCase().includes('learn') ||
    block.title.toLowerCase().includes('assignment');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualTitle.trim()) return;

    const subtopics = subtopicsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    logSession({
      scheduledBlockId: block.id,
      date: getTodayDateString(),
      plannedTitle: block.title,
      plannedStartMinutes: block.startMinutes,
      plannedDuration: block.duration,
      plannedDescription: block.description,
      actualTitle: actualTitle.trim(),
      actualStartMinutes,
      actualDuration,
      status: sessionResult,
      topic: topic.trim() || undefined,
      subtopics: subtopics.length > 0 ? subtopics : undefined,
      notes: notes.trim() || undefined,
      focusRating,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                SESSION COMPLETE
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {block.title} • <span className="text-blue-400">{plannedTimeStr}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Quick Input: What did you work on? */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              {isStudy ? 'What did you study?' : 'What did you work on?'}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={isStudy ? 'e.g. Graphs — BFS and DFS' : 'e.g. Built landing page UI'}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Subtopics (Optional) */}
          {isStudy && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Subtopics / Solved Topics (comma-separated)
              </label>
              <input
                type="text"
                value={subtopicsStr}
                onChange={(e) => setSubtopicsStr(e.target.value)}
                placeholder="BFS, DFS, Dijkstra, LeetCode 200"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Optional Session Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Practiced graph traversals and solved 3 LeetCode problems..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Session Result */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Session Result
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'completed', label: 'Completed', icon: '✅' },
                { id: 'partially_completed', label: 'Partially', icon: '◐' },
                { id: 'skipped', label: 'Not Completed', icon: '❌' },
              ].map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => setSessionResult(res.id as any)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-medium transition-all ${
                    sessionResult === res.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>{res.icon}</span>
                  <span>{res.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Focus Rating (1-5) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Optional Focus Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFocusRating(star)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    focusRating === star
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${focusRating && focusRating >= star ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>{star}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Complete</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
