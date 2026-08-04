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
          className="relative overflow-hidden rounded-[28px]"
          style={{
            background: `linear-gradient(160deg, #0d1120 0%, #080d1a 100%)`,
            border:     `1px solid rgba(255,255,255,0.08)`,
            borderTop:  `3px solid ${block.color}`,
            boxShadow:  `0 32px 80px rgba(0,0,0,0.7), 0 8px 32px ${block.color}18, 0 0 0 1px rgba(255,255,255,0.04)`,
          }}
        >
          {/* Color glow at top-right corner */}
          <div
            className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top right, ${block.color}12 0%, transparent 70%)`,
            }}
          />

          {/* ── HEADER ── */}
          <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-start justify-between gap-3">
              {/* Icon + Title + Time */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="relative p-2.5 rounded-2xl text-white shrink-0 mt-0.5"
                  style={{
                    backgroundColor: block.color,
                    boxShadow: `0 6px 20px ${block.color}50`,
                  }}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-bold text-white leading-tight tracking-tight">
                    {block.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-[12px] font-mono text-slate-400 tabular-nums">
                      {startTime} – {endTime}
                    </span>
                    <span className="text-slate-700 text-[12px]">·</span>
                    <span className="text-[12px] text-slate-500">{formatDuration(block.duration)}</span>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/8 transition-all shrink-0 mt-0.5"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conflict notice */}
            {isConflicting && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}
              >
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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-sm">
                  <span className="text-purple-400">🎯 Goal:</span>
                  <span className="truncate max-w-[160px]">{block.goalTitle}</span>
                </div>
              )}

              {/* Time Category */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border"
                style={{
                  color: matchedCategory ? matchedCategory.color : block.color,
                  borderColor: matchedCategory ? `${matchedCategory.color}30` : `${block.color}30`,
                  backgroundColor: matchedCategory ? `${matchedCategory.color}10` : `${block.color}10`,
                }}
              >
                <Tag className="w-3 h-3 shrink-0" />
                <span>Category: {timeCategoryName}</span>
              </span>

              {/* Priority */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                <span>Priority: {priorityLabel}</span>
              </span>

              {/* Status — interactive */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowStatusPicker(!showStatusPicker); }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 ${statusCfg.bgClass}`}
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
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-bold bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition-all shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Log Reality
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openReplaceModal(block);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-bold bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 border border-pink-500/20 transition-all shadow-sm"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Replace
                </button>
              </div>

              {/* Save to Activity Library (rendered only when block is not linked) */}
              {(!block.blockId || !libraryBlocks.some((l) => l.id === block.blockId)) && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowSaveLibModal(true); }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[11px] font-bold bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
                >
                  <Bookmark className="w-3.5 h-3.5" />
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
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Notes</span>
                {!isEditingNotes && (
                  <button
                    onClick={() => { setIsEditingNotes(true); setTempNotes(block.description || ''); }}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
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
                    className="w-full p-3 rounded-2xl text-[12px] text-white placeholder-slate-600 focus:outline-none resize-none leading-relaxed transition-colors"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border:          '1px solid rgba(255,255,255,0.10)',
                      outlineColor:    block.color,
                    }}
                    onFocus={(e) => { e.target.style.borderColor = `${block.color}50`; }}
                    onBlur={(e)  => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                    placeholder="Add notes, links, or preparation reminders..."
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-300 transition-colors"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white transition-colors"
                      style={{ backgroundColor: block.color }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-3 rounded-2xl min-h-[56px] cursor-text transition-colors hover:bg-white/[0.03]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => { setIsEditingNotes(true); setTempNotes(block.description || ''); }}
                >
                  {block.description ? (
                    <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap">{block.description}</p>
                  ) : (
                    <p className="text-[12px] text-slate-600 italic">Click to add notes...</p>
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
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Reminder</span>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                  <span>{block.reminderMinutes ? `${block.reminderMinutes} min before` : 'None'}</span>
                  {showReminderMenu
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />}
                </div>
              </button>

              {showReminderMenu && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {[5, 10, 15, 30, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => handleSetReminder(m)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 ${
                        block.reminderMinutes === m
                          ? 'text-amber-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      style={{
                        backgroundColor: block.reminderMinutes === m ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)',
                        border:          block.reminderMinutes === m ? '1px solid rgba(245,158,11,0.30)' : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {m}m
                    </button>
                  ))}
                  <button
                    onClick={() => handleSetReminder(0)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    None
                  </button>
                </div>
              )}
            </div>

            {/* ── AI Insight ── */}
            <div
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl"
              style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)' }}
            >
              <div className="p-1.5 rounded-xl shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-emerald-400">
                  {completionProb}% completion probability
                </p>
                <p className="text-[10px] text-emerald-600/80 mt-0.5">Based on your historical execution patterns</p>
              </div>
            </div>
          </div>

          {/* ── ACTION FOOTER ── */}
          <div
            className="px-5 py-4 flex items-center gap-2.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Mark Complete */}
            <button
              onClick={handleMarkComplete}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: isCompleted ? 'rgba(16,185,129,0.15)' : block.color,
                border:           isCompleted ? '1px solid rgba(16,185,129,0.25)' : 'none',
                color:            isCompleted ? '#6EE7B7' : '#fff',
                boxShadow:        isCompleted ? 'none' : `0 4px 16px ${block.color}35`,
              }}
            >
              <Check className="w-3.5 h-3.5" />
              {isCompleted ? '✓ Completed' : 'Mark Complete'}
            </button>

            {/* Reminder shortcut */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowReminderMenu(!showReminderMenu); }}
              className="p-2.5 rounded-2xl transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: block.reminderMinutes ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                border:           block.reminderMinutes ? '1px solid rgba(245,158,11,0.22)' : '1px solid rgba(255,255,255,0.08)',
                color:            block.reminderMinutes ? '#FBBF24' : '#64748B',
              }}
              title="Set reminder"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-2xl transition-all hover:scale-110 active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748B' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.12)';
                (e.currentTarget as HTMLButtonElement).style.borderColor     = 'rgba(239,68,68,0.22)';
                (e.currentTarget as HTMLButtonElement).style.color           = '#F87171';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLButtonElement).style.borderColor     = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLButtonElement).style.color           = '#64748B';
              }}
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
