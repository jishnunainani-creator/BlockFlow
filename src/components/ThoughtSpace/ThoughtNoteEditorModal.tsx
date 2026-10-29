import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Pin,
  Archive,
  Trash2,
  Check,
  Plus,
  CornerDownRight,
  FolderTree,
} from 'lucide-react';
import {
  ThoughtNote,
  ThoughtColor,
  THOUGHT_COLORS,
  VALID_COLORS,
} from '../../types/thoughtSpace';
import { canSetParent } from '../../utils/thoughtSpaceEngine';

interface ThoughtNoteEditorModalProps {
  note: ThoughtNote | null;
  isOpen: boolean;
  onClose: () => void;
  allNotes: ThoughtNote[];
  onSave: (id: string, updates: Partial<ThoughtNote>) => void;
  onAddSubnote: (parentNote: ThoughtNote) => void;
  onDeleteRequest: (note: ThoughtNote) => void;
}

export const ThoughtNoteEditorModal: React.FC<ThoughtNoteEditorModalProps> = ({
  note,
  isOpen,
  onClose,
  allNotes,
  onSave,
  onAddSubnote,
  onDeleteRequest,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState<ThoughtColor>('default');
  const [parentNoteId, setParentNoteId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Sync state when incoming note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setBody(note.body || '');
      setColor(note.color || 'default');
      setParentNoteId(note.parentNoteId || null);
      setIsPinned(Boolean(note.isPinned));
      setIsArchived(Boolean(note.isArchived));
      setSaveStatus('saved');
      isFirstRender.current = true;
    }
  }, [note]);

  // Debounced Autosave
  const triggerAutosave = (updates: Partial<ThoughtNote>) => {
    if (!note) return;
    setSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSave(note.id, updates);
      setSaveStatus('saved');
    }, 400);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerAutosave({ title: val.trim() });
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    triggerAutosave({ body: val });
  };

  const handleColorChange = (newCol: ThoughtColor) => {
    setColor(newCol);
    triggerAutosave({ color: newCol });
  };

  const handleParentChange = (newParent: string) => {
    const nextParentId = newParent === '__root__' ? null : newParent;
    if (note && !canSetParent(note.id, nextParentId, allNotes)) {
      return; // Prevent cycles
    }
    setParentNoteId(nextParentId);
    triggerAutosave({ parentNoteId: nextParentId });
  };

  const handleTogglePin = () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    triggerAutosave({ isPinned: nextPin });
  };

  const handleToggleArchive = () => {
    const nextArch = !isArchived;
    setIsArchived(nextArch);
    triggerAutosave({ isArchived: nextArch });
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !note) return null;

  // Direct child subnotes
  const childSubnotes = allNotes.filter((n) => n.parentNoteId === note.id);

  // Parent options filtered by cycle prevention
  const availableParents = allNotes.filter((n) => {
    return canSetParent(note.id, n.id, allNotes);
  });

  const currentColorConfig = THOUGHT_COLORS[color] || THOUGHT_COLORS.default;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-xl overflow-hidden transition-colors ${
          currentColorConfig.bgLight
        } ${currentColorConfig.bgDark} ${currentColorConfig.borderLight} ${currentColorConfig.borderDark}`}
      >
        {/* Top Modal Bar */}
        <div className="px-5 py-3.5 border-b border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                saveStatus === 'saved'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {saveStatus === 'saved' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Saving...</span>
                </>
              )}
            </span>

            {/* Parent Breadcrumb pill if nested */}
            {parentNoteId && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                <CornerDownRight className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {allNotes.find((n) => n.id === parentNoteId)?.title || 'Parent Note'}
                </span>
              </span>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleTogglePin}
              title={isPinned ? 'Unpin note' : 'Pin note to top'}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isPinned
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleToggleArchive}
              title={isArchived ? 'Unarchive note' : 'Archive note'}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isArchived
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Archive className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteRequest(note)}
              title="Delete note"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Editor Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 scrollbar-thin">
          {/* Note Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Thought"
            className="w-full bg-transparent text-lg sm:text-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />

          {/* Note Multiline Body */}
          <textarea
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            rows={8}
            placeholder="Write details, outlines, sub-points, or stream of thought..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden resize-y min-h-[160px] leading-relaxed"
          />

          {/* Hierarchy & Parent Selector */}
          <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-slate-500" />
                <span>Parent Note</span>
              </label>

              <select
                value={parentNoteId || '__root__'}
                onChange={(e) => handleParentChange(e.target.value)}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 max-w-xs"
              >
                <option value="__root__">None (Top-Level Root Note)</option>
                {availableParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.body.slice(0, 30) || 'Untitled Note'}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Palette Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Note Color
              </span>
              <div className="flex items-center gap-2">
                {VALID_COLORS.map((colId) => {
                  const cfg = THOUGHT_COLORS[colId];
                  const isSelected = color === colId;
                  return (
                    <button
                      key={colId}
                      type="button"
                      onClick={() => handleColorChange(colId)}
                      title={cfg.label}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-1 scale-110 border-white'
                          : 'border-black/10 dark:border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: cfg.dotColor }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Subnotes Section */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subnotes ({childSubnotes.length})
              </span>
              <button
                type="button"
                onClick={() => onAddSubnote(note)}
                className="px-2.5 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Subnote</span>
              </button>
            </div>

            {childSubnotes.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-1">
                No nested subnotes under this thought yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {childSubnotes.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {sub.title || 'Untitled subnote'}
                      </p>
                      {sub.body && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {sub.body}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(sub)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete subnote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
          <span className="text-[11px] text-slate-400">
            Last edited {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
