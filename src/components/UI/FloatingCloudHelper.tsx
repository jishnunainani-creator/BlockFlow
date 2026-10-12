import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useDemo } from '../../context/DemoContext';
import { Resolution } from '../../types/timetable';
import {
  Cloud,
  Sparkles,
  Plus,
  Mic,
  Clock,
  HelpCircle,
  X,
  Compass,
  Check,
  CalendarCheck,
  ChevronRight,
} from 'lucide-react';

interface FloatingCloudHelperProps {
  onOpenNewBlock?: () => void;
  onOpenAISchedule?: (tab: 'voice' | 'text' | 'import') => void;
  onOpenGuidedTour?: () => void;
}

export const FloatingCloudHelper: React.FC<FloatingCloudHelperProps> = ({
  onOpenNewBlock,
  onOpenAISchedule,
  onOpenGuidedTour,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [freeSlotInfo, setFreeSlotInfo] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { currentWeekScheduledBlocks, resolution, setResolution } = useTimetable();
  const { startTour } = useDemo();

  // Close on Escape or click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Compute next free slot for today (dayOfWeek 0 = Monday ... 6 = Sunday)
  const todayDayOfWeek = useMemo(() => {
    const jsDay = new Date().getDay(); // 0 is Sun, 1 is Mon...
    return jsDay === 0 ? 6 : jsDay - 1; // Map to 0=Mon ... 6=Sun
  }, []);

  const handleFindFreeSlot = () => {
    const todayBlocks = (currentWeekScheduledBlocks || [])
      .filter((b) => b.dayOfWeek === todayDayOfWeek)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    // Look for a gap >= 60 mins between 08:00 (480) and 21:00 (1260)
    let currentPointer = 480;
    let foundSlot: { start: number; end: number } | null = null;

    for (const block of todayBlocks) {
      const blockEnd = block.startMinutes + block.duration;
      if (block.startMinutes > currentPointer && block.startMinutes - currentPointer >= 45) {
        foundSlot = { start: currentPointer, end: block.startMinutes };
        break;
      }
      currentPointer = Math.max(currentPointer, blockEnd);
    }

    if (!foundSlot && currentPointer < 1260 && 1260 - currentPointer >= 45) {
      foundSlot = { start: currentPointer, end: Math.min(currentPointer + 90, 1260) };
    }

    if (foundSlot) {
      const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
      };
      const duration = foundSlot.end - foundSlot.start;
      setFreeSlotInfo(`${formatTime(foundSlot.start)} – ${formatTime(foundSlot.end)} (${duration}m free)`);
    } else {
      setFreeSlotInfo('Today is fully booked! Great day of execution.');
    }
  };

  const handleTourTrigger = () => {
    setIsOpen(false);
    if (onOpenGuidedTour) {
      onOpenGuidedTour();
    } else {
      startTour();
    }
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-30 select-none">
      {/* ── EXPANDED ASSISTANT PANEL ── */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="BlockFlow Assistant"
          className="absolute bottom-14 right-0 w-[310px] sm:w-[350px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md p-4 space-y-3.5 z-40 animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#3659C9]/20 text-[#3659C9] dark:text-[#7394F7] flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4 fill-current/30" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  BlockFlow Assistant
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Quick actions & helpers</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Assistant"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action List */}
          <div className="space-y-1.5">
            {/* Action 1: Create a Block */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (onOpenNewBlock) onOpenNewBlock();
                else if (onOpenAISchedule) onOpenAISchedule('text');
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-slate-700 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#3659C9]/15 text-[#3659C9] dark:text-[#7394F7] flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    Create New Block
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Schedule a focused activity</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
            </button>

            {/* Action 2: Voice / AI Schedule */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (onOpenAISchedule) onOpenAISchedule('voice');
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-slate-700 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    Smart AI Schedule
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Voice or text natural language input</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
            </button>

            {/* Action 3: Find Free Slot */}
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200 truncate">Find Free Slot</div>
                    <div className="text-[10px] text-slate-400 truncate">Scan for openings today</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFindFreeSlot}
                  className="px-2 py-1 text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors shrink-0"
                >
                  Scan
                </button>
              </div>

              {freeSlotInfo && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-medium text-emerald-300 animate-fade-in flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate">{freeSlotInfo}</span>
                </div>
              )}
            </div>

            {/* Action 4: Quick Resolution Selector */}
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750 text-left space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Grid Resolution</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {resolution === 60 ? '1 hr' : resolution === 120 ? '2 hr' : `${resolution}m`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 pt-0.5">
                {[15, 30, 60, 120].map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res as Resolution)}
                    className={`py-1 rounded-md text-[10px] font-medium transition-colors ${
                      resolution === res
                        ? 'bg-[#3659C9] text-white font-semibold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {res === 60 ? '1h' : res === 120 ? '2h' : `${res}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Action 5: Guided Tour */}
            <button
              onClick={handleTourTrigger}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-slate-700 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    Guided Tour
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Learn features step-by-step</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
            </button>
          </div>

          {/* Footer note & dismiss */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Tip: Press G then C for Calendar</span>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
              title="Hide assistant until next refresh"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING CLOUD BUTTON ── */}
      <div className="relative group">
        {/* Tooltip on hover/focus */}
        <div
          role="tooltip"
          className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-200 whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200"
        >
          Need a hand?
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 border-t border-r border-slate-700/80 rotate-45" />
        </div>

        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Open BlockFlow Assistant"
          className="animate-float-soft flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-750 hover:border-slate-600 shadow-xl shadow-black/25 backdrop-blur-md transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3659C9]"
        >
          <div className="relative flex items-center justify-center">
            <Cloud className="w-4 h-4 text-[#3659C9] dark:text-[#7394F7] fill-current/25" />
            <Sparkles className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="text-xs font-medium tracking-tight">Assistant</span>
        </button>
      </div>
    </div>
  );
};
