import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  selectTodayBlocks,
  isBlockSpanningMidnight,
  getBlockInterval,
  selectWeeklyPlannedDuration,
  selectBlockCounts,
  selectCanonicalGoalProgress,
  selectAggregateGoalProgress,
  selectCanonicalExecutionScore,
  selectFocusDuration,
} from './dataSelectors.ts';
import { ScheduledBlock, Goal } from '../types/timetable.ts';
import { getISOWeekString } from './timeUtils.ts';

describe('PHASE 2: Data Selectors — One Source of Truth', () => {
  const refDate = new Date('2026-11-04T10:00:00Z'); // A Wednesday in 2026 (dayOfWeek: 2)
  const refWeekId = getISOWeekString(refDate);

  const mockBlocks: ScheduledBlock[] = [
    {
      id: 'b-wed-morning',
      blockId: 'lib-1',
      title: 'Algorithms Lecture',
      color: '#3B82F6',
      priority: 'high',
      icon: 'code',
      dayOfWeek: 2, // Wednesday
      startMinutes: 540, // 09:00
      duration: 90, // until 10:30
      weekId: refWeekId,
      status: 'completed',
      actualDuration: 90,
    },
    {
      id: 'b-wed-afternoon',
      blockId: 'lib-2',
      title: 'Lab Session',
      color: '#10B981',
      priority: 'medium',
      icon: 'flask',
      dayOfWeek: 2, // Wednesday
      startMinutes: 840, // 14:00
      duration: 120, // until 16:00
      weekId: refWeekId,
      status: 'not_started',
    },
    {
      id: 'b-wed-night-cross-midnight',
      blockId: 'lib-3',
      title: 'Hackathon Midnight Sprint',
      color: '#8B5CF6',
      priority: 'high',
      icon: 'sparkles',
      dayOfWeek: 2, // Wednesday
      startMinutes: 1380, // 23:00
      duration: 120, // until 01:00 next day (spans midnight)
      weekId: refWeekId,
      status: 'in_progress',
    },
    {
      id: 'b-thu-session',
      blockId: 'lib-4',
      title: 'Thursday Morning Class',
      color: '#EF4444',
      priority: 'medium',
      icon: 'book',
      dayOfWeek: 3, // Thursday
      startMinutes: 600,
      duration: 60,
      weekId: refWeekId,
      status: 'not_started',
    },
    {
      id: 'b-next-week-wed',
      blockId: 'lib-5',
      title: 'Future Week Lecture',
      color: '#3B82F6',
      priority: 'high',
      icon: 'code',
      dayOfWeek: 2,
      startMinutes: 540,
      duration: 90,
      weekId: '2026-W46', // Different week
      status: 'not_started',
    },
  ];

  describe('1. selectTodayBlocks Consistency & Midnight Handling', () => {
    test('filters strictly for current ISO week and day of week', () => {
      const todayBlocks = selectTodayBlocks(mockBlocks, refDate);
      assert.strictEqual(todayBlocks.length, 3);
      assert.strictEqual(todayBlocks[0].id, 'b-wed-morning');
      assert.strictEqual(todayBlocks[1].id, 'b-wed-afternoon');
      assert.strictEqual(todayBlocks[2].id, 'b-wed-night-cross-midnight');
      // Excludes next week's Wednesday block and Thursday block
      assert.strictEqual(todayBlocks.some((b) => b.id === 'b-next-week-wed'), false);
      assert.strictEqual(todayBlocks.some((b) => b.id === 'b-thu-session'), false);
    });

    test('returns empty array cleanly on empty or null blocks', () => {
      assert.deepStrictEqual(selectTodayBlocks([], refDate), []);
      assert.deepStrictEqual(selectTodayBlocks(null as any, refDate), []);
    });

    test('detects and analyzes blocks that cross midnight into the next day', () => {
      const regularBlock = mockBlocks[0];
      const midnightBlock = mockBlocks[2];

      assert.strictEqual(isBlockSpanningMidnight(regularBlock), false);
      assert.strictEqual(isBlockSpanningMidnight(midnightBlock), true);

      const interval = getBlockInterval(midnightBlock);
      assert.strictEqual(interval.spansMidnight, true);
      assert.strictEqual(interval.startMinutes, 1380);
      assert.strictEqual(interval.endMinutes, 60); // 01:00 AM
      assert.strictEqual(interval.minutesNextDay, 60);
    });
  });

  describe('2. selectWeeklyPlannedDuration & Floating-Point Rounding', () => {
    test('computes total minutes and rounded hours without floating-point artifacts', () => {
      const result = selectWeeklyPlannedDuration(mockBlocks);
      // 90 + 120 + 120 + 60 + 90 = 480 minutes = 8.0 hours
      assert.strictEqual(result.totalMinutes, 480);
      assert.strictEqual(result.totalHours, 8.0);
    });

    test('handles empty blocks gracefully with clean zeroes', () => {
      const result = selectWeeklyPlannedDuration([]);
      assert.strictEqual(result.totalMinutes, 0);
      assert.strictEqual(result.totalHours, 0);
    });

    test('rounds accurately to one decimal place', () => {
      const oddBlocks: ScheduledBlock[] = [
        { id: 'b-1', blockId: 'lib-1', icon: 'code', duration: 45, dayOfWeek: 0, startMinutes: 0, weekId: '2026-W45', title: '', color: '', priority: 'low' },
        { id: 'b-2', blockId: 'lib-2', icon: 'code', duration: 70, dayOfWeek: 0, startMinutes: 0, weekId: '2026-W45', title: '', color: '', priority: 'low' },
      ]; // 115 minutes = 1.91666... hours -> rounds to 1.9
      const result = selectWeeklyPlannedDuration(oddBlocks);
      assert.strictEqual(result.totalMinutes, 115);
      assert.strictEqual(result.totalHours, 1.9);
    });
  });

  describe('3. selectBlockCounts Completion and Pending Categories', () => {
    test('categorizes blocks into completed, missed, in-progress, and pending accurately', () => {
      const counts = selectBlockCounts(mockBlocks);
      assert.strictEqual(counts.total, 5);
      assert.strictEqual(counts.completed, 1);
      assert.strictEqual(counts.inProgress, 1);
      assert.strictEqual(counts.pending, 3);
      assert.strictEqual(counts.missed, 0);
      assert.strictEqual(counts.completionRatePct, 20); // 1 / 5 = 20%
      assert.strictEqual(counts.totalPlannedMinutes, 480);
      assert.strictEqual(counts.totalCompletedMinutes, 90);
    });

    test('handles zero blocks without NaN or division by zero', () => {
      const counts = selectBlockCounts([]);
      assert.strictEqual(counts.total, 0);
      assert.strictEqual(counts.completionRatePct, 0);
      assert.strictEqual(counts.completed, 0);
    });
  });

  describe('4. Canonical Goal Progress Across Views', () => {
    const mockGoal: Goal = {
      id: 'goal-dsa',
      title: 'Master 100 DSA Problems',
      category: 'Coding',
      color: '#3B82F6',
      progressPct: 40,
      smart: {
        measurableType: 'quantity',
        targetValue: 100,
        currentValue: 40,
        unit: 'problems',
      },
    };

    test('calculates consistent progress metrics identical to goalEngine', () => {
      const metrics = selectCanonicalGoalProgress(mockGoal, mockBlocks);
      assert.strictEqual(metrics.progressPct, 40);
      assert.strictEqual(metrics.actualCurrentValue, 40);
      assert.strictEqual(metrics.targetValue, 100);
      assert.strictEqual(metrics.unit, 'problems');
    });

    test('completed goals return 100% without depending on schedule blocks', () => {
      const completedGoal: Goal = {
        ...mockGoal,
        id: 'goal-completed',
        status: 'completed',
        progressPct: 100,
      };
      const metrics = selectCanonicalGoalProgress(completedGoal, []);
      assert.strictEqual(metrics.progressPct, 100);
      assert.strictEqual(metrics.planProgressPct, 100);
      assert.strictEqual(metrics.remainingHours, 0);
      assert.strictEqual(metrics.isOverdue, false);
    });

    test('aggregates multiple goals accurately across all views', () => {
      const goals: Goal[] = [
        mockGoal, // 40%
        {
          ...mockGoal,
          id: 'g-2',
          progressPct: 80,
          smart: { measurableType: 'quantity', targetValue: 100, currentValue: 80, unit: 'problems' },
        }, // 80%
        { ...mockGoal, id: 'g-3', status: 'completed', progressPct: 100 }, // 100%
      ];
      // (40 + 80 + 100) / 3 = 220 / 3 = 73.33... -> 73%
      const agg = selectAggregateGoalProgress(goals, mockBlocks);
      assert.strictEqual(agg.avgProgressPct, 73);
      assert.strictEqual(agg.activeGoalsCount, 2);
      assert.strictEqual(agg.completedGoalsCount, 1);
    });
  });

  describe('5. selectCanonicalExecutionScore Unified Scoring', () => {
    test('computes score using identical weighted algorithm (60% completion, 25% time accuracy, 15% focus)', () => {
      // 1 of 4 blocks completed with 100% time accuracy, 90 mins focus (100% focus score)
      const blocks: ScheduledBlock[] = [
        { id: 'b1', blockId: 'lib-1', icon: 'code', duration: 60, dayOfWeek: 0, startMinutes: 0, weekId: 'w1', title: '', color: '', priority: 'low', status: 'completed', actualDuration: 60 },
        { id: 'b2', blockId: 'lib-2', icon: 'code', duration: 60, dayOfWeek: 0, startMinutes: 0, weekId: 'w1', title: '', color: '', priority: 'low', status: 'not_started' },
        { id: 'b3', blockId: 'lib-3', icon: 'code', duration: 60, dayOfWeek: 0, startMinutes: 0, weekId: 'w1', title: '', color: '', priority: 'low', status: 'not_started' },
        { id: 'b4', blockId: 'lib-4', icon: 'code', duration: 60, dayOfWeek: 0, startMinutes: 0, weekId: 'w1', title: '', color: '', priority: 'low', status: 'not_started' },
      ];
      const result = selectCanonicalExecutionScore({
        blocks,
        focusMinutes: 90,
      });

      // completionPct = 25%
      // timeAccuracyPct = 100%
      // focusScore = 100%
      // overall = 25*0.60 + 100*0.25 + 100*0.15 = 15 + 25 + 15 = 55
      assert.strictEqual(result.completionPct, 25);
      assert.strictEqual(result.timeAccuracyPct, 100);
      assert.strictEqual(result.focusScore, 100);
      assert.strictEqual(result.overallScore, 55);
      assert.strictEqual(result.consistencyRating, 'Fair');
    });

    test('empty blocks return zero and "No Data" cleanly without NaN', () => {
      const result = selectCanonicalExecutionScore({ blocks: [] });
      assert.strictEqual(result.overallScore, 0);
      assert.strictEqual(result.completionPct, 0);
      assert.strictEqual(result.timeAccuracyPct, 0);
      assert.strictEqual(result.focusScore, 0);
      assert.strictEqual(result.consistencyRating, 'No Data');
    });
  });

  describe('6. selectFocusDuration Session Aggregation', () => {
    test('aggregates sessions duration and average duration safely', () => {
      const sessions = [
        { id: 's1', actualMinutes: 45, date: '2026-11-04' } as any,
        { id: 's2', actualMinutes: 75, date: '2026-11-04' } as any,
      ];
      const stats = selectFocusDuration(sessions);
      assert.strictEqual(stats.totalMinutes, 120);
      assert.strictEqual(stats.totalHours, 2.0);
      assert.strictEqual(stats.count, 2);
      assert.strictEqual(stats.avgDurationMinutes, 60);
    });

    test('empty sessions return zero without errors', () => {
      const stats = selectFocusDuration([]);
      assert.strictEqual(stats.totalMinutes, 0);
      assert.strictEqual(stats.totalHours, 0);
      assert.strictEqual(stats.count, 0);
      assert.strictEqual(stats.avgDurationMinutes, 0);
    });
  });
});
