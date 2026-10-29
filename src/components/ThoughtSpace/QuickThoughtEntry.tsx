import React, { useState, useRef } from 'react';
import { Plus, CornerDownLeft, Sparkles } from 'lucide-react';
import { ThoughtColor, THOUGHT_COLORS, VALID_COLORS } from '../../types/thoughtSpace';

interface QuickThoughtEntryProps {
  onAddThought: (thought: { title?: string; body: string; color: ThoughtColor }) => void;
}

export const QuickThoughtEntry: React.FC<QuickThoughtEntryProps> = ({ onAddThought }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<ThoughtColor>('default');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanBody = body.trim();
    if (!cleanBody && !title.trim()) return;

    onAddThought({
      title: title.trim(),
      body: cleanBody,
      color: selectedColor,
    });

    setBody('');
    setTitle('');
    setSelectedColor('default');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter submits
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    // Escape collapses if empty
    if (e.key === 'Escape') {
      if (!body.trim() && !title.trim()) {
        setIsExpanded(false);
      }
    }
  };

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 shadow-2xs ${
        THOUGHT_COLORS[selectedColor].bgLight
      } ${THOUGHT_COLORS[selectedColor].bgDark} ${
        isExpanded
          ? 'border-blue-400 dark:border-blue-500/60 ring-2 ring-blue-500/10'
          : `${THOUGHT_COLORS[selectedColor].borderLight} ${THOUGHT_COLORS[selectedColor].borderDark} hover:border-slate-300 dark:hover:border-slate-700`
      }`}
    >
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => {
            setIsExpanded(true);
            setTimeout(() => textareaRef.current?.focus(), 50);
          }}
          className="w-full text-left flex items-center justify-between text-slate-400 dark:text-slate-500 text-xs sm:text-sm py-1 cursor-text"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span>Write a thought, jot an idea, capture an insight...</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Plus className="w-3.5 h-3.5" />
            New
          </span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Optional Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />

          {/* Multiline Body */}
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Write your thought freely... (Press ⌘+Enter to save)"
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden resize-y min-h-[60px]"
          />

          {/* Bottom Bar: Palette + Submit */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5">
              {VALID_COLORS.map((colId) => {
                const config = THOUGHT_COLORS[colId];
                const isSelected = selectedColor === colId;
                return (
                  <button
                    key={colId}
                    type="button"
                    onClick={() => setSelectedColor(colId)}
                    title={config.label}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-1 scale-110 border-white'
                        : 'border-black/10 dark:border-white/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: config.dotColor }}
                  />
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBody('');
                  setTitle('');
                  setIsExpanded(false);
                }}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!body.trim() && !title.trim()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <span>Add Thought</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
