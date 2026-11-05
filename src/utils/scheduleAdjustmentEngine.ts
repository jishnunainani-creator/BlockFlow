import { ScheduledBlock } from '../types/timetable';
import { ExecutionSession } from '../types/sessionLog';
import { loadExecutionSessions } from './sessionStorage';
import { loadFocusHistory, FocusSessionLog } from './focusStorage';

export interface AffectedScheduleBlock {
  id: string;
  title: string;
  currentStartMinutes: number;
  proposedStartMinutes: number;
  duration: number;
}

export interface ScheduleAdjustmentRecommendation {
  overrunBlockId: string;
  overrunBlockTitle: string;
  plannedMinutes: number;
  actualMinutes: number;
  overrunMinutes: number;
  affectedBlocks: AffectedScheduleBlock[];
  explanation: string;
  recommendedShiftMinutes: number;
}

export interface DetectAdjustmentParams {
  todayBlocks: ScheduledBlock[];
  executionSessions?: ExecutionSession[];
  focusLogs?: FocusSessionLog[];
  currentMinutes?: number;
}

/**
 * Pure, deterministic engine to detect schedule adjustments based STRICTLY on real execution evidence.
 * Returns null if no actual overrun occurred or if no subsequent blocks require adjustment.
 * Never invents activities, standups, or arbitrary delays.
 */
export function detectScheduleAdjustment(
  params: DetectAdjustmentParams
): ScheduleAdjustmentRecommendation | null {
  const { todayBlocks, executionSessions, focusLogs } = params;

  if (!Array.isArray(todayBlocks) || todayBlocks.length < 2) {
    return null;
  }

  // Load execution evidence if not passed
  const sessions = executionSessions ?? loadExecutionSessions();
  const logs = focusLogs ?? loadFocusHistory();

  // Sort blocks chronologically by start time
  const sorted = [...todayBlocks].sort((a, b) => a.startMinutes - b.startMinutes);

  for (let i = 0; i < sorted.length; i++) {
    const block = sorted[i];

    // Find verified execution records for this specific block
    let actualMinutes: number | null = null;

    if (typeof block.actualDuration === 'number' && block.actualDuration > 0) {
      actualMinutes = block.actualDuration;
    } else {
      // Check linked session log
      const linkedSession = sessions.find(
        (s) =>
          s.scheduledBlockId === block.id ||
          (s.plannedTitle.toLowerCase() === block.title.toLowerCase() &&
            s.plannedStartMinutes === block.startMinutes)
      );
      if (linkedSession && linkedSession.actualDuration > 0) {
        actualMinutes = linkedSession.actualDuration;
      } else {
        // Check linked focus log
        const linkedFocus = logs.find((l) => l.blockId === block.id);
        if (linkedFocus && linkedFocus.actualMinutes > 0) {
          actualMinutes = linkedFocus.actualMinutes;
        }
      }
    }

    // Only consider genuine overruns where actual > planned by at least 5 minutes
    if (actualMinutes !== null && actualMinutes > block.duration + 4) {
      const overrunMinutes = actualMinutes - block.duration;
      const actualEndMinutes = block.startMinutes + actualMinutes;

      // Find subsequent uncompleted blocks that collide or need adjustment
      const subsequentBlocks = sorted.slice(i + 1).filter(
        (b) => b.status !== 'completed' && b.status !== 'faster'
      );

      if (subsequentBlocks.length === 0) {
        continue;
      }

      const nextBlock = subsequentBlocks[0];

      // If the actual end time overlaps with the next block's planned start
      if (actualEndMinutes > nextBlock.startMinutes) {
        const overlap = actualEndMinutes - nextBlock.startMinutes;
        // Round up to 15-minute timetable intervals
        const recommendedShiftMinutes = Math.max(15, Math.ceil(overlap / 15) * 15);

        const affectedBlocks: AffectedScheduleBlock[] = subsequentBlocks.map((b) => ({
          id: b.id,
          title: b.title,
          currentStartMinutes: b.startMinutes,
          proposedStartMinutes: b.startMinutes + recommendedShiftMinutes,
          duration: b.duration,
        }));

        return {
          overrunBlockId: block.id,
          overrunBlockTitle: block.title,
          plannedMinutes: block.duration,
          actualMinutes,
          overrunMinutes,
          recommendedShiftMinutes,
          affectedBlocks,
          explanation: `"${block.title}" ran ${overrunMinutes}m longer than planned. Recommended: shift "${nextBlock.title}" and subsequent blocks by ${recommendedShiftMinutes} minutes to avoid schedule collision.`,
        };
      }
    }
  }

  return null;
}
