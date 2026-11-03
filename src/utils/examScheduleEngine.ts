/**
 * Examination Schedule Engine
 * Provides specialized calculation, chronological sorting, countdown timers,
 * today's examination indicators, and time-overlap collision detection.
 */

import {
  PlannerColumn,
  PlannerRow,
  ExamCountdownInfo,
  ExamOverlapConflict,
} from '../types/customPlanner';

/**
 * Calculates an end time in "HH:mm" from a start time "HH:mm" and duration in minutes.
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime || typeof durationMinutes !== 'number' || durationMinutes <= 0) {
    return startTime || '';
  }

  const [hStr, mStr] = startTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  if (isNaN(h) || isNaN(m)) return startTime;

  const totalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;

  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/**
 * Extracts normalized exam details from a generic PlannerRow.
 */
function extractRowExamDetails(row: PlannerRow, columns: PlannerColumn[]) {
  const getVal = (type: string, nameFragment: string) => {
    const col = columns.find(
      (c) => c.type === type && c.name.toLowerCase().includes(nameFragment.toLowerCase())
    ) || columns.find((c) => c.id.toLowerCase().includes(nameFragment.toLowerCase()));
    return col ? row.values[col.id] : undefined;
  };

  const subject = getVal('text', 'subject') || getVal('text', 'title') || getVal('text', 'course') || 'Untitled Exam';
  const courseCode = getVal('text', 'code') || '';
  const icon = getVal('icon', 'icon') || 'GraduationCap';
  const examDate = getVal('date', 'date') || '';
  const startTime = getVal('time', 'start') || '09:00';
  const duration = Number(getVal('number', 'duration')) || 120;
  let endTime = getVal('time', 'end');
  if (!endTime && startTime) {
    endTime = calculateEndTime(startTime, duration);
  }
  const venue = getVal('text', 'venue') || getVal('text', 'hall') || getVal('text', 'room') || '';
  const status = getVal('status', 'status') || 'not_started';

  return {
    examId: row.id,
    subject: String(subject),
    courseCode: String(courseCode),
    icon: String(icon),
    examDate: String(examDate),
    startTime: String(startTime),
    endTime: String(endTime || ''),
    duration,
    venue: String(venue),
    status: String(status),
  };
}

/**
 * Sorts examination rows chronologically by date and start time.
 */
export function sortExamRows(rows: PlannerRow[], columns: PlannerColumn[], direction: 'asc' | 'desc' = 'asc'): PlannerRow[] {
  return [...rows].sort((a, b) => {
    const aDetails = extractRowExamDetails(a, columns);
    const bDetails = extractRowExamDetails(b, columns);

    const aKey = `${aDetails.examDate || '9999-99-99'} ${aDetails.startTime || '00:00'}`;
    const bKey = `${bDetails.examDate || '9999-99-99'} ${bDetails.startTime || '00:00'}`;

    const comp = aKey.localeCompare(bKey);
    return direction === 'asc' ? comp : -comp;
  });
}

export const sortExamsChronologically = sortExamRows;

/**
 * Calculates countdown information for all exams with a valid date.
 */
export function getExamCountdowns(
  rows: PlannerRow[],
  columns: PlannerColumn[],
  referenceNow: Date = new Date()
): ExamCountdownInfo[] {
  const todayStr = referenceNow.toISOString().split('T')[0];

  return rows
    .map((row) => {
      const details = extractRowExamDetails(row, columns);
      if (!details.examDate) return null;

      const [y, m, d] = details.examDate.split('-').map(Number);
      const [startH, startM] = (details.startTime || '09:00').split(':').map(Number);

      if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

      const examDateTime = new Date(y, m - 1, d, startH || 0, startM || 0, 0, 0);
      const diffMs = examDateTime.getTime() - referenceNow.getTime();

      const totalMins = Math.floor(Math.abs(diffMs) / (1000 * 60));
      const daysRemaining = Math.floor(totalMins / (24 * 60));
      const hoursRemaining = Math.floor((totalMins % (24 * 60)) / 60);
      const minutesRemaining = totalMins % 60;

      const isToday = details.examDate === todayStr;
      const isPast = diffMs < 0 && !isToday;

      return {
        ...details,
        daysRemaining: diffMs > 0 ? daysRemaining : 0,
        hoursRemaining: diffMs > 0 ? hoursRemaining : 0,
        minutesRemaining: diffMs > 0 ? minutesRemaining : 0,
        isToday,
        isPast,
        rawDiffMs: diffMs,
      };
    })
    .filter((info): info is ExamCountdownInfo => info !== null);
}

/**
 * Gets the single next upcoming examination countdown.
 */
export function getNextExamCountdown(
  rows: PlannerRow[],
  columns: PlannerColumn[],
  referenceNow: Date = new Date()
): ExamCountdownInfo | null {
  const countdowns = getExamCountdowns(rows, columns, referenceNow);
  const upcoming = countdowns
    .filter((c) => c.rawDiffMs >= 0)
    .sort((a, b) => a.rawDiffMs - b.rawDiffMs);

  return upcoming[0] || null;
}

/**
 * Gets examinations scheduled for today.
 */
export function getTodayExams(
  rows: PlannerRow[],
  columns: PlannerColumn[],
  referenceNow: Date = new Date()
): ExamCountdownInfo[] {
  const countdowns = getExamCountdowns(rows, columns, referenceNow);
  return countdowns.filter((c) => c.isToday);
}

/**
 * Converts "HH:mm" time string into total minutes since midnight.
 */
function timeStrToMins(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Detects overlapping examination times on the same date.
 * Returns an array of detected conflicts with human-readable labels.
 */
export function detectExamOverlaps(
  rows: PlannerRow[],
  columns: PlannerColumn[]
): ExamOverlapConflict[] {
  const conflicts: ExamOverlapConflict[] = [];

  // Group exams by date
  const byDate: Record<string, ReturnType<typeof extractRowExamDetails>[]> = {};

  for (const row of rows) {
    const details = extractRowExamDetails(row, columns);
    if (!details.examDate || !details.startTime) continue;

    if (!byDate[details.examDate]) {
      byDate[details.examDate] = [];
    }
    byDate[details.examDate].push(details);
  }

  // Check pairs within each date
  for (const [date, exams] of Object.entries(byDate)) {
    if (exams.length < 2) continue;

    for (let i = 0; i < exams.length; i++) {
      for (let j = i + 1; j < exams.length; j++) {
        const e1 = exams[i];
        const e2 = exams[j];

        const start1 = timeStrToMins(e1.startTime);
        const end1 = timeStrToMins(e1.endTime || calculateEndTime(e1.startTime, e1.duration));

        const start2 = timeStrToMins(e2.startTime);
        const end2 = timeStrToMins(e2.endTime || calculateEndTime(e2.startTime, e2.duration));

        // Overlap condition: start1 < end2 && start2 < end1
        if (start1 < end2 && start2 < end1) {
          conflicts.push({
            date,
            firstExamId: e1.examId,
            firstExamTitle: e1.courseCode ? `${e1.courseCode} — ${e1.subject}` : e1.subject,
            firstExamTime: `${e1.startTime} - ${e1.endTime}`,
            secondExamId: e2.examId,
            secondExamTitle: e2.courseCode ? `${e2.courseCode} — ${e2.subject}` : e2.subject,
            secondExamTime: `${e2.startTime} - ${e2.endTime}`,
          });
        }
      }
    }
  }

  return conflicts;
}
