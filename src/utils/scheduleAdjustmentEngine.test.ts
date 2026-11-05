import { test, describe } from 'node:test';
import assert from 'node:assert';
import { detectScheduleAdjustment, ScheduleAdjustmentRecommendation } from './scheduleAdjustmentEngine.ts';
import { ScheduledBlock } from '../types/timetable.ts';
import { ExecutionSession } from '../types/sessionLog.ts';
import { FocusSessionLog } from './focusStorage.ts';

describe('Schedule Adjustment Engine — Evidence-Based Detection', () => {
  const baseWeek = '2026-W45';

  const sampleBlocks: ScheduledBlock[] = [
    {
      id: 'block-morning-standup',
      blockId: 'lib-standup',
      title: 'Daily Standup Sync',
      dayOfWeek: 1, // Tuesday
      startMinutes: 540, // 9:00 AM
      duration: 30, // Planned 30 mins -> ends at 570 (9:30 AM)
      weekId: baseWeek,
      status: 'completed',
      color: '#3B82F6',
      priority: 'high',
      icon: 'briefcase',
    },
    {
      id: 'block-deep-work',
      blockId: 'lib-deep-work',
      title: 'Architecture Refactoring',
      dayOfWeek: 1,
      startMinutes: 570, // 9:30 AM
      duration: 90,
      weekId: baseWeek,
      status: 'not_started',
      color: '#8B5CF6',
      priority: 'high',
      icon: 'code',
    },
    {
      id: 'block-team-review',
      blockId: 'lib-review',
      title: 'Sprint Review',
      dayOfWeek: 1,
      startMinutes: 660, // 11:00 AM
      duration: 60,
      weekId: baseWeek,
      status: 'not_started',
      color: '#10B981',
      priority: 'medium',
      icon: 'users',
    },
  ];

  test('1. No execution logs means no schedule adjustment alert', () => {
    // When blocks exist but have no recorded actual duration and no session logs
    const rec = detectScheduleAdjustment({
      todayBlocks: sampleBlocks,
      executionSessions: [],
      focusLogs: [],
    });

    assert.strictEqual(rec, null, 'Must return null when zero overrun evidence exists');
  });

  test('2. No actual overrun (completed on time or faster) produces no alert', () => {
    // Block completed on time (30 mins actual) or faster (25 mins)
    const onTimeBlocks: ScheduledBlock[] = [
      {
        ...sampleBlocks[0],
        actualDuration: 30, // exact match
      },
      sampleBlocks[1],
      sampleBlocks[2],
    ];

    const rec = detectScheduleAdjustment({
      todayBlocks: onTimeBlocks,
      executionSessions: [],
      focusLogs: [],
    });

    assert.strictEqual(rec, null, 'Must return null when block completed on time');

    const fasterBlocks: ScheduledBlock[] = [
      {
        ...sampleBlocks[0],
        actualDuration: 20, // faster
      },
      sampleBlocks[1],
      sampleBlocks[2],
    ];

    const recFaster = detectScheduleAdjustment({
      todayBlocks: fasterBlocks,
      executionSessions: [],
      focusLogs: [],
    });

    assert.strictEqual(recFaster, null, 'Must return null when block finished early');
  });

  test('3. Real 35-minute overrun produces a correctly calculated recommendation', () => {
    // Standup was planned for 30m, but actually ran 65m (+35m overrun)
    // 540 + 65 = 605 (10:05 AM). Next block started at 570 (9:30 AM).
    // Overlap = 605 - 570 = 35 mins.
    // Recommended shift rounded to 15m intervals: 45 mins (or at least 35m)
    const overrunBlocks: ScheduledBlock[] = [
      {
        ...sampleBlocks[0],
        actualDuration: 65, // 30m planned + 35m overrun
      },
      sampleBlocks[1],
      sampleBlocks[2],
    ];

    const rec = detectScheduleAdjustment({
      todayBlocks: overrunBlocks,
      executionSessions: [],
      focusLogs: [],
    });

    assert.ok(rec !== null, 'Must produce a recommendation when genuine overrun collides with next block');
    assert.strictEqual(rec.overrunBlockId, 'block-morning-standup');
    assert.strictEqual(rec.overrunBlockTitle, 'Daily Standup Sync');
    assert.strictEqual(rec.plannedMinutes, 30);
    assert.strictEqual(rec.actualMinutes, 65);
    assert.strictEqual(rec.overrunMinutes, 35);
    assert.strictEqual(rec.recommendedShiftMinutes, 45); // ceil(35/15)*15 = 45 mins
    assert.strictEqual(rec.affectedBlocks.length, 2);

    // Verify first affected block shifts from 570 to 615 (10:15 AM)
    assert.strictEqual(rec.affectedBlocks[0].id, 'block-deep-work');
    assert.strictEqual(rec.affectedBlocks[0].currentStartMinutes, 570);
    assert.strictEqual(rec.affectedBlocks[0].proposedStartMinutes, 615);

    // Verify second affected block shifts from 660 to 705 (11:45 AM)
    assert.strictEqual(rec.affectedBlocks[1].id, 'block-team-review');
    assert.strictEqual(rec.affectedBlocks[1].currentStartMinutes, 660);
    assert.strictEqual(rec.affectedBlocks[1].proposedStartMinutes, 705);
  });

  test('4. Future schedule block is not modified automatically (engine is pure & non-destructive)', () => {
    const overrunBlocks: ScheduledBlock[] = [
      {
        ...sampleBlocks[0],
        actualDuration: 65,
      },
      { ...sampleBlocks[1] },
      { ...sampleBlocks[2] },
    ];

    const origStart1 = overrunBlocks[1].startMinutes;
    const origStart2 = overrunBlocks[2].startMinutes;

    const rec = detectScheduleAdjustment({
      todayBlocks: overrunBlocks,
    });

    assert.ok(rec !== null);
    // Original blocks in the input array remain unmutated
    assert.strictEqual(overrunBlocks[1].startMinutes, origStart1);
    assert.strictEqual(overrunBlocks[2].startMinutes, origStart2);
  });

  test('5. Overrun from linked ExecutionSession log is detected accurately', () => {
    // Block does not have actualDuration directly on the block object,
    // but a linked execution session log exists with a 20-minute overrun
    const unloggedBlocks: ScheduledBlock[] = [
      {
        ...sampleBlocks[0],
        actualDuration: undefined,
      },
      sampleBlocks[1],
    ];

    const linkedSessions: ExecutionSession[] = [
      {
        id: 'session-log-1',
        scheduledBlockId: 'block-morning-standup',
        date: new Date().toISOString().slice(0, 10),
        plannedTitle: 'Daily Standup Sync',
        actualTitle: 'Daily Standup Sync',
        plannedStartMinutes: 540,
        actualStartMinutes: 540,
        plannedDuration: 30,
        actualDuration: 50, // 20m overrun -> ends at 590. Collides with 570.
        status: 'completed',
        createdAt: Date.now(),
      },
    ];

    const rec = detectScheduleAdjustment({
      todayBlocks: unloggedBlocks,
      executionSessions: linkedSessions,
    });

    assert.ok(rec !== null);
    assert.strictEqual(rec.overrunMinutes, 20);
    assert.strictEqual(rec.recommendedShiftMinutes, 30); // ceil(20/15)*15 = 30m
    assert.strictEqual(rec.affectedBlocks[0].id, 'block-deep-work');
  });

  test('6. Overrun when no subsequent blocks exist produces no shift alert', () => {
    // If the last block of the day runs over, there are no subsequent blocks to collide with
    const lastBlockOnly: ScheduledBlock[] = [
      {
        ...sampleBlocks[0],
        startMinutes: 1000,
        duration: 30,
        actualDuration: 80, // 50m overrun
      },
    ];

    const rec = detectScheduleAdjustment({
      todayBlocks: lastBlockOnly,
    });

    assert.strictEqual(rec, null, 'Must return null when no subsequent blocks exist to adjust');
  });

  test('7. Overrun with sufficient gap/buffer before next block produces no collision alert', () => {
    // Standup ends at 540 + 30 = 570. Actual ran 50 mins (+20m), ending at 590 (9:50 AM).
    // But next block doesn't start until 660 (11:00 AM) - plenty of buffer!
    const bufferedBlocks: ScheduledBlock[] = [
      {
        ...sampleBlocks[0],
        actualDuration: 50,
      },
      {
        ...sampleBlocks[2],
        startMinutes: 660, // 11:00 AM (well after 9:50 AM)
      },
    ];

    const rec = detectScheduleAdjustment({
      todayBlocks: bufferedBlocks,
    });

    assert.strictEqual(rec, null, 'Must return null when buffer absorbs the overrun without collision');
  });
});
