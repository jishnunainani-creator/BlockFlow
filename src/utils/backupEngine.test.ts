import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  createUnifiedBackup,
  validateAndInspectBackup,
  applyUnifiedBackup,
  UnifiedBackupBundle,
  TimetableStateSlice,
} from './backupEngine.ts';
import { loadGoals, saveGoals } from './storage.ts';
import { loadTaskInbox, saveTaskInbox } from './taskInboxStorage.ts';
import { loadAssignments, saveAssignments } from './assignmentStorage.ts';
import { loadThoughts, saveThoughts } from './thoughtStorage.ts';
import { loadStoredProposals, saveStoredProposals } from './adaptivePlannerStorage.ts';
import { ProposedPlanItem } from '../types/adaptivePlanner.ts';

describe('PHASE 4: Transparent Storage, Backup Engine & Privacy Messaging', () => {
  const mockTimetableState: TimetableStateSlice = {
    libraryBlocks: [
      {
        id: 'lib-1',
        title: 'Deep Work',
        color: '#6366F1',
        priority: 'high',
        defaultDuration: 90,
        icon: 'brain',
      },
    ],
    scheduledBlocks: [
      {
        id: 'sched-1',
        blockId: 'lib-1',
        title: 'Deep Work Session',
        color: '#6366F1',
        priority: 'high',
        icon: 'brain',
        dayOfWeek: 1,
        startMinutes: 540,
        duration: 90,
        weekId: '2026-W45',
      },
    ],
    templates: [
      {
        id: 'tmpl-1',
        name: 'Weekly Routine',
        description: 'Standard work week',
        createdAt: 1000,
        blocks: [],
      },
    ],
    customCategories: ['Focus', 'Fitness'],
  };

  test('1. createUnifiedBackup bundles all local modules with version 4.0', () => {
    localStorage.clear();

    saveGoals([
      {
        id: 'goal-1',
        title: 'Ship Phase 4',
        category: 'Work',
        color: '#3B82F6',
        targetDate: '2026-11-15',
        progressPct: 75,
        status: 'active',
        createdAt: 1000,
      },
    ]);

    saveTaskInbox([
      {
        id: 'task-1',
        title: 'Review backup manifest',
        priority: 'high',
        status: 'backlog',
        category: 'Dev',
        estimatedDuration: 30,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ]);

    saveAssignments([
      {
        id: 'assign-1',
        subject: 'Research',
        title: 'Security Audit Draft',
        priority: 'high',
        dueDate: '2026-11-20',
        progressPct: 50,
        status: 'in_progress',
        estimatedHours: 4,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ]);

    saveThoughts([
      {
        id: 'thought-1',
        title: 'Architecture note',
        body: 'Local-first is king',
        color: 'default',
        createdAt: 1000,
        updatedAt: 1000,
        isPinned: false,
        isArchived: false,
      },
    ]);

    const mockProposal: ProposedPlanItem = {
      id: 'prop-1',
      issueId: 'issue-1',
      proposalType: 'schedule_task',
      title: 'Schedule Focus Block',
      entityType: 'task',
      entityId: 'task-1',
      originalDuration: 60,
      proposedDuration: 60,
      selectedSlot: {
        dateLabel: 'Tomorrow',
        dayOfWeek: 1,
        weekId: '2026-W45',
        startMinutes: 600,
        endMinutes: 660,
        duration: 60,
        rankingScore: 100,
        rankingReasons: ['Morning energy'],
        isRecommended: true,
      },
      alternativeSlots: [],
      reason: 'Optimal morning energy',
      status: 'pending',
    };

    saveStoredProposals([mockProposal]);

    const backup = createUnifiedBackup(mockTimetableState, 30);

    assert.strictEqual(backup.version, '4.1');
    assert.strictEqual(backup.app, 'BlockFlow');
    assert.strictEqual(backup.timetable.resolution, 30);
    assert.strictEqual(backup.timetable.libraryBlocks.length, 1);
    assert.strictEqual(backup.timetable.scheduledBlocks.length, 1);
    assert.strictEqual(backup.timetable.templates.length, 1);
    assert.strictEqual(backup.goals.length, 1);
    assert.strictEqual(backup.goals[0].id, 'goal-1');
    assert.strictEqual(backup.tasks.items.length, 1);
    assert.strictEqual(backup.tasks.items[0].id, 'task-1');
    assert.strictEqual(backup.assignments.items.length, 1);
    assert.strictEqual(backup.assignments.items[0].id, 'assign-1');
    assert.strictEqual(backup.thoughts.length, 1);
    assert.strictEqual(backup.thoughts[0].id, 'thought-1');
    assert.strictEqual(backup.planner.proposals.length, 1);
    assert.ok(Array.isArray(backup.dailyGoals));
    assert.ok(Array.isArray(backup.planPeriods));
    assert.strictEqual(typeof backup.dayReflections, 'object');
  });

  test('2. validateAndInspectBackup handles valid v4.1 and reports correct counts', () => {
    const bundle = createUnifiedBackup(mockTimetableState, 15);
    const rawJson = JSON.stringify(bundle);

    const report = validateAndInspectBackup(rawJson);

    assert.strictEqual(report.isValid, true);
    assert.strictEqual(report.version, '4.1');
    assert.strictEqual(report.counts.libraryBlocks, 1);
    assert.strictEqual(report.counts.scheduledBlocks, 1);
    assert.strictEqual(report.counts.templates, 1);
    assert.strictEqual(typeof report.counts.dailyGoals, 'number');
    assert.strictEqual(typeof report.counts.planPeriods, 'number');
    assert.notStrictEqual(report.normalizedBundle, null);
  });

  test('3. validateAndInspectBackup gracefully handles legacy v3.0 backups', () => {
    const legacyBackup = {
      version: '3.0',
      exportedAt: '2026-10-10T10:00:00.000Z',
      libraryBlocks: [
        { id: 'lib-leg-1', title: 'Old Study Block', color: '#10B981', defaultDuration: 60, icon: 'book' },
      ],
      scheduledBlocks: [
        { id: 'sched-leg-1', blockId: 'lib-leg-1', title: 'Study', dayOfWeek: 0, startMinutes: 600, duration: 60, weekId: '2026-W40' },
      ],
      templates: [],
      customCategories: ['Studies'],
      goals: [
        { id: 'g-leg-1', title: 'Legacy Goal', category: 'Studies', color: '#10B981', targetDate: '2026-12-01', progressPct: 50 },
      ],
    };

    const report = validateAndInspectBackup(JSON.stringify(legacyBackup));

    assert.strictEqual(report.isValid, true);
    assert.strictEqual(report.counts.libraryBlocks, 1);
    assert.strictEqual(report.counts.scheduledBlocks, 1);
    assert.strictEqual(report.counts.goals, 1);
    assert.strictEqual(report.counts.tasks, 0);
    assert.strictEqual(report.counts.thoughts, 0);
  });

  test('4. validateAndInspectBackup rejects invalid JSON syntax cleanly', () => {
    const report = validateAndInspectBackup('{"broken_json": true,');
    assert.strictEqual(report.isValid, false);
    assert.ok(report.error?.includes('Invalid JSON syntax'));
    assert.strictEqual(report.normalizedBundle, null);
  });

  test('5. applyUnifiedBackup in replace mode overwrites active state and stores', () => {
    localStorage.clear();
    saveGoals([{ id: 'old-goal', title: 'Old Goal', category: 'General', color: '#666', targetDate: '2026-01-01', progressPct: 10 }]);
    saveTaskInbox([{ id: 'old-task', title: 'Old Task', category: 'General', priority: 'low', status: 'backlog', estimatedDuration: 15, createdAt: 1 }]);
    saveThoughts([{ id: 'old-thought', title: 'Old Thought', body: '', color: 'default', createdAt: 1, updatedAt: 1, isPinned: false, isArchived: false }]);

    let updatedArg: any = null;
    const updateAppState = (arg: any) => {
      updatedArg = arg;
    };

    const incomingBundle: UnifiedBackupBundle = {
      version: '4.0',
      app: 'BlockFlow',
      exportedAt: new Date().toISOString(),
      timetable: {
        libraryBlocks: [{ id: 'new-lib', title: 'New Lib', color: '#F59E0B', priority: 'medium', defaultDuration: 45, icon: 'code' }],
        scheduledBlocks: [{ id: 'new-sched', blockId: 'new-lib', title: 'New Sched', color: '#F59E0B', priority: 'medium', icon: 'code', dayOfWeek: 2, startMinutes: 600, duration: 45, weekId: '2026-W45' }],
        templates: [],
        customCategories: ['New Category'],
      },
      goals: [{ id: 'new-goal', title: 'New Goal', category: 'General', color: '#4F46E5', targetDate: '2026-12-31', progressPct: 0 }],
      tasks: {
        items: [{ id: 'new-task', title: 'New Task', category: 'Dev', priority: 'high', status: 'backlog', estimatedDuration: 25, createdAt: 2 }],
        rules: [],
      },
      assignments: { items: [], futureMe: [], distractions: [], energyProfile: null, milestones: [] },
      thoughts: [{ id: 'new-thought', title: 'New Note', body: 'New body', color: 'lavender', createdAt: 2, updatedAt: 2, isPinned: false, isArchived: false }],
      planner: { proposals: [], config: null },
    };

    const result = applyUnifiedBackup(incomingBundle, 'replace', mockTimetableState, updateAppState);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.mode, 'replace');
    assert.deepStrictEqual(updatedArg.libraryBlocks, incomingBundle.timetable.libraryBlocks);
    assert.deepStrictEqual(updatedArg.scheduledBlocks, incomingBundle.timetable.scheduledBlocks);

    // Check stores are replaced
    assert.strictEqual(loadGoals().length, 1);
    assert.strictEqual(loadGoals()[0].id, 'new-goal');
    assert.strictEqual(loadTaskInbox().length, 1);
    assert.strictEqual(loadTaskInbox()[0].id, 'new-task');
    assert.strictEqual(loadThoughts().length, 1);
    assert.strictEqual(loadThoughts()[0].id, 'new-thought');
  });

  test('6. applyUnifiedBackup in merge mode preserves existing records and remaps colliding IDs', () => {
    localStorage.clear();
    saveGoals([{ id: 'collision-goal', title: 'Device Goal', category: 'General', color: '#333', targetDate: '2026-01-01', progressPct: 20 }]);
    saveTaskInbox([{ id: 'collision-task', title: 'Device Task', category: 'General', priority: 'high', status: 'backlog', estimatedDuration: 30, createdAt: 1 }]);
    saveThoughts([
      { id: 'parent-thought', title: 'Parent Note', body: '', color: 'default', createdAt: 1, updatedAt: 1, isPinned: false, isArchived: false },
    ]);

    let updatedStateArg: any = null;
    const updateAppState = (arg: any) => {
      updatedStateArg = arg;
    };

    const incomingBundle: UnifiedBackupBundle = {
      version: '4.0',
      app: 'BlockFlow',
      exportedAt: new Date().toISOString(),
      timetable: {
        libraryBlocks: [
          { id: 'lib-1', title: 'Incoming Library Block (Collides with mockTimetableState)', color: '#3B82F6', priority: 'high', defaultDuration: 60, icon: 'star' },
        ],
        scheduledBlocks: [
          { id: 'sched-1', blockId: 'lib-1', title: 'Incoming Scheduled Block', color: '#3B82F6', priority: 'high', icon: 'star', dayOfWeek: 3, startMinutes: 480, duration: 60, weekId: '2026-W45' },
        ],
        templates: [],
        customCategories: ['Extra Category'],
      },
      goals: [
        { id: 'collision-goal', title: 'Incoming Goal (Collides)', category: 'General', color: '#333', targetDate: '2026-12-31', progressPct: 80 },
        { id: 'unique-goal', title: 'Unique Goal', category: 'General', color: '#333', targetDate: '2026-12-31', progressPct: 100 },
      ],
      tasks: {
        items: [
          { id: 'collision-task', title: 'Incoming Task (Collides)', category: 'General', priority: 'medium', status: 'backlog', estimatedDuration: 40, createdAt: 2 },
        ],
        rules: [],
      },
      assignments: { items: [], futureMe: [], distractions: [], energyProfile: null, milestones: [] },
      thoughts: [
        { id: 'parent-thought', title: 'Incoming Parent (Collides)', body: 'Incoming', color: 'sand', createdAt: 2, updatedAt: 2, isPinned: false, isArchived: false },
        { id: 'child-thought', parentNoteId: 'parent-thought', title: 'Incoming Child', body: 'Child note', color: 'sand', createdAt: 3, updatedAt: 3, isPinned: false, isArchived: false },
      ],
      planner: { proposals: [], config: null },
    };

    const result = applyUnifiedBackup(incomingBundle, 'merge', mockTimetableState, updateAppState);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.mode, 'merge');

    // 1. Timetable: updateAppState called with merged items
    assert.strictEqual(updatedStateArg.libraryBlocks.length, 2);
    assert.strictEqual(updatedStateArg.scheduledBlocks.length, 2);
    const remappedLibId = updatedStateArg.libraryBlocks[1].id;
    assert.strictEqual(updatedStateArg.scheduledBlocks[1].blockId, remappedLibId);

    // 2. Goals: original + remapped collision + unique = 3 goals
    const goalsAfter = loadGoals();
    assert.strictEqual(goalsAfter.length, 3);
    const goalIds = goalsAfter.map((g) => g.id);
    assert.ok(goalIds.includes('collision-goal'));
    assert.ok(goalIds.includes('unique-goal'));

    // 3. Tasks: original + remapped collision = 2 tasks
    const tasksAfter = loadTaskInbox();
    assert.strictEqual(tasksAfter.length, 2);
    const taskIds = tasksAfter.map((t) => t.id);
    assert.ok(taskIds.includes('collision-task'));

    // 4. Thoughts: original + remapped parent + child with updated parentNoteId
    const thoughtsAfter = loadThoughts();
    assert.strictEqual(thoughtsAfter.length, 3);
    const remappedParentThought = thoughtsAfter.find((t) => t.id.startsWith('parent-thought_m_'));
    assert.ok(remappedParentThought !== undefined);
    const childThought = thoughtsAfter.find((t) => t.id === 'child-thought');
    assert.ok(childThought !== undefined);
    assert.strictEqual(childThought?.parentNoteId, remappedParentThought?.id);
  });
});
