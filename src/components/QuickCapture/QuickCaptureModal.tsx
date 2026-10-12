import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, ArrowRight, CornerDownLeft, Sparkles, Calendar, Clock, ListTodo } from 'lucide-react';
import { parseNaturalLanguageInput } from '../../utils/naturalLanguageParser';
import { addQuickCaptureItem } from '../../utils/quickCaptureStorage';
import { QuickCaptureItem } from '../../types/quickCapture';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (item: QuickCaptureItem) => void;
  onSaveAndConvert?: (item: QuickCaptureItem) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  onSaveAndConvert,
}) => {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Live NLP suggestions
  const liveParsed = React.useMemo(() => {
    if (!text.trim()) return null;
    return parseNaturalLanguageInput(text);
  }, [text]);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setNotes('');
      setShowNotesField(false);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (convertImmediately = false) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter something to capture.');
      inputRef.current?.focus();
      return;
    }

    const createdItem = addQuickCaptureItem(trimmed, notes);

    if (convertImmediately && onSaveAndConvert) {
      onSaveAndConvert(createdItem);
      onClose();
    } else {
      if (onSaved) onSaved(createdItem);
      onClose();
    }
  };

  const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSave(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Quick Capture
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Capture now, organize anytime into tasks, schedule, or goals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Body */}
        <div className="p-4 sm:p-5 space-y-3">
          <div>
            <textarea
              ref={inputRef}
              rows={3}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDownTextarea}
              placeholder="e.g., 'Finish my DSA assignment by Friday', 'Study probability for 45 minutes tomorrow', 'Buy groceries'..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none transition-colors"
            />
            {error && <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>}
          </div>

          {/* Live NLP Suggestion Pills (Subtle preview) */}
          {liveParsed && liveParsed.matchedKeywords.length > 0 && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 flex-wrap text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                <Sparkles className="w-3 h-3" />
                <span>Detected:</span>
              </span>

              {liveParsed.suggestedDate && (
                <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  🗓️ {liveParsed.suggestedDate}
                </span>
              )}

              {liveParsed.suggestedTimeMinutes !== undefined && (
                <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  ⏰ {Math.floor(liveParsed.suggestedTimeMinutes / 60)}:
                  {String(liveParsed.suggestedTimeMinutes % 60).padStart(2, '0')}
                </span>
              )}

              {liveParsed.suggestedDuration && (
                <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  ⏱️ {liveParsed.suggestedDuration}m
                </span>
              )}

              <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-800/60 capitalize">
                Type: {liveParsed.suggestedType.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Optional notes expandable */}
          {showNotesField ? (
            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional context, notes, or links..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNotesField(true)}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
            >
              + Add notes or links
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
              Enter
            </kbd>
            <span>to save</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {onSaveAndConvert && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={!text.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Save & Convert...
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition-colors"
            >
              <span>Save to Inbox</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
