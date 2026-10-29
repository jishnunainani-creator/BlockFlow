import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { ThoughtNote, DeleteChildrenChoice } from '../../types/thoughtSpace';

interface DeleteNoteConfirmModalProps {
  note: ThoughtNote | null;
  isOpen: boolean;
  onClose: () => void;
  subnoteCount: number;
  onConfirm: (id: string, choice: DeleteChildrenChoice) => void;
}

export const DeleteNoteConfirmModal: React.FC<DeleteNoteConfirmModalProps> = ({
  note,
  isOpen,
  onClose,
  subnoteCount,
  onConfirm,
}) => {
  const [choice, setChoice] = useState<DeleteChildrenChoice>('reparent');

  if (!isOpen || !note) return null;

  const hasChildren = subnoteCount > 0;

  const handleConfirm = () => {
    onConfirm(note.id, choice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Header Icon & Title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Delete Thought
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                "{note.title || (note.body.slice(0, 30) ? `${note.body.slice(0, 30)}...` : 'Untitled thought')}"
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Child Subnotes Choice (if parent) */}
        {hasChildren ? (
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <span>
                This thought has <strong>{subnoteCount}</strong> nested {subnoteCount === 1 ? 'subnote' : 'subnotes'}.
                Choose what to do with the child notes:
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  choice === 'reparent'
                    ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="deleteChoice"
                  checked={choice === 'reparent'}
                  onChange={() => setChoice('reparent')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Keep subnotes (Promote to top level)
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Preserves all {subnoteCount} child subnotes by detaching them and placing them at the root level.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  choice === 'cascade'
                    ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="deleteChoice"
                  checked={choice === 'cascade'}
                  onChange={() => setChoice('cascade')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 block">
                    Delete this thought and all {subnoteCount} subnotes
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Permanently removes this parent thought along with every nested child and grandchild note.
                  </span>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Are you sure you want to delete this thought? This action cannot be undone.
          </p>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            {hasChildren && choice === 'cascade' ? 'Delete All' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
