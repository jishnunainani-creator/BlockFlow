import React from 'react';
import { ScheduledBlock, CompletionStatus } from '../../types/timetable';
import { minutesToTimeStr, formatDuration } from '../../utils/timeUtils';
import {
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Edit2,
  Trash2,
  AlertCircle,
  Target,
  Sparkles,
  Calendar,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface DailyScheduleListProps {
  blocks: ScheduledBlock[];
  selectedDate: Date;
  onToggleStatus: (blockId: string, currentStatus?: CompletionStatus) => void;
  onEditBlock: (block: ScheduledBlock) => void;
  onStartFocus?: (block: ScheduledBlock) => void;
  onOpenAddBlock: () => void;
  onNavigateToCalendar?: () => void;
}

export const DailyScheduleList: React.FC<DailyScheduleListProps> = ({
  blocks,
  selectedDate,
  onToggleStatus,
  onEditBlock,
  onStartFocus,
  onOpenAddBlock,
  onNavigateToCalendar,
}) => {
  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const selectedYMD = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const isToday = selectedYMD === todayYMD;
  const isPast = selectedYMD < todayYMD;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Sort blocks chronologically
  const sortedBlocks = [...blocks].sort((a, b) => a.startMinutes - b.startMinutes);

  // Helper to determine accurate visual state
  const getBlockState = (
    b: ScheduledBlock
  ): 'completed' | 'in_progress' | 'missed' | 'upcoming' => {
    if (b.status === 'completed' || b.status === 'faster') {
      return 'completed';
    }
    if (b.status === 'in_progress') {
      return 'in_progress';
    }
    if (isToday) {
      if (nowMinutes >= b.startMinutes && nowMinutes < b.startMinutes + b.duration) {
        return 'in_progress';
      }
      if (nowMinutes >= b.startMinutes + b.duration) {
        return 'missed';
      }
      return 'upcoming';
    }
    if (isPast) {
      return 'missed';
    }
    return 'upcoming';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Schedule & Blocks
          </h2>
          <span className="text-xs text-slate-500 font-medium">({sortedBlocks.length})</span>
        </div>

        <button
          type="button"
          onClick={onOpenAddBlock}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Block</span>
        </button>
      </div>

      {sortedBlocks.length === 0 ? (
        /* Empty State */
        <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No blocks scheduled for this day
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Plan your activities in advance or schedule a block now.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenAddBlock}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Add First Block
            </button>
            {onNavigateToCalendar && (
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Open Full Timetable
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Chronological Blocks List */
        <div className="space-y-2.5">
          {sortedBlocks.map((block) => {
            const state = getBlockState(block);
            const startTime = minutesToTimeStr(block.startMinutes);
            const endTime = minutesToTimeStr(block.startMinutes + block.duration);

            return (
              <div
                key={block.id}
                onClick={() => onEditBlock(block)}
                className={`group relative flex items-start justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                  state === 'in_progress'
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 shadow-xs'
                    : state === 'completed'
                    ? 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 opacity-80'
                    : state === 'missed'
                    ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-900/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                {/* Left Accent Color Strip */}
                <div
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
                  style={{ backgroundColor: block.color || '#3B82F6' }}
                  aria-hidden="true"
                />

                <div className="flex items-start gap-3 min-w-0 flex-1 pl-1">
                  {/* Completion Toggle Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(block.id, block.status);
                    }}
                    title={
                      state === 'completed'
                        ? 'Mark uncompleted'
                        : 'Mark completed'
                    }
                    aria-label={`Mark ${block.title} completed`}
                    className={`mt-0.5 p-1 rounded-md transition-colors shrink-0 ${
                      state === 'completed'
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                    }`}
                  >
                    {state === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 fill-current" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {/* Main Block Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-sm font-semibold tracking-tight truncate ${
                          state === 'completed'
                            ? 'line-through text-slate-500 dark:text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {block.title}
                      </h3>

                      {/* State Badge */}
                      {state === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                          In Progress
                        </span>
                      )}

                      {state === 'missed' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                          Missed
                        </span>
                      )}

                      {state === 'completed' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          Completed
                        </span>
                      )}
                    </div>

                    {/* Description if present */}
                    {block.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {block.description}
                      </p>
                    )}

                    {/* Metadata Row: Time, Duration, Linked Goal */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {startTime} – {endTime}
                      </span>
                      <span>·</span>
                      <span>{formatDuration(block.duration)}</span>

                      {block.priority && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{block.priority}</span>
                        </>
                      )}

                      {block.goalTitle && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/40">
                            <Target className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">{block.goalTitle}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  {onStartFocus && state !== 'completed' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartFocus(block);
                      }}
                      title="Start Focus Session on this block"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBlock(block);
                    }}
                    title="Edit block"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
