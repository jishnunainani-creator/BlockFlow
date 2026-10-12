import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateWeeklyReviewData } from './weeklyReviewEngine.ts';
import { ScheduledBlock } from '../types/timetable.ts';
import { ExecutionSession } from '../types/sessionLog.ts';
import { TaskInboxItem } from '../types/executionOS.ts';

describe('weeklyReviewEngine - Weekly Execution & Review Analytics', () => {
  const currentWeekId = '2026-W42'; // Oct 12 - Oct 18, 2026
  const refDate = new Date('2026-10-15T12:00:00'); // Thursday

  it('handles clean zero-activity data gracefully without NaN or fake metrics', () => {
    const data = calculateWeeklyReviewData({
      weekId: currentWeekId,
      scheduledBlocks: [],
      executionSessions: [],
      focusHistory: [],
      tasks: [],
      assignments: [],
      goals: [],
      refDate,
    });

    assert.strictEqual(data.metrics.weekId, currentWeekId);
    assert.strictEqual(data.metrics.totalCompletedTasks, 0);
    assert.strictEqual(data.metrics.totalIncompleteTasks, 0);
    assert.strictEqual(data.metrics.taskCompletionRatePct, 0);
    assert.strictEqual(data.metrics.totalFocusSessionsCount, 0);
    assert.strictEqual(data.metrics.totalFocusMinutes, 0);
    assert.strictEqual(data.metrics.avgFocusSessionDurationMinutes, 0);
    assert.strictEqual(data.metrics.totalPlannedBlockMinutes, 0);
    assert.strictEqual(data.metrics.timeAdherencePct, 0);
    assert.strictEqual(data.unresolvedItems.length, 0);
  });

  it('aggregates scheduled blocks and computes planned block minutes', () => {
    const blocks: ScheduledBlock[] = [
      {
        id: 'b1',
        blockId: 'a1',
        title: 'Math Study',
        startMinutes: 540,
        duration: 90,
        dayOfWeek: 0,
        weekId: currentWeekId,
        priority: 'high',
        status: 'completed',
        color: '#3B82F6',
        icon: 'book',
      },
      {
        id: 'b2',
        blockId: 'a2',
        title: 'Physics Lab',
        startMinutes: 660,
        duration: 60,
        dayOfWeek: 1,
        weekId: currentWeekId,
        priority: 'high',
        status: 'scheduled',
        color: '#3B82F6',
        icon: 'book',
      },
      {
        id: 'b3',
        blockId: 'a3',
        title: 'Gym Workout',
        startMinutes: 1080,
        duration: 45,
        dayOfWeek: 2,
        weekId: '2026-W41', // Previous week
        priority: 'medium',
        status: 'completed',
        color: '#10B981',
        icon: 'activity',
      },
    ];

    const data = calculateWeeklyReviewData({
      weekId: currentWeekId,
      scheduledBlocks: blocks,
      executionSessions: [],
      focusHistory: [],
      tasks: [],
      assignments: [],
      goals: [],
      refDate,
    });

    // Only b1 (90m) + b2 (60m) are in 2026-W42
    assert.strictEqual(data.metrics.totalScheduledBlocksCount, 2);
    assert.strictEqual(data.metrics.totalPlannedBlockMinutes, 150);
    assert.strictEqual(data.metrics.completedBlocksCount, 1);
  });

  it('aggregates focus sessions and computes actual recorded time vs planned', () => {
    const blocks: ScheduledBlock[] = [
      {
        id: 'b1',
        blockId: 'a1',
        title: 'Algorithms',
        startMinutes: 600,
        duration: 100,
        dayOfWeek: 2,
        weekId: currentWeekId,
        priority: 'high',
        status: 'completed',
        color: '#3B82F6',
        icon: 'code',
      },
    ];

    const sessions: ExecutionSession[] = [
      {
        id: 's1',
        scheduledBlockId: 'b1',
        date: '2026-10-14', // Wednesday in 2026-W42
        plannedTitle: 'Algorithms',
        plannedStartMinutes: 600,
        plannedDuration: 100,
        actualTitle: 'Algorithms',
        actualStartMinutes: 600,
        actualDuration: 80,
        status: 'completed',
        createdAt: 1700000000000,
      },
      {
        id: 's2',
        scheduledBlockId: '',
        date: '2026-10-15', // Thursday in 2026-W42
        plannedTitle: 'Research Paper',
        plannedStartMinutes: 800,
        plannedDuration: 50,
        actualTitle: 'Research Paper',
        actualStartMinutes: 800,
        actualDuration: 40,
        status: 'completed',
        createdAt: 1700000000000,
      },
    ];

    const data = calculateWeeklyReviewData({
      weekId: currentWeekId,
      scheduledBlocks: blocks,
      executionSessions: sessions,
      focusHistory: [],
      tasks: [],
      assignments: [],
      goals: [],
      refDate,
    });

    assert.strictEqual(data.metrics.totalFocusSessionsCount, 2);
    assert.strictEqual(data.metrics.totalFocusMinutes, 120); // 80 + 40
    assert.strictEqual(data.metrics.avgFocusSessionDurationMinutes, 60); // 120 / 2
    // Planned is 100, actual is 120 -> adherence is 100% (capped)
    assert.strictEqual(data.metrics.timeAdherencePct, 100);
  });

  it('aggregates completed, incomplete, and overdue tasks', () => {
    const tasks: TaskInboxItem[] = [
      {
        id: 't1',
        title: 'Finish lab report',
        deadline: '2026-10-14',
        status: 'completed',
        priority: 'high',
        category: 'Study',
        estimatedDuration: 60,
        createdAt: 1700000000000,
        completedAt: new Date('2026-10-14T15:00:00').getTime(),
      },
      {
        id: 't2',
        title: 'Read chapter 4',
        deadline: '2026-10-16',
        status: 'backlog',
        priority: 'medium',
        category: 'Study',
        estimatedDuration: 45,
        createdAt: 1700000000000,
      },
      {
        id: 't3',
        title: 'Submit internship app',
        deadline: '2026-10-05', // Before this week started (overdue)
        status: 'backlog',
        priority: 'high',
        category: 'Career',
        estimatedDuration: 90,
        createdAt: 1700000000000,
      },
    ];

    const data = calculateWeeklyReviewData({
      weekId: currentWeekId,
      scheduledBlocks: [],
      executionSessions: [],
      focusHistory: [],
      tasks,
      assignments: [],
      goals: [],
      refDate,
    });

    assert.strictEqual(data.metrics.totalCompletedTasks, 1);
    assert.strictEqual(data.metrics.totalIncompleteTasks, 2); // t2 and t3
    assert.strictEqual(data.metrics.totalOverdueTasks, 1); // t3
    // Completion rate = 1 / 3 = 33%
    assert.strictEqual(data.metrics.taskCompletionRatePct, 33);
  });

  it('extracts actionable unresolved items for next-week transition', () => {
    const blocks: ScheduledBlock[] = [
      {
        id: 'b-missed',
        blockId: 'a9',
        title: 'Project sync',
        startMinutes: 600,
        duration: 45,
        dayOfWeek: 1,
        weekId: currentWeekId,
        priority: 'high',
        status: 'missed',
        color: '#EF4444',
        icon: 'clock',
      },
    ];

    const tasks: TaskInboxItem[] = [
      {
        id: 't-overdue',
        title: 'Overdue DSA homework',
        deadline: '2026-10-08',
        status: 'backlog',
        priority: 'high',
        category: 'Study',
        createdAt: 1700000000000,
        estimatedDuration: 60,
      },
    ];

    const data = calculateWeeklyReviewData({
      weekId: currentWeekId,
      scheduledBlocks: blocks,
      executionSessions: [],
      focusHistory: [],
      tasks,
      assignments: [],
      goals: [],
      refDate,
    });

    assert.strictEqual(data.unresolvedItems.length, 2);
    const overdueItem = data.unresolvedItems.find((i) => i.type === 'overdue_task');
    const missedItem = data.unresolvedItems.find((i) => i.type === 'missed_block');

    assert.ok(overdueItem);
    assert.strictEqual(overdueItem?.title, 'Overdue DSA homework');
    assert.ok(missedItem);
    assert.strictEqual(missedItem?.title, 'Project sync');
  });
});
