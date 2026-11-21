import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  computeDayScore,
  checkTimeBudget,
  checkGoalWindowOverlap,
  createCarriedGoal,
  reorderGoals,
  getDatesBetween,
  getPeriodDayProgress,
  getMilestoneCountdowns,
  computePeriodSummary,
} from './dailyGoalsEngine.ts';
import { DailyGoal, PlanPeriod, DayReflection } from '../types/dailyGoals.ts';
import { ScheduledBlock } from '../types/timetable.ts';
import { normalizeDailyGoal, normalizePlanPeriod, normalizeDayReflection } from './dailyGoalsStorage.ts';
import { selectDayGoalStats } from './dataSelectors.ts';

describe('Daily Goals Engine — Comprehensive Verification Suite', () => {
  const sampleGoals: DailyGoal[] = [
    {
      id: 'dg-1',
      date: '2026-11-21',
      title: 'Finish Physics Problem Set',
      color: 'indigo',
      priority: 'high', // weight 3
      isMustDo: true,
      estimateMin: 90,
      measure: { type: 'check', current: 1 },
      status: 'done', // 1.0 fraction => 3.0 points
      carryCount: 0,
      order: 0,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'dg-2',
      date: '2026-11-21',
      title: 'Read 20 pages Chemistry',
      color: 'emerald',
      priority: 'medium', // weight 2
      isMustDo: true,
      estimateMin: 60,
      measure: { type: 'count', target: 20, current: 10 },
      status: 'partial', // 10/20 = 0.5 fraction => 1.0 points
      carryCount: 0,
      order: 1,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'dg-3',
      date: '2026-11-21',
      title: 'Review Calculus notes',
      color: 'amber',
      priority: 'low', // weight 1
      isMustDo: false,
      estimateMin: 30,
      measure: { type: 'check', current: 0 },
      status: 'skipped', // 0.0 fraction => 0 points
      carryCount: 0,
      order: 2,
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  test('1. Day Score calculation: High=3, Medium=2, Low=1 with partial credit', () => {
    // Total max points = 3 (high) + 2 (med) + 1 (low) = 6
    // Earned points = (3 * 1.0) + (2 * 0.5) + (1 * 0) = 4
    // Percentage = (4 / 6) * 100 = 66.66% => 67%
    const result = computeDayScore(sampleGoals);
    assert.strictEqual(result.maxPoints, 6);
    assert.strictEqual(result.earnedPoints, 4);
    assert.strictEqual(result.scorePct, 67);
    assert.strictEqual(result.formattedScore, '67%');
  });

  test('2. Day Score for empty day returns scorePct: null and formattedScore: "-"', () => {
    const result = computeDayScore([]);
    assert.strictEqual(result.maxPoints, 0);
    assert.strictEqual(result.earnedPoints, 0);
    assert.strictEqual(result.scorePct, null);
    assert.strictEqual(result.formattedScore, '-');
  });

  test('3. Day Score with percent measure partial progress', () => {
    const percentGoal: DailyGoal = {
      id: 'dg-pct',
      date: '2026-11-21',
      title: 'Draft Essay',
      color: 'rose',
      priority: 'high', // weight 3
      isMustDo: true,
      measure: { type: 'percent', current: 75 },
      status: 'partial',
      carryCount: 0,
      order: 0,
      createdAt: 1000,
      updatedAt: 1000,
    };

    // 3 * 0.75 = 2.25 out of 3 = 75%
    const res = computeDayScore([percentGoal]);
    assert.strictEqual(res.scorePct, 75);
    assert.strictEqual(res.formattedScore, '75%');
  });

  test('4. Carry-over operation updates source goal to carried and creates next-day clone', () => {
    const goalToCarry = sampleGoals[1]; // carryCount: 0
    const { updatedSource, carriedGoal } = createCarriedGoal(goalToCarry, '2026-11-22', 5);

    assert.strictEqual(updatedSource.status, 'carried');
    assert.strictEqual(carriedGoal.date, '2026-11-22');
    assert.strictEqual(carriedGoal.carriedFromId, goalToCarry.id);
    assert.strictEqual(carriedGoal.carryCount, 1);
    assert.strictEqual(carriedGoal.status, 'planned');
    assert.strictEqual(carriedGoal.measure.current, 0);
    assert.strictEqual(carriedGoal.order, 5);
  });

  test('5. Time budget correctly excludes sleep, meals, and fixed commitments from capacity', () => {
    const blocks: ScheduledBlock[] = [
      {
        id: 'b-sleep',
        blockId: 'lib-sleep',
        title: 'Sleep',
        dayOfWeek: 5,
        startMinutes: 0,
        duration: 480, // 8 hours (480 mins)
        weekId: '2026-W47',
        status: 'completed',
        color: '#6366F1',
        priority: 'high',
        icon: 'moon',
      },
      {
        id: 'b-lunch',
        blockId: 'lib-lunch',
        title: 'Lunch Break',
        dayOfWeek: 5,
        startMinutes: 720,
        duration: 60, // 1 hour (60 mins)
        weekId: '2026-W47',
        status: 'completed',
        color: '#10B981',
        priority: 'medium',
        icon: 'coffee',
      },
      {
        id: 'b-class',
        blockId: 'lib-lecture',
        title: 'Computer Science Lecture',
        dayOfWeek: 5,
        startMinutes: 600,
        duration: 90, // 1.5 hours (90 mins fixed commitment)
        weekId: '2026-W47',
        status: 'completed',
        color: '#3B82F6',
        priority: 'high',
        icon: 'book',
      },
    ];

    // Day total = 1440
    // Sleep (480) + Meal (60) = 540 non-work mins
    // Fixed lecture = 90 mins
    // Free capacity = 1440 - 540 - 90 = 810 mins (13.5 hours)
    // Planned goals = 90 (dg-1) + 60 (dg-2) = 150 mins
    const budget = checkTimeBudget({
      goals: sampleGoals,
      scheduledBlocks: blocks,
      dateStr: '2026-11-21',
    });

    assert.strictEqual(budget.nonWorkMinutes, 540);
    assert.strictEqual(budget.fixedCommitmentMinutes, 90);
    assert.strictEqual(budget.freeMinutes, 810);
    assert.strictEqual(budget.plannedMinutes, 150);
    assert.strictEqual(budget.isOverloaded, false);
  });

  test('6. Overload detection flags when planned minutes exceed free capacity', () => {
    const heavyGoals: DailyGoal[] = [
      {
        id: 'dg-heavy',
        date: '2026-11-21',
        title: '12-hour marathon study',
        color: 'indigo',
        priority: 'high',
        isMustDo: true,
        estimateMin: 800,
        measure: { type: 'check', current: 0 },
        status: 'planned',
        carryCount: 0,
        order: 0,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    const heavyFixedBlocks: ScheduledBlock[] = [
      {
        id: 'b-sleep',
        blockId: 'lib-sleep',
        title: 'Sleep',
        dayOfWeek: 5,
        startMinutes: 0,
        duration: 540, // 9 hours
        weekId: '2026-W47',
        status: 'completed',
        color: '#6366F1',
        priority: 'high',
        icon: 'moon',
      },
      {
        id: 'b-exam',
        blockId: 'lib-exam',
        title: 'Midterm Exam',
        dayOfWeek: 5,
        startMinutes: 600,
        duration: 300, // 5 hours fixed
        weekId: '2026-W47',
        status: 'completed',
        color: '#F43F5E',
        priority: 'high',
        icon: 'alert-circle',
      },
    ];

    // Free = 1440 - 540 - 300 = 600 mins
    // Planned = 800 mins => Overload by 200 mins
    const budget = checkTimeBudget({
      goals: heavyGoals,
      scheduledBlocks: heavyFixedBlocks,
      dateStr: '2026-11-21',
    });

    assert.strictEqual(budget.freeMinutes, 600);
    assert.strictEqual(budget.plannedMinutes, 800);
    assert.strictEqual(budget.isOverloaded, true);
    assert.strictEqual(budget.overloadDeltaMinutes, 200);
  });

  test('7. Goal window overlap detects collision with fixed schedule blocks', () => {
    const fixedBlocks: ScheduledBlock[] = [
      {
        id: 'b-lecture',
        blockId: 'lib-lecture',
        title: 'Biology Class',
        dayOfWeek: 5,
        startMinutes: 600, // 10:00 AM
        duration: 90, // ends at 690 (11:30 AM)
        weekId: '2026-W47',
        status: 'not_started',
        color: '#3B82F6',
        priority: 'high',
        icon: 'book',
      },
    ];

    // Overlapping goal: 10:30 to 12:00
    const overlapRes = checkGoalWindowOverlap({ startTime: '10:30', endTime: '12:00' }, fixedBlocks);
    assert.strictEqual(overlapRes.hasOverlap, true);
    assert.strictEqual(overlapRes.conflictingBlockTitle, 'Biology Class');

    // Non-overlapping goal: 14:00 to 15:30
    const cleanRes = checkGoalWindowOverlap({ startTime: '14:00', endTime: '15:30' }, fixedBlocks);
    assert.strictEqual(cleanRes.hasOverlap, false);
  });

  test('8. Reordering goals updates sequential order values', () => {
    const reordered = reorderGoals(sampleGoals, 2, 0); // move last goal to first
    assert.strictEqual(reordered[0].id, 'dg-3');
    assert.strictEqual(reordered[0].order, 0);
    assert.strictEqual(reordered[1].id, 'dg-1');
    assert.strictEqual(reordered[1].order, 1);
    assert.strictEqual(reordered[2].id, 'dg-2');
    assert.strictEqual(reordered[2].order, 2);
  });

  test('9. Plan Period date calculations and Day X of N progress', () => {
    const period: PlanPeriod = {
      id: 'p-1',
      name: 'Finals Prep',
      startDate: '2026-11-20',
      endDate: '2026-11-24', // 5 days total: 20, 21, 22, 23, 24
      color: 'indigo',
      kind: 'exam',
      milestones: [{ date: '2026-11-23', label: 'Math Exam' }],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const dates = getDatesBetween(period.startDate, period.endDate);
    assert.strictEqual(dates.length, 5);
    assert.strictEqual(dates[0], '2026-11-20');
    assert.strictEqual(dates[4], '2026-11-24');

    const dayProg = getPeriodDayProgress(period, '2026-11-21');
    assert.strictEqual(dayProg.dayNumber, 2);
    assert.strictEqual(dayProg.totalDays, 5);
    assert.strictEqual(dayProg.isWithin, true);

    const countdowns = getMilestoneCountdowns(period.milestones, '2026-11-21');
    assert.strictEqual(countdowns.length, 1);
    assert.strictEqual(countdowns[0].daysRemaining, 2);
    assert.strictEqual(countdowns[0].label, 'Math Exam');
  });

  test('10. Shared selector selectDayGoalStats computes uniform stats across surfaces', () => {
    const stats = selectDayGoalStats({
      dateStr: '2026-11-21',
      goals: sampleGoals,
      scheduledBlocks: [],
    });

    assert.strictEqual(stats.totalCount, 3);
    assert.strictEqual(stats.completedCount, 1);
    assert.strictEqual(stats.partialCount, 1);
    assert.strictEqual(stats.skippedCount, 1);
    assert.strictEqual(stats.mustDoCount, 2);
    assert.strictEqual(stats.mustDoCompletedCount, 1);
    assert.strictEqual(stats.scorePct, 67);
    assert.strictEqual(stats.formattedScore, '67%');
  });

  test('11. Storage normalization ensures safe defaults on partial or malformed input', () => {
    const normalized = normalizeDailyGoal({
      title: 'Quick test',
      isMustDo: true,
      measure: { type: 'invalid_type' },
    });

    assert.strictEqual(normalized.title, 'Quick test');
    assert.strictEqual(normalized.measure.type, 'check');
    assert.strictEqual(normalized.priority, 'medium');
    assert.strictEqual(normalized.carryCount, 0);
    assert.strictEqual(normalized.status, 'planned');
    assert.strictEqual(typeof normalized.id, 'string');
  });

  test('12. Period summary properly aggregates miss reasons from reflections', () => {
    const period: PlanPeriod = {
      id: 'p-1',
      name: 'Sprint 1',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      color: 'emerald',
      kind: 'sprint',
      milestones: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const reflections: DayReflection[] = [
      {
        date: '2026-11-21',
        energy: 2,
        reasonTags: {
          'dg-3': ['low_energy', 'distracted'],
        },
        win: 'Completed physics',
        tomorrowFirstStep: 'Start chemistry chapter 3',
        completedAt: 1000,
      },
    ];

    const summary = computePeriodSummary(period, sampleGoals, reflections);
    assert.strictEqual(summary.totalGoals, 3);
    assert.strictEqual(summary.completedGoals, 1);
    assert.strictEqual(summary.completionRatePct, 33);
    assert.strictEqual(summary.missReasonsBreakdown.low_energy, 1);
    assert.strictEqual(summary.missReasonsBreakdown.distracted, 1);
    assert.strictEqual(summary.missReasonsBreakdown.too_big, 0);
  });
});
