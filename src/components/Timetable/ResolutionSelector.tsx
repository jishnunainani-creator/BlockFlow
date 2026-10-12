import React, { useState, useRef, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Resolution } from '../../types/timetable';
import { Clock, ChevronDown, Check } from 'lucide-react';

interface ResolutionSelectorProps {
  className?: string;
  forceCompact?: boolean;
}

export const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  className = '',
  forceCompact = false,
}) => {
  const { resolution, setResolution } = useTimetable();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { value: Resolution; label: string; shortLabel: string }[] = [
    { value: 120, label: '2 hr', shortLabel: '2h' },
    { value: 60, label: '1 hr', shortLabel: '1h' },
    { value: 45, label: '45 mins', shortLabel: '45m' },
    { value: 30, label: '30 mins', shortLabel: '30m' },
    { value: 15, label: '15 mins', shortLabel: '15m' },
  ];

  const currentOption = options.find((o) => o.value === resolution) || options[3];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* ── Wide Screen (≥ 1440px): Segmented Control ── */}
      {!forceCompact && (
        <div className="hidden 2xl:flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 p-0.5 rounded-lg">
          <div className="flex items-center gap-1 pl-1.5 pr-0.5 text-slate-400 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Grid:</span>
          </div>
          <div className="flex items-center gap-0.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResolution(opt.value)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  resolution === opt.value
                    ? 'bg-[#3659C9] dark:bg-[#4F73E3] text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                title={`Set grid interval to ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Compact Screen (< 1440px or forceCompact): Dropdown Button ── */}
      <div className={!forceCompact ? '2xl:hidden' : ''}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
            isOpen
              ? 'bg-slate-200 dark:bg-slate-700/80 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
          title={`Grid interval: ${currentOption.label}`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Grid:</span>
          <span className="font-mono text-xs font-semibold">{currentOption.shortLabel}</span>
          <ChevronDown className={`w-3 h-3 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg shadow-xl z-50 p-1 animate-fade-in">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-0.5">
              Grid Interval
            </div>
            {options.map((opt) => {
              const isSelected = resolution === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setResolution(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#3659C9]/15 dark:bg-[#3659C9]/20 text-[#3659C9] dark:text-[#7394F7] font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#3659C9] dark:text-[#7394F7]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
