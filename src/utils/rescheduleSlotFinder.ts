import { ScheduledBlock } from '../types/timetable';
import { DAYS_OF_WEEK, formatMinutesToTimeString } from './timeUtils';

export interface RescheduleSlotCandidate {
  dateLabel: string; // e.g. "Today", "Tomorrow", "Thursday"
  dayOfWeek: number;
  startMinutes: number;
  duration: number;
  timeRangeStr: string;
  isRecommended?: boolean;
}

export function findAvailableSlotsForReschedule(
  durationMinutes: number,
  existingBlocks: ScheduledBlock[],
  maxCandidates: number = 3
): RescheduleSlotCandidate[] {
  const currentDayOfWeek = (new Date().getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
  const candidates: RescheduleSlotCandidate[] = [];

  // Candidate start times to test: 8:00 PM (1200), 4:00 PM (960), 3:30 PM (930), 10:00 AM (600), 2:00 PM (840), 7:00 PM (1140)
  const candidateTimes = [1200, 960, 930, 600, 840, 1140];

  for (let offset = 0; offset < 7; offset++) {
    const day = (currentDayOfWeek + offset) % 7;
    const dayBlocks = existingBlocks.filter((b) => b.dayOfWeek === day);

    let dateLabel = 'Today';
    if (offset === 1) dateLabel = 'Tomorrow';
    else if (offset > 1) dateLabel = DAYS_OF_WEEK[day]?.full || `Day ${day + 1}`;

    for (const start of candidateTimes) {
      const end = start + durationMinutes;

      // Check collision with any existing block
      const collides = dayBlocks.some((b) => {
        const bEnd = b.startMinutes + b.duration;
        return Math.max(b.startMinutes, start) < Math.min(bEnd, end);
      });

      if (!collides) {
        const timeRangeStr = `${formatMinutesToTimeString(start)} – ${formatMinutesToTimeString(end)}`;
        candidates.push({
          dateLabel,
          dayOfWeek: day,
          startMinutes: start,
          duration: durationMinutes,
          timeRangeStr,
          isRecommended: candidates.length === 1, // Second slot (Tomorrow) recommended by default
        });

        if (candidates.length >= maxCandidates) return candidates;
        break; // Found one good slot for this day, test next day
      }
    }
  }

  return candidates;
}
