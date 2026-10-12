import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ScheduledBlock,
  COMPLETION_STATUS_CONFIG,
  CompletionStatus,
  PRIORITY_CONFIG,
} from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { useSession } from '../../context/SessionContext';
import { useTimeBudget } from '../../context/TimeBudgetContext';
import { TimeCategory } from '../../types/timeBudget';
import { formatDuration, minutesToTimeStr } from '../../utils/timeUtils';
import { AVAILABLE_ICONS } from '../Library/BlockModal';
import { StatusPickerPopover } from '../Completion/StatusPickerPopover';
import { calculateCompletionProbability } from '../../utils/aiProductivityEngine';
import {
  X,
  Clock,
  Tag,
  Bell,
  TrendingUp,
  Edit3,
  Trash2,
  Check,
  CheckCircle2,
  ArrowRightLeft,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Bookmark,
} from 'lucide-react';
import { SaveBlockToLibraryModal } from '../Library/SaveBlockToLibraryModal';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FocusCardProps {
  block: ScheduledBlock;
  cardRect: DOMRect;
  onClose: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CARD_WIDTH       = 348;
const CARD_EST_HEIGHT  = 560;
const VIEWPORT_PAD     = 14;
const HEADER_CLEARANCE = 100; // space reserved for nav/toolbar at top

// ─── Component ─────────────────────────────────────────────────────────────────

export const FocusCard: React.FC<FocusCardProps> = ({ block, cardRect, onClose }) => {
  const {
    deleteScheduledBlock,
    updateScheduledBlock,
    updateBlockStatus,
    libraryBlocks,
    conflicts,
  } = useTimetable();

  const { openSessionLogModal, openReplaceModal } = useSession();

  const [mounted,          setMounted]          = useState(false);
  const [isEditingNotes,   setIsEditingNotes]   = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showSaveLibModal, setShowSaveLibModal] = useState(false);
  const [tempNotes,        setTempNotes]        = useState(block.description || '');

  const cardRef = useRef<HTMLDivElement>(null);

  const { categories } = useTimeBudget();

  const completionProb = calculateCompletionProbability(block);
  const currentStatus: CompletionStatus = block.status || 'not_started';
  const statusCfg    = COMPLETION_STATUS_CONFIG[currentStatus];
  const isConflicting = conflicts.has(block.id);

  // Time Category lookup
  const matchedCategory = categories.find(
    (c: TimeCategory) => c.id === (block as any).categoryId || c.name.toLowerCase() === block.title.toLowerCase()
  );
  const timeCategoryName = matchedCategory ? matchedCategory.name : 'Uncategorized';
  const priorityLabel = PRIORITY_CONFIG[block.priority]?.label || block.priority;

  const startTime     = minutesToTimeStr(block.startMinutes);
  const endTime       = minutesToTimeStr(block.startMinutes + block.duration);
  const isCompleted   = currentStatus === 'completed' || currentStatus === 'faster';

  const IconComp = (() => {
    const found = AVAILABLE_ICONS.find((i) => i.id === block.icon);
    return found ? found.Icon : Sparkles;
  })();

  // ── Compute Position ────────────────────────────────────────────────────────
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Horizontal: align with original card, clamp to viewport
  let posLeft = cardRect.left - 4;
  if (posLeft + CARD_WIDTH > vw - VIEWPORT_PAD) {
    posLeft = vw - CARD_WIDTH - VIEWPORT_PAD;
  }
  posLeft = Math.max(VIEWPORT_PAD, posLeft);

  // Vertical: try to start at card top, expand downward
  let posTop = cardRect.top;
  // If not enough space below, push up
  if (posTop + CARD_EST_HEIGHT > vh - VIEWPORT_PAD) {
    posTop = Math.max(HEADER_CLEARANCE, vh - CARD_EST_HEIGHT - VIEWPORT_PAD);
  }
  // Never go above the header clearance
  posTop = Math.max(HEADER_CLEARANCE, posTop);

  // ── Mount Animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── ESC to close ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true); // capture phase
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSaveNotes = useCallback(() => {
    updateScheduledBlock(block.id, { description: tempNotes });
    setIsEditingNotes(false);
  }, [block.id, tempNotes, updateScheduledBlock]);

  const handleSetReminder = useCallback((mins: number) => {
    updateScheduledBlock(block.id, { reminderMinutes: mins });
    setShowReminderMenu(false);
  }, [block.id, updateScheduledBlock]);

  const handleDelete = useCallback(() => {
    deleteScheduledBlock(block.id);
    onClose();
  }, [block.id, deleteScheduledBlock, onClose]);

  const handleMarkComplete = useCallback(() => {
    updateBlockStatus(block.id, isCompleted ? 'not_started' : 'completed');
  }, [block.id, isCompleted, updateBlockStatus]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return createPortal(
    <>
      {/* ── BACKDROP ── */}
      <div
        className="fixed inset-0 z-[9990] transition-all duration-300"
        style={{
          backgroundColor: mounted ? 'rgba(3, 6, 18, 0.55)' : 'rgba(3, 6, 18, 0)',
          backdropFilter:   mounted ? 'blur(1.5px)' : 'blur(0px)',
        }}
        onClick={onClose}
      />

      {/* ── FOCUS CARD ── */}
      <div
        ref={cardRef}
        className="fixed z-[9999]"
        style={{
          top:       `${posTop}px`,
          left:      `${posLeft}px`,
          width:     `${CARD_WIDTH}px`,
          transform: mounted ? 'scale(1) translateY(0px)' : 'scale(0.88) translateY(16px)',
          opacity:   mounted ? 1 : 0,
          transition: 'transform 280ms cubic-bezier(0.34, 1.46, 0.64, 1), opacity 200ms ease-out',
          willChange: 'transform, opacity',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card shell */}
        <div
          className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl"
          style={{
            borderTop: `3px solid ${block.color}`,
          }}
        >
          {/* ── HEADER ── */}
          <div className="relative px-5 pt-5 pb-4 border-b border-slate-800/80">
            <div className="flex items-start justify-between gap-3">
              {/* Icon + Title + Time */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="relative p-2.5 rounded-xl text-white shrink-0 mt-0.5"
                  style={{
                    backgroundColor: block.color,
                  }}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white leading-tight tracking-tight">
                    {block.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {startTime} – {endTime}
                    </span>
                    <span className="text-slate-600 text-xs">·</span>
                    <span className="text-xs text-slate-400">{formatDuration(block.duration)}</span>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0 mt-0.5"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conflict notice */}
            {isConflicting && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border bg-rose-500/10 border-rose-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-[11px] font-medium text-rose-300">Overlaps with another activity</span>
              </div>
            )}
          </div>

          {/* ── BODY ── */}
          <div className="relative px-5 py-4 space-y-4">

            {/* Tags row: category + status + reminder + goal */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Linked Goal Badge */}
              {block.goalTitle && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                  <span className="text-[#3659C9] dark:text-[#4F73E3]">Goal:</span>
                  <span className="truncate max-w-[160px]">{block.goalTitle}</span>
                </div>
              )}

              {/* Time Category */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border"
                style={{
                  color: matchedCategory ? matchedCategory.color : block.color,
                  borderColor: matchedCategory ? `${matchedCategory.color}30` : `${block.color}30`,
                  backgroundColor: matchedCategory ? `${matchedCategory.color}10` : `${block.color}10`,
                }}
              >
                <Tag className="w-3 h-3 shrink-0" />
                <span>{timeCategoryName}</span>
              </span>

              {/* Priority */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                <span>Priority: {priorityLabel}</span>
              </span>

              {/* Status — interactive */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowStatusPicker(!showStatusPicker); }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${statusCfg.bgClass}`}
              >
                <span>{statusCfg.badge}</span>
                <span>{statusCfg.label}</span>
              </button>

              {/* Log Session Reality & Replace Activity Actions */}
              <div className="w-full grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openSessionLogModal(block);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  Log Reality
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openReplaceModal(block);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                  Replace
                </button>
              </div>

              {/* Save to Activity Library (rendered only when block is not linked) */}
              {(!block.blockId || !libraryBlocks.some((l) => l.id === block.blockId)) && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowSaveLibModal(true); }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  Save to Activity Library
                </button>
              )}
            </div>

            {/* Status picker popover */}
            {showStatusPicker && (
              <div className="relative -mt-1">
                <StatusPickerPopover
                  currentStatus={currentStatus}
                  onSelectStatus={(s) => { updateBlockStatus(block.id, s); setShowStatusPicker(false); }}
                  onClose={() => setShowStatusPicker(false)}
                />
              </div>
            )}

            {/* ── Notes / Description ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Notes</span>
                {!isEditingNotes && (
                  <button
                    onClick={() => { setIsEditingNotes(true); setTempNotes(block.description || ''); }}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#3659C9] dark:text-[#4F73E3] hover:underline transition-colors"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-2.5">
                  <textarea
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    rows={4}
                    className="w-full p-2.5 rounded-lg text-xs bg-slate-800 border border-slate-700/60 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#3659C9] resize-none leading-relaxed transition-colors"
                    placeholder="Add notes, links, or preparation reminders..."
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                      style={{ backgroundColor: block.color }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-3 rounded-lg min-h-[52px] bg-slate-800/40 border border-slate-700/60 cursor-text transition-colors hover:bg-slate-800/60"
                  onClick={() => { setIsEditingNotes(true); setTempNotes(block.description || ''); }}
                >
                  {block.description ? (
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{block.description}</p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Click to add notes...</p>
                  )}
                </div>
              )}
            </div>

            {/* ── Reminder Section ── */}
            <div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowReminderMenu(!showReminderMenu); }}
                className="w-full flex items-center justify-between group"
              >
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Reminder</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                  <span>{block.reminderMinutes ? `${block.reminderMinutes} min before` : 'None'}</span>
                  {showReminderMenu
                    ? <ChevronUp className="w-3.5 h-3.5" />
                    : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {showReminderMenu && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {[5, 10, 15, 30, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => handleSetReminder(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        block.reminderMinutes === m
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                          : 'bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                  <button
                    onClick={() => handleSetReminder(0)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    None
                  </button>
                </div>
              )}
            </div>

            {/* ── AI Insight ── */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="p-1 rounded bg-emerald-500/20 shrink-0">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-400">
                  {completionProb}% completion probability
                </p>
                <p className="text-[10px] text-emerald-600/80 mt-0.5">Based on historical execution</p>
              </div>
            </div>
          </div>

          {/* ── ACTION FOOTER ── */}
          <div className="px-5 py-4 flex items-center gap-2 border-t border-slate-800/80">
            {/* Mark Complete */}
            <button
              onClick={handleMarkComplete}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-white transition-colors"
              style={{
                backgroundColor: isCompleted ? '#1E8E3E' : block.color,
              }}
            >
              <Check className="w-3.5 h-3.5" />
              {isCompleted ? 'Completed' : 'Mark Complete'}
            </button>

            {/* Reminder shortcut */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowReminderMenu(!showReminderMenu); }}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
              title="Set reminder"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <SaveBlockToLibraryModal
        isOpen={showSaveLibModal}
        block={block}
        onClose={() => setShowSaveLibModal(false)}
      />
    </>,
    document.body
  );
};
