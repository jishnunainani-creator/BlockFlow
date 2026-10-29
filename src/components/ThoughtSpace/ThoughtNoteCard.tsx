import React, { useState } from 'react';
import {
  Pin,
  Archive,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  ThoughtNoteTree,
  THOUGHT_COLORS,
} from '../../types/thoughtSpace';

interface ThoughtNoteCardProps {
  note: ThoughtNoteTree;
  onEdit: (note: ThoughtNoteTree) => void;
  onAddSubnote: (parentNote: ThoughtNoteTree) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onToggleArchive: (id: string, isArchived: boolean) => void;
  onDeleteRequest: (note: ThoughtNoteTree) => void;
}

export const ThoughtNoteCard: React.FC<ThoughtNoteCardProps> = ({
  note,
  onEdit,
  onAddSubnote,
  onTogglePin,
  onToggleArchive,
  onDeleteRequest,
}) => {
  const [isSubnotesExpanded, setIsSubnotesExpanded] = useState(true);
  const colorConfig = THOUGHT_COLORS[note.color] || THOUGHT_COLORS.default;

  const formatRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const hasChildren = note.children && note.children.length > 0;

  return (
    <div className="space-y-2 group/card">
      {/* Note Body Card */}
      <div
        className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-150 relative shadow-2xs hover:shadow-xs ${
          colorConfig.bgLight
        } ${colorConfig.bgDark} ${colorConfig.borderLight} ${colorConfig.borderDark} ${
          note.isPinned ? 'ring-1 ring-blue-500/30' : ''
        }`}
      >
        {/* Top Header: Pin, Title, Actions */}
        <div className="flex items-start justify-between gap-2">
          {/* Title or Snippet preview */}
          <div
            onClick={() => onEdit(note)}
            className="flex-1 cursor-pointer min-w-0"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {note.isPinned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  <Pin className="w-3 h-3 fill-current" />
                  <span>Pinned</span>
                </span>
              )}
              {note.isArchived && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                  <Archive className="w-3 h-3" />
                  <span>Archived</span>
                </span>
              )}
              {note.title ? (
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {note.title}
                </h3>
              ) : (
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic">
                  Untitled Thought
                </h3>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 opacity-70 group-hover/card:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onTogglePin(note.id, !note.isPinned)}
              title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
              className={`p-1 rounded-md text-xs transition-colors ${
                note.isPinned
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onToggleArchive(note.id, !note.isArchived)}
              title={note.isArchived ? 'Unarchive note' : 'Archive note'}
              className={`p-1 rounded-md text-xs transition-colors ${
                note.isArchived
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteRequest(note)}
              title="Delete note"
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Note Body Text */}
        {note.body && (
          <div
            onClick={() => onEdit(note)}
            className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-6 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {note.body}
          </div>
        )}

        {/* Bottom Metadata & Subnote Controls */}
        <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>{formatRelativeTime(note.updatedAt)}</span>

            {/* Subnotes Toggle Badge */}
            {hasChildren && (
              <button
                type="button"
                onClick={() => setIsSubnotesExpanded(!isSubnotesExpanded)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-colors"
              >
                {isSubnotesExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span>
                  {note.children.length} {note.children.length === 1 ? 'subnote' : 'subnotes'}
                </span>
              </button>
            )}
          </div>

          {/* "+ Subnote" Button */}
          <button
            type="button"
            onClick={() => onAddSubnote(note)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 px-2 py-0.5 rounded-md transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Subnote</span>
          </button>
        </div>
      </div>

      {/* Nested Children Tree */}
      {hasChildren && isSubnotesExpanded && (
        <div className="pl-4 sm:pl-6 border-l-2 border-slate-200/80 dark:border-slate-800 space-y-2 mt-2">
          {note.children.map((child) => (
            <ThoughtNoteCard
              key={child.id}
              note={child}
              onEdit={onEdit}
              onAddSubnote={onAddSubnote}
              onTogglePin={onTogglePin}
              onToggleArchive={onToggleArchive}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
};
