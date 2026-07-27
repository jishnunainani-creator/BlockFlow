import { ScheduledBlock, ConflictInfo } from '../types/timetable';
import { minutesToTimeStr } from './timeUtils';

export function detectConflicts(scheduledBlocks: ScheduledBlock[]): Map<string, ConflictInfo> {
  const conflictMap = new Map<string, ConflictInfo>();

  // Group blocks by day of week
  const dayGroups: Record<number, ScheduledBlock[]> = {};
  for (const block of scheduledBlocks) {
    if (!dayGroups[block.dayOfWeek]) {
      dayGroups[block.dayOfWeek] = [];
    }
    dayGroups[block.dayOfWeek].push(block);
  }

  // Check overlaps per day
  for (const dayStr in dayGroups) {
    const dayOfWeek = parseInt(dayStr, 10);
    const blocks = dayGroups[dayOfWeek];

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i];
        const b = blocks[j];

        const aStart = a.startMinutes;
        const aEnd = a.startMinutes + a.duration;
        const bStart = b.startMinutes;
        const bEnd = b.startMinutes + b.duration;

        // Overlap logic
        if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
          // Block A conflict
          const existingA = conflictMap.get(a.id) || {
            blockId: a.id,
            overlappingBlockIds: [],
            dayOfWeek,
            message: '',
          };
          if (!existingA.overlappingBlockIds.includes(b.id)) {
            existingA.overlappingBlockIds.push(b.id);
          }
          existingA.message = `Overlaps with "${b.title}" (${minutesToTimeStr(bStart)}–${minutesToTimeStr(bEnd)})`;
          conflictMap.set(a.id, existingA);

          // Block B conflict
          const existingB = conflictMap.get(b.id) || {
            blockId: b.id,
            overlappingBlockIds: [],
            dayOfWeek,
            message: '',
          };
          if (!existingB.overlappingBlockIds.includes(a.id)) {
            existingB.overlappingBlockIds.push(a.id);
          }
          existingB.message = `Overlaps with "${a.title}" (${minutesToTimeStr(aStart)}–${minutesToTimeStr(aEnd)})`;
          conflictMap.set(b.id, existingB);
        }
      }
    }
  }

  return conflictMap;
}

export function suggestFreeTimeSlots(
  dayOfWeek: number,
  duration: number,
  scheduledBlocks: ScheduledBlock[],
  startHour: number = 6,
  endHour: number = 23,
  resolution: number = 30
): { startMinutes: number; timeStr: string }[] {
  const suggestions: { startMinutes: number; timeStr: string }[] = [];
  const dayBlocks = scheduledBlocks.filter((b) => b.dayOfWeek === dayOfWeek);

  const startLimit = startHour * 60;
  const endLimit = endHour * 60;

  for (let start = startLimit; start + duration <= endLimit; start += resolution) {
    const candidateEnd = start + duration;
    let hasOverlap = false;

    for (const b of dayBlocks) {
      const bStart = b.startMinutes;
      const bEnd = b.startMinutes + b.duration;
      if (Math.max(start, bStart) < Math.min(candidateEnd, bEnd)) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      suggestions.push({
        startMinutes: start,
        timeStr: `${minutesToTimeStr(start)} – ${minutesToTimeStr(candidateEnd)}`,
      });
      if (suggestions.length >= 4) break; // Suggest top 4 free slots
    }
  }

  return suggestions;
}
