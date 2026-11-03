/**
 * Examination Schedule Banner
 * Displays countdown to next exam, today's examination badge, and overlap warning alerts.
 */

import React, { useMemo } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { PlannerColumn, PlannerRow } from '../../types/customPlanner';
import {
  getNextExamCountdown,
  getTodayExams,
  detectExamOverlaps,
} from '../../utils/examScheduleEngine';
import { getIconComponent } from '../../utils/iconLibrary';

interface ExamBannerProps {
  rows: PlannerRow[];
  columns: PlannerColumn[];
}

export const ExamBanner: React.FC<ExamBannerProps> = ({ rows, columns }) => {
  const nextExam = useMemo(() => getNextExamCountdown(rows, columns), [rows, columns]);
  const todayExams = useMemo(() => getTodayExams(rows, columns), [rows, columns]);
  const overlaps = useMemo(() => detectExamOverlaps(rows, columns), [rows, columns]);

  if (!nextExam && todayExams.length === 0 && overlaps.length === 0) {
    return null;
  }

  const NextExamIcon = nextExam ? getIconComponent(nextExam.icon) : null;

  return (
    <div className="space-y-2.5">
      {/* ── 1. Overlapping Examination Conflict Warning ── */}
      {overlaps.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 flex items-start gap-3 shadow-xs animate-fade-in">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
              <span>Examination Schedule Conflict Detected</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-300">
                {overlaps.length} {overlaps.length === 1 ? 'Collision' : 'Collisions'}
              </span>
            </h4>
            <div className="mt-1 space-y-1">
              {overlaps.map((overlap, idx) => (
                <p key={idx} className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                  • On <strong>{overlap.date}</strong>: <strong>{overlap.firstExamTitle}</strong> ({overlap.firstExamTime}) overlaps with <strong>{overlap.secondExamTitle}</strong> ({overlap.secondExamTime}). Please check start times and durations.
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Today's Examinations Alert ── */}
      {todayExams.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Happening Today
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                {todayExams.map((ex) => (
                  <span
                    key={ex.examId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white"
                  >
                    <span>{ex.courseCode ? `${ex.courseCode} — ` : ''}{ex.subject}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">({ex.startTime})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          {todayExams[0]?.venue && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
              <MapPin size={13} />
              <span>{todayExams[0].venue}</span>
            </div>
          )}
        </div>
      )}

      {/* ── 3. Next Upcoming Exam Countdown Banner ── */}
      {nextExam && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border border-blue-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            {NextExamIcon && (
              <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                <NextExamIcon className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Next Examination
                </span>
                {nextExam.courseCode && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                    {nextExam.courseCode}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {nextExam.subject}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{nextExam.examDate}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  <span>{nextExam.startTime} - {nextExam.endTime} ({nextExam.duration}m)</span>
                </span>
                {nextExam.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{nextExam.venue}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Countdown Clock Ticker */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-center">
              <div className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <span className="text-base font-extrabold text-slate-900 dark:text-white block font-mono">
                  {nextExam.daysRemaining}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Days</span>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <span className="text-base font-extrabold text-slate-900 dark:text-white block font-mono">
                  {nextExam.hoursRemaining}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Hours</span>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <span className="text-base font-extrabold text-slate-900 dark:text-white block font-mono">
                  {nextExam.minutesRemaining}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Mins</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
