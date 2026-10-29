import { test, describe } from 'node:test';
import assert from 'node:assert';

import { PATH_TO_VIEW_MAP, ROUTES } from './routes.ts';
import { checkBlockCollision, suggestFreeTimeSlots } from './conflictUtils.ts';
import { ScheduledBlock, Goal } from '../types/timetable.ts';
import { TaskInboxItem, Assignment } from '../types/executionOS.ts';
import { loadTaskInbox, saveTaskInbox } from './taskInboxStorage.ts';
import { loadAssignments, saveAssignments } from './assignmentStorage.ts';
import { loadGoals, saveGoals, normalizeGoal } from './storage.ts';

// In-memory mock for localStorage in Node environment
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  };
}

describe('Mobile Quick Capture - Route Resolution', () => {
  test('resolves /quick-add to quick-add view', () => {
    assert.strictEqual(PATH_TO_VIEW_MAP['/quick-add'], 'quick-add');
  });

  test('resolves aliases /quick-capture, /capture, and /add to quick-add view', () => {
    assert.strictEqual(PATH_TO_VIEW_MAP['/quick-capture'], 'quick-add');
    assert.strictEqual(PATH_TO_VIEW_MAP['/capture'], 'quick-add');
    assert.strictEqual(PATH_TO_VIEW_MAP['/add'], 'quick-add');
  });

  test('maintains primary route mapping for quick-add in ROUTES', () => {
    assert.strictEqual(ROUTES['quick-add'].path, '/quick-add');
    assert.strictEqual(ROUTES['quick-add'].view, 'quick-add');
  });
});

describe('Mobile Quick Capture - Canonical Task Inbox Persistence', () => {
  test('creates and persists TaskInboxItem with default backlog status and canonical fields', () => {
    const initialTasks = loadTaskInbox();

    const newTask: TaskInboxItem = {
      id: 'task-qc-' + Date.now(),
      title: 'Finish Probability Problem Set 4',
      description: 'Focus on Bayes theorem questions 3 and 7',
      category: 'Study',
      priority: 'high',
      estimatedDuration: 90,
      status: 'backlog',
      createdAt: Date.now(),
    };

    saveTaskInbox([...initialTasks, newTask]);

    const reloaded = loadTaskInbox();
    const found = reloaded.find((t) => t.id === newTask.id);
    assert.ok(found, 'Task should be present in storage');
    assert.strictEqual(found?.title, 'Finish Probability Problem Set 4');
    assert.strictEqual(found?.priority, 'high');
    assert.strictEqual(found?.estimatedDuration, 90);
    assert.strictEqual(found?.status, 'backlog');
  });
});

describe('Mobile Quick Capture - Canonical Assignment Persistence', () => {
  test('creates and persists Assignment with due date, priority, and pending status', () => {
    const initialAssignments = loadAssignments();

    const newAssignment: Assignment = {
      id: 'asg-qc-' + Date.now(),
      title: 'Operating Systems Kernel Milestone 2',
      subject: 'Computer Science',
      dueDate: '2026-10-20T23:59:00',
      priority: 'high',
      status: 'pending',
      description: 'Synchronize mutex lock handles in scheduler',
      estimatedHours: 4,
      progressPct: 0,
    };

    saveAssignments([...initialAssignments, newAssignment]);

    const reloaded = loadAssignments();
    const found = reloaded.find((a) => a.id === newAssignment.id);
    assert.ok(found, 'Assignment should be present in storage');
    assert.strictEqual(found?.title, 'Operating Systems Kernel Milestone 2');
    assert.strictEqual(found?.subject, 'Computer Science');
    assert.strictEqual(found?.dueDate, '2026-10-20T23:59:00');
    assert.strictEqual(found?.status, 'pending');
  });
});

describe('Mobile Quick Capture - Canonical SMART Goal Persistence', () => {
  test('normalizes and persists Goal with smart parameters, timeframe, and targetValue', () => {
    const rawGoal: Partial<Goal> = {
      id: 'goal-qc-' + Date.now(),
      title: 'Score 90%+ in Distributed Systems Midterm',
      category: 'Academic',
      smart: {
        specificDetails: 'Essential for honours degree completion',
        measurableType: 'effort',
        targetValue: 20,
        currentValue: 0,
        unit: 'hours',
        estimatedTotalHours: 20,
        dailyAvailableHours: 2,
        weeklyAvailableHours: 10,
        preferredDays: [0, 2, 4],
        preferredSessionMinutes: 60,
        preferredEnergyWindow: 'morning',
        startDate: '2026-10-13',
        deadline: '2026-11-13',
      },
    };

    const normalized = normalizeGoal(rawGoal);
    assert.strictEqual(normalized.title, 'Score 90%+ in Distributed Systems Midterm');
    assert.strictEqual(normalized.status, 'active');
    assert.strictEqual(normalized.smart?.targetValue, 20);
    assert.strictEqual(normalized.smart?.currentValue, 0);

    const initialGoals = loadGoals();
    saveGoals([...initialGoals, normalized]);

    const reloaded = loadGoals();
    const found = reloaded.find((g) => g.id === normalized.id);
    assert.ok(found, 'Goal should be present in storage');
    assert.strictEqual(found?.title, 'Score 90%+ in Distributed Systems Midterm');
    assert.strictEqual(found?.smart?.targetValue, 20);
  });
});

describe('Mobile Quick Capture - Schedule Block Collision & Conflict Detection', () => {
  const weekId = '2026-W42';
  const existingBlock: ScheduledBlock = {
    id: 'block-existing-1',
    blockId: 'lib-1',
    title: 'Algorithms Lecture',
    description: 'Dynamic Programming & Graphs',
    color: '#3B82F6',
    priority: 'high',
    icon: 'book',
    dayOfWeek: 1, // Monday
    startMinutes: 600, // 10:00 AM
    duration: 90, // Ends at 11:30 AM (690 mins)
    weekId,
  };

  test('detects overlapping collision with existing schedule block', () => {
    // 10:15 - 11:00 (start 615, duration 45) overlaps with 10:00 - 11:30
    const collision = checkBlockCollision(
      weekId,
      1,
      615,
      45,
      [existingBlock]
    );

    assert.strictEqual(collision.hasConflict, true);
    assert.strictEqual(collision.conflictingBlock?.id, 'block-existing-1');
  });

  test('does not report collision for non-overlapping block on the same day', () => {
    // 11:30 - 12:30 (start 690, duration 60) is adjacent, no overlap
    const noCollision = checkBlockCollision(
      weekId,
      1,
      690,
      60,
      [existingBlock]
    );

    assert.strictEqual(noCollision.hasConflict, false);
    assert.strictEqual(noCollision.conflictingBlock, undefined);
  });

  test('suggests alternative free time slots when collision exists', () => {
    const suggestions = suggestFreeTimeSlots(
      1,
      60,
      [existingBlock],
      8, // 8 AM
      20, // 8 PM
      30
    );

    assert.ok(suggestions.length > 0, 'Should suggest free slots');
    // Verify none of the suggested slots overlap with 600 - 690 (10:00 - 11:30)
    for (const slot of suggestions) {
      const coll = checkBlockCollision(
        weekId,
        1,
        slot.startMinutes,
        60,
        [existingBlock]
      );
      assert.strictEqual(coll.hasConflict, false, `Suggested slot at ${slot.timeStr} should not conflict`);
    }
  });
});
