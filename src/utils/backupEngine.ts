/**
 * BlockFlow Unified Backup & Restore Engine (v4.0)
 *
 * Provides comprehensive, lossless backup export and safe interactive restore
 * across the entire BlockFlow workspace:
 *   - Timetable (Library Blocks, Scheduled Blocks, Templates, Custom Categories)
 *   - SMART Goals & Milestones
 *   - Task Inbox & Personal Rules
 *   - Assignments, Distractions, Future Me Messages, Energy Profile
 *   - Thought Space Notes (Preserving hierarchical trees)
 *   - Adaptive Planner Proposals & Constraints
 *
 * Supports interactive Replace vs Merge modes with conflict detection and ID remapping.
 */

import {
  LibraryBlock,
  ScheduledBlock,
  TimetableTemplate,
  Goal,
} from '../types/timetable';
import {
  TaskInboxItem,
  PersonalRule,
  Assignment,
  FutureMeMessage,
  DistractionLog,
  EnergyProfile,
  CustomMilestone,
} from '../types/executionOS';
import { ThoughtNote } from '../types/thoughtSpace';
import {
  ProposedPlanItem,
  ScheduleConstraintConfig,
} from '../types/adaptivePlanner';

import { loadGoals, saveGoals, normalizeGoal } from './storage';
import {
  loadTaskInbox,
  saveTaskInbox,
  loadPersonalRules,
  savePersonalRules,
} from './taskInboxStorage';
import {
  loadAssignments,
  saveAssignments,
  loadFutureMeMessages,
  saveFutureMeMessages,
  loadDistractionLogs,
  saveDistractionLogs,
  loadEnergyProfile,
  saveEnergyProfile,
  loadCustomMilestones,
  saveCustomMilestones,
} from './assignmentStorage';
import { loadThoughts, saveThoughts } from './thoughtStorage';
import {
  loadStoredProposals,
  saveStoredProposals,
  loadPlannerConfig,
  savePlannerConfig,
} from './adaptivePlannerStorage';
import { migrateBlockFlowJSON } from './migration/dataMigrator';
import { DailyGoal, PlanPeriod, DayReflection } from '../types/dailyGoals';
import {
  loadDailyGoals,
  saveDailyGoals,
  loadPlanPeriods,
  savePlanPeriods,
  loadDayReflections,
  saveDayReflections,
  normalizeDailyGoal,
  normalizePlanPeriod,
  normalizeDayReflection,
} from './dailyGoalsStorage';

export interface UnifiedBackupBundle {
  version: '4.0' | '4.1';
  app: 'BlockFlow';
  exportedAt: string;
  timetable: {
    libraryBlocks: LibraryBlock[];
    scheduledBlocks: ScheduledBlock[];
    templates: TimetableTemplate[];
    customCategories: string[];
    resolution?: number;
  };
  goals: Goal[];
  tasks: {
    items: TaskInboxItem[];
    rules: PersonalRule[];
  };
  assignments: {
    items: Assignment[];
    futureMe: FutureMeMessage[];
    distractions: DistractionLog[];
    energyProfile: EnergyProfile | null;
    milestones: CustomMilestone[];
  };
  thoughts: ThoughtNote[];
  planner: {
    proposals: ProposedPlanItem[];
    config: ScheduleConstraintConfig | null;
  };
  dailyGoals?: DailyGoal[];
  planPeriods?: PlanPeriod[];
  dayReflections?: Record<string, DayReflection>;
}

export interface BackupCounts {
  libraryBlocks: number;
  scheduledBlocks: number;
  templates: number;
  goals: number;
  tasks: number;
  rules: number;
  assignments: number;
  thoughts: number;
  proposals: number;
  dailyGoals?: number;
  planPeriods?: number;
  dayReflections?: number;
}

export interface BackupConflicts {
  libraryBlockCount: number;
  scheduledBlockCount: number;
  goalCount: number;
  taskCount: number;
  assignmentCount: number;
  thoughtCount: number;
  dailyGoalCount?: number;
  planPeriodCount?: number;
  totalConflicts: number;
}

export interface BackupInspectionReport {
  isValid: boolean;
  error?: string;
  version: string;
  exportedAt?: string;
  counts: BackupCounts;
  conflicts: BackupConflicts;
  normalizedBundle: UnifiedBackupBundle | null;
}

export interface BackupRestoreResult {
  success: boolean;
  mode: 'replace' | 'merge';
  restoredCounts: BackupCounts;
  message: string;
}

export interface TimetableStateSlice {
  libraryBlocks: LibraryBlock[];
  scheduledBlocks: ScheduledBlock[];
  templates: TimetableTemplate[];
  customCategories: string[];
}

/**
 * Creates a complete unified v4.1 JSON backup bundle of the user's workspace.
 */
export function createUnifiedBackup(
  timetableState: TimetableStateSlice,
  resolution?: number
): UnifiedBackupBundle {
  return {
    version: '4.1',
    app: 'BlockFlow',
    exportedAt: new Date().toISOString(),
    timetable: {
      libraryBlocks: timetableState.libraryBlocks || [],
      scheduledBlocks: timetableState.scheduledBlocks || [],
      templates: timetableState.templates || [],
      customCategories: timetableState.customCategories || [],
      resolution,
    },
    goals: loadGoals() || [],
    tasks: {
      items: loadTaskInbox() || [],
      rules: loadPersonalRules() || [],
    },
    assignments: {
      items: loadAssignments() || [],
      futureMe: loadFutureMeMessages() || [],
      distractions: loadDistractionLogs() || [],
      energyProfile: loadEnergyProfile() || null,
      milestones: loadCustomMilestones() || [],
    },
    thoughts: loadThoughts() || [],
    planner: {
      proposals: loadStoredProposals() || [],
      config: loadPlannerConfig() || null,
    },
    dailyGoals: loadDailyGoals() || [],
    planPeriods: loadPlanPeriods() || [],
    dayReflections: loadDayReflections() || {},
  };
}

/**
 * Triggers a file download in the browser for the given backup bundle.
 */
export function downloadBackupFile(
  bundle: UnifiedBackupBundle,
  filename?: string
): void {
  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  anchor.download = filename || `BlockFlow_Workspace_Backup_${dateStr}.json`;
  anchor.href = url;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Validates and inspects an uploaded JSON backup file string.
 * Supports v4.0, legacy v3.0/v2.0/v1.0, and pure schedule exports.
 */
export function validateAndInspectBackup(rawJson: string): BackupInspectionReport {
  if (!rawJson || typeof rawJson !== 'string' || !rawJson.trim()) {
    return {
      isValid: false,
      error: 'Empty backup file content.',
      version: 'unknown',
      counts: emptyCounts(),
      conflicts: emptyConflicts(),
      normalizedBundle: null,
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: any) {
    return {
      isValid: false,
      error: `Invalid JSON syntax: ${err.message || 'Parse error'}`,
      version: 'invalid',
      counts: emptyCounts(),
      conflicts: emptyConflicts(),
      normalizedBundle: null,
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      isValid: false,
      error: 'Backup file root must be a JSON object.',
      version: 'invalid',
      counts: emptyCounts(),
      conflicts: emptyConflicts(),
      normalizedBundle: null,
    };
  }

  // Normalize into UnifiedBackupBundle
  const normalized = normalizeToUnifiedBundle(parsed);

  // Calculate conflict counts against current local state
  const conflicts = inspectConflicts(normalized);

  const counts: BackupCounts = {
    libraryBlocks: normalized.timetable.libraryBlocks.length,
    scheduledBlocks: normalized.timetable.scheduledBlocks.length,
    templates: normalized.timetable.templates.length,
    goals: normalized.goals.length,
    tasks: normalized.tasks.items.length,
    rules: normalized.tasks.rules.length,
    assignments: normalized.assignments.items.length,
    thoughts: normalized.thoughts.length,
    proposals: normalized.planner.proposals.length,
    dailyGoals: normalized.dailyGoals?.length || 0,
    planPeriods: normalized.planPeriods?.length || 0,
    dayReflections: Object.keys(normalized.dayReflections || {}).length,
  };

  return {
    isValid: true,
    version: parsed.version ? String(parsed.version) : 'legacy',
    exportedAt: parsed.exportedAt || undefined,
    counts,
    conflicts,
    normalizedBundle: normalized,
  };
}

/**
 * Applies a restored backup bundle using either 'replace' or 'merge' strategy.
 */
export function applyUnifiedBackup(
  bundle: UnifiedBackupBundle,
  mode: 'replace' | 'merge',
  currentState: TimetableStateSlice,
  updateAppState: (updates: TimetableStateSlice) => void
): BackupRestoreResult {
  if (mode === 'replace') {
    // 1. Timetable State
    updateAppState({
      libraryBlocks: bundle.timetable.libraryBlocks,
      scheduledBlocks: bundle.timetable.scheduledBlocks,
      templates: bundle.timetable.templates,
      customCategories: bundle.timetable.customCategories,
    });

    // 2. Goals
    saveGoals(bundle.goals.map((g) => normalizeGoal(g)));

    // 3. Tasks & Rules
    saveTaskInbox(bundle.tasks.items);
    savePersonalRules(bundle.tasks.rules);

    // 4. Assignments & OS Extras
    saveAssignments(bundle.assignments.items);
    saveFutureMeMessages(bundle.assignments.futureMe);
    saveDistractionLogs(bundle.assignments.distractions);
    if (bundle.assignments.energyProfile) {
      saveEnergyProfile(bundle.assignments.energyProfile);
    }
    if (bundle.assignments.milestones && bundle.assignments.milestones.length > 0) {
      saveCustomMilestones(bundle.assignments.milestones);
    }

    // 5. Thoughts
    saveThoughts(bundle.thoughts);

    // 6. Planner
    saveStoredProposals(bundle.planner.proposals);
    if (bundle.planner.config) {
      savePlannerConfig(bundle.planner.config);
    }

    // 7. Daily Goals, Plan Periods & Day Reflections
    if (bundle.dailyGoals) {
      saveDailyGoals(bundle.dailyGoals.map((g) => normalizeDailyGoal(g)));
    }
    if (bundle.planPeriods) {
      savePlanPeriods(bundle.planPeriods.map((p) => normalizePlanPeriod(p)));
    }
    if (bundle.dayReflections) {
      saveDayReflections(bundle.dayReflections);
    }
  } else {
    // ── MERGE MODE ──
    const timestamp = Date.now();

    // 1. Library Blocks Merge
    const existingLibIds = new Set(currentState.libraryBlocks.map((b) => b.id));
    const libIdRemap = new Map<string, string>();
    const mergedLibraryBlocks = [...currentState.libraryBlocks];

    bundle.timetable.libraryBlocks.forEach((block, idx) => {
      let finalId = block.id;
      if (existingLibIds.has(block.id)) {
        finalId = `${block.id}_m_${timestamp}_${idx}`;
        libIdRemap.set(block.id, finalId);
      }
      mergedLibraryBlocks.push({ ...block, id: finalId });
    });

    // 2. Scheduled Blocks Merge
    const existingSchedIds = new Set(currentState.scheduledBlocks.map((b) => b.id));
    const mergedScheduledBlocks = [...currentState.scheduledBlocks];

    bundle.timetable.scheduledBlocks.forEach((block, idx) => {
      let finalId = block.id;
      if (existingSchedIds.has(block.id)) {
        finalId = `${block.id}_m_${timestamp}_${idx}`;
      }
      const finalBlockId = libIdRemap.get(block.blockId) || block.blockId;
      mergedScheduledBlocks.push({
        ...block,
        id: finalId,
        blockId: finalBlockId,
      });
    });

    // 3. Templates Merge
    const existingTmplIds = new Set(currentState.templates.map((t) => t.id));
    const mergedTemplates = [...currentState.templates];

    bundle.timetable.templates.forEach((tmpl, idx) => {
      let finalId = tmpl.id;
      if (existingTmplIds.has(tmpl.id)) {
        finalId = `${tmpl.id}_m_${timestamp}_${idx}`;
      }
      mergedTemplates.push({ ...tmpl, id: finalId });
    });

    // 4. Custom Categories Merge
    const mergedCategories = Array.from(
      new Set([...currentState.customCategories, ...bundle.timetable.customCategories])
    );

    updateAppState({
      libraryBlocks: mergedLibraryBlocks,
      scheduledBlocks: mergedScheduledBlocks,
      templates: mergedTemplates,
      customCategories: mergedCategories,
    });

    // 5. Goals Merge
    const existingGoals = loadGoals();
    const existingGoalIds = new Set(existingGoals.map((g) => g.id));
    const mergedGoals = [...existingGoals];

    bundle.goals.forEach((goal, idx) => {
      let finalId = goal.id;
      if (existingGoalIds.has(goal.id)) {
        finalId = `${goal.id}_m_${timestamp}_${idx}`;
      }
      mergedGoals.push(normalizeGoal({ ...goal, id: finalId }));
    });
    saveGoals(mergedGoals);

    // 6. Tasks Merge
    const existingTasks = loadTaskInbox();
    const existingTaskIds = new Set(existingTasks.map((t) => t.id));
    const mergedTasks = [...existingTasks];

    bundle.tasks.items.forEach((task, idx) => {
      let finalId = task.id;
      if (existingTaskIds.has(task.id)) {
        finalId = `${task.id}_m_${timestamp}_${idx}`;
      }
      mergedTasks.push({ ...task, id: finalId });
    });
    saveTaskInbox(mergedTasks);

    // Personal Rules Merge (avoid duplicate IDs)
    const existingRules = loadPersonalRules();
    const existingRuleIds = new Set(existingRules.map((r) => r.id));
    const mergedRules = [...existingRules];
    bundle.tasks.rules.forEach((rule, idx) => {
      if (!existingRuleIds.has(rule.id)) {
        mergedRules.push(rule);
      } else {
        mergedRules.push({ ...rule, id: `${rule.id}_m_${timestamp}_${idx}` });
      }
    });
    savePersonalRules(mergedRules);

    // 7. Assignments Merge
    const existingAssignments = loadAssignments();
    const existingAssignmentIds = new Set(existingAssignments.map((a) => a.id));
    const mergedAssignments = [...existingAssignments];

    bundle.assignments.items.forEach((assignment, idx) => {
      let finalId = assignment.id;
      if (existingAssignmentIds.has(assignment.id)) {
        finalId = `${assignment.id}_m_${timestamp}_${idx}`;
      }
      mergedAssignments.push({ ...assignment, id: finalId });
    });
    saveAssignments(mergedAssignments);

    // Append extra logs
    const existingDistractions = loadDistractionLogs();
    const distractionIds = new Set(existingDistractions.map((d) => d.id));
    const mergedDistractions = [...existingDistractions];
    bundle.assignments.distractions.forEach((d) => {
      if (!distractionIds.has(d.id)) mergedDistractions.push(d);
    });
    saveDistractionLogs(mergedDistractions);

    const existingFutureMe = loadFutureMeMessages();
    const futureMeIds = new Set(existingFutureMe.map((m) => m.id));
    const mergedFutureMe = [...existingFutureMe];
    bundle.assignments.futureMe.forEach((m) => {
      if (!futureMeIds.has(m.id)) mergedFutureMe.push(m);
    });
    saveFutureMeMessages(mergedFutureMe);

    // 8. Thoughts Merge (with hierarchical parentNoteId remapping)
    const existingThoughts = loadThoughts();
    const existingThoughtIds = new Set(existingThoughts.map((t) => t.id));
    const thoughtIdRemap = new Map<string, string>();

    // Pass 1: compute ID remappings
    bundle.thoughts.forEach((note, idx) => {
      if (existingThoughtIds.has(note.id)) {
        const newId = `${note.id}_m_${timestamp}_${idx}`;
        thoughtIdRemap.set(note.id, newId);
      }
    });

    // Pass 2: apply remappings and merge
    const mergedThoughts = [...existingThoughts];
    bundle.thoughts.forEach((note) => {
      const finalId = thoughtIdRemap.get(note.id) || note.id;
      const finalParentId = note.parentNoteId
        ? thoughtIdRemap.get(note.parentNoteId) || note.parentNoteId
        : undefined;

      mergedThoughts.push({
        ...note,
        id: finalId,
        parentNoteId: finalParentId,
      });
    });
    saveThoughts(mergedThoughts);

    // 9. Planner Proposals Merge
    const existingProposals = loadStoredProposals();
    const proposalIds = new Set(existingProposals.map((p) => p.id));
    const mergedProposals = [...existingProposals];
    bundle.planner.proposals.forEach((p, idx) => {
      let finalId = p.id;
      if (proposalIds.has(p.id)) {
        finalId = `${p.id}_m_${timestamp}_${idx}`;
      }
      mergedProposals.push({ ...p, id: finalId });
    });
    saveStoredProposals(mergedProposals);

    // 10. Plan Periods Merge
    if (bundle.planPeriods && bundle.planPeriods.length > 0) {
      const existingPeriods = loadPlanPeriods();
      const existingPeriodIds = new Set(existingPeriods.map((p) => p.id));
      const periodIdRemap = new Map<string, string>();
      const mergedPeriods = [...existingPeriods];

      bundle.planPeriods.forEach((period, idx) => {
        let finalId = period.id;
        if (existingPeriodIds.has(period.id)) {
          finalId = `${period.id}_m_${timestamp}_${idx}`;
          periodIdRemap.set(period.id, finalId);
        }
        mergedPeriods.push(normalizePlanPeriod({ ...period, id: finalId }));
      });
      savePlanPeriods(mergedPeriods);

      // Remap periodId in incoming daily goals
      if (bundle.dailyGoals) {
        bundle.dailyGoals = bundle.dailyGoals.map((g) => ({
          ...g,
          periodId: g.periodId ? periodIdRemap.get(g.periodId) || g.periodId : undefined,
        }));
      }
    }

    // 11. Daily Goals Merge
    if (bundle.dailyGoals && bundle.dailyGoals.length > 0) {
      const existingDailyGoals = loadDailyGoals();
      const existingDailyGoalIds = new Set(existingDailyGoals.map((g) => g.id));
      const mergedDailyGoals = [...existingDailyGoals];

      bundle.dailyGoals.forEach((goal, idx) => {
        let finalId = goal.id;
        if (existingDailyGoalIds.has(goal.id)) {
          finalId = `${goal.id}_m_${timestamp}_${idx}`;
        }
        mergedDailyGoals.push(normalizeDailyGoal({ ...goal, id: finalId }));
      });
      saveDailyGoals(mergedDailyGoals);
    }

    // 12. Day Reflections Merge
    if (bundle.dayReflections && Object.keys(bundle.dayReflections).length > 0) {
      const existingReflections = loadDayReflections();
      const mergedReflections = { ...existingReflections };
      Object.entries(bundle.dayReflections).forEach(([dateStr, ref]) => {
        if (!mergedReflections[dateStr] || (ref.completedAt && ref.completedAt > (mergedReflections[dateStr].completedAt || 0))) {
          mergedReflections[dateStr] = normalizeDayReflection(ref);
        }
      });
      saveDayReflections(mergedReflections);
    }
  }

  // Trigger reactive change events across all views
  dispatchStorageChangeEvents();

  const restoredCounts: BackupCounts = {
    libraryBlocks: bundle.timetable.libraryBlocks.length,
    scheduledBlocks: bundle.timetable.scheduledBlocks.length,
    templates: bundle.timetable.templates.length,
    goals: bundle.goals.length,
    tasks: bundle.tasks.items.length,
    rules: bundle.tasks.rules.length,
    assignments: bundle.assignments.items.length,
    thoughts: bundle.thoughts.length,
    proposals: bundle.planner.proposals.length,
    dailyGoals: bundle.dailyGoals?.length || 0,
    planPeriods: bundle.planPeriods?.length || 0,
    dayReflections: Object.keys(bundle.dayReflections || {}).length,
  };

  const actionVerb = mode === 'replace' ? 'Restored & Replaced' : 'Merged';
  const message = `${actionVerb} ${restoredCounts.scheduledBlocks} scheduled blocks, ${restoredCounts.tasks} tasks, ${restoredCounts.goals} goals, and ${restoredCounts.thoughts} notes successfully!`;

  return {
    success: true,
    mode,
    restoredCounts,
    message,
  };
}

/**
 * Normalizes legacy v1/v2/v3 payloads or partial backups into a standard UnifiedBackupBundle.
 */
function normalizeToUnifiedBundle(parsed: any): UnifiedBackupBundle {
  const dailyGoals = Array.isArray(parsed.dailyGoals)
    ? parsed.dailyGoals.map((g: any) => normalizeDailyGoal(g))
    : [];
  const planPeriods = Array.isArray(parsed.planPeriods)
    ? parsed.planPeriods.map((p: any) => normalizePlanPeriod(p))
    : [];
  const dayReflections: Record<string, DayReflection> = {};
  if (typeof parsed.dayReflections === 'object' && parsed.dayReflections !== null) {
    Object.entries(parsed.dayReflections).forEach(([d, r]) => {
      dayReflections[d] = normalizeDayReflection(r);
    });
  }

  // If already v4.0 or v4.1, ensure clean structures
  if ((parsed.version === '4.0' || parsed.version === '4.1') && parsed.timetable && parsed.tasks) {
    return {
      version: parsed.version,
      app: 'BlockFlow',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      timetable: {
        libraryBlocks: Array.isArray(parsed.timetable?.libraryBlocks)
          ? parsed.timetable.libraryBlocks
          : [],
        scheduledBlocks: Array.isArray(parsed.timetable?.scheduledBlocks)
          ? parsed.timetable.scheduledBlocks
          : [],
        templates: Array.isArray(parsed.timetable?.templates)
          ? parsed.timetable.templates
          : [],
        customCategories: Array.isArray(parsed.timetable?.customCategories)
          ? parsed.timetable.customCategories
          : ['Side Project', 'Research', 'Gaming'],
        resolution: parsed.timetable?.resolution,
      },
      goals: Array.isArray(parsed.goals) ? parsed.goals.map((g: any) => normalizeGoal(g)) : [],
      tasks: {
        items: Array.isArray(parsed.tasks?.items) ? parsed.tasks.items : [],
        rules: Array.isArray(parsed.tasks?.rules) ? parsed.tasks.rules : [],
      },
      assignments: {
        items: Array.isArray(parsed.assignments?.items) ? parsed.assignments.items : [],
        futureMe: Array.isArray(parsed.assignments?.futureMe) ? parsed.assignments.futureMe : [],
        distractions: Array.isArray(parsed.assignments?.distractions)
          ? parsed.assignments.distractions
          : [],
        energyProfile: parsed.assignments?.energyProfile || null,
        milestones: Array.isArray(parsed.assignments?.milestones)
          ? parsed.assignments.milestones
          : [],
      },
      thoughts: Array.isArray(parsed.thoughts) ? parsed.thoughts : [],
      planner: {
        proposals: Array.isArray(parsed.planner?.proposals) ? parsed.planner.proposals : [],
        config: parsed.planner?.config || null,
      },
      dailyGoals,
      planPeriods,
      dayReflections,
    };
  }

  // Legacy format normalization (e.g. v3.0, v2.0 or migration format)
  const migration = migrateBlockFlowJSON(parsed);

  // Extract scheduled blocks
  const scheduledBlocks: ScheduledBlock[] = [];
  if (Array.isArray(parsed.scheduledBlocks)) {
    scheduledBlocks.push(...parsed.scheduledBlocks);
  } else if (migration.scheduledBlocksByWeek) {
    Object.values(migration.scheduledBlocksByWeek).forEach((blocks) => {
      scheduledBlocks.push(...blocks);
    });
  }

  // Extract goals
  const rawGoals = Array.isArray(parsed.goals) ? parsed.goals : [];
  const goals: Goal[] = rawGoals.map((g: any) => normalizeGoal(g));

  return {
    version: '4.0',
    app: 'BlockFlow',
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    timetable: {
      libraryBlocks: migration.libraryBlocks || parsed.libraryBlocks || [],
      scheduledBlocks,
      templates: migration.templates || parsed.templates || [],
      customCategories:
        migration.customCategories ||
        parsed.customCategories || ['Side Project', 'Research', 'Gaming'],
      resolution: parsed.resolution,
    },
    goals,
    tasks: {
      items: Array.isArray(parsed.tasks)
        ? parsed.tasks
        : Array.isArray(parsed.tasks?.items)
        ? parsed.tasks.items
        : [],
      rules: Array.isArray(parsed.tasks?.rules) ? parsed.tasks.rules : [],
    },
    assignments: {
      items: Array.isArray(parsed.assignments)
        ? parsed.assignments
        : Array.isArray(parsed.assignments?.items)
        ? parsed.assignments.items
        : [],
      futureMe: Array.isArray(parsed.futureMe) ? parsed.futureMe : [],
      distractions: Array.isArray(parsed.distractions) ? parsed.distractions : [],
      energyProfile: parsed.energyProfile || null,
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
    },
    thoughts: Array.isArray(parsed.thoughts) ? parsed.thoughts : [],
    planner: {
      proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [],
      config: parsed.plannerConfig || null,
    },
    dailyGoals,
    planPeriods,
    dayReflections,
  };
}

/**
 * Compares normalized backup IDs against current on-device stores to detect ID collisions.
 */
function inspectConflicts(bundle: UnifiedBackupBundle): BackupConflicts {
  const currentLib = new Set(
    (typeof window !== 'undefined'
      ? (JSON.parse(localStorage.getItem('timetable_library_blocks_v1') || '[]') as any[])
      : []
    ).map((b) => b.id)
  );

  const currentSched = new Set(
    (typeof window !== 'undefined'
      ? (JSON.parse(localStorage.getItem('timetable_scheduled_blocks_v1') || '[]') as any[])
      : []
    ).map((b) => b.id)
  );

  const currentGoals = new Set(loadGoals().map((g) => g.id));
  const currentTasks = new Set(loadTaskInbox().map((t) => t.id));
  const currentAssignments = new Set(loadAssignments().map((a) => a.id));
  const currentThoughts = new Set(loadThoughts().map((t) => t.id));
  const currentDailyGoals = new Set(loadDailyGoals().map((g) => g.id));
  const currentPlanPeriods = new Set(loadPlanPeriods().map((p) => p.id));

  const libConflicts = bundle.timetable.libraryBlocks.filter((b) => currentLib.has(b.id)).length;
  const schedConflicts = bundle.timetable.scheduledBlocks.filter((b) => currentSched.has(b.id)).length;
  const goalConflicts = bundle.goals.filter((g) => currentGoals.has(g.id)).length;
  const taskConflicts = bundle.tasks.items.filter((t) => currentTasks.has(t.id)).length;
  const assignConflicts = bundle.assignments.items.filter((a) => currentAssignments.has(a.id)).length;
  const thoughtConflicts = bundle.thoughts.filter((t) => currentThoughts.has(t.id)).length;
  const dailyGoalConflicts = (bundle.dailyGoals || []).filter((g) => currentDailyGoals.has(g.id)).length;
  const planPeriodConflicts = (bundle.planPeriods || []).filter((p) => currentPlanPeriods.has(p.id)).length;

  return {
    libraryBlockCount: libConflicts,
    scheduledBlockCount: schedConflicts,
    goalCount: goalConflicts,
    taskCount: taskConflicts,
    assignmentCount: assignConflicts,
    thoughtCount: thoughtConflicts,
    dailyGoalCount: dailyGoalConflicts,
    planPeriodCount: planPeriodConflicts,
    totalConflicts:
      libConflicts +
      schedConflicts +
      goalConflicts +
      taskConflicts +
      assignConflicts +
      thoughtConflicts +
      dailyGoalConflicts +
      planPeriodConflicts,
  };
}

function emptyCounts(): BackupCounts {
  return {
    libraryBlocks: 0,
    scheduledBlocks: 0,
    templates: 0,
    goals: 0,
    tasks: 0,
    rules: 0,
    assignments: 0,
    thoughts: 0,
    proposals: 0,
    dailyGoals: 0,
    planPeriods: 0,
    dayReflections: 0,
  };
}

function emptyConflicts(): BackupConflicts {
  return {
    libraryBlockCount: 0,
    scheduledBlockCount: 0,
    goalCount: 0,
    taskCount: 0,
    assignmentCount: 0,
    thoughtCount: 0,
    dailyGoalCount: 0,
    planPeriodCount: 0,
    totalConflicts: 0,
  };
}

function dispatchStorageChangeEvents(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('blockflow_goals_changed'));
  window.dispatchEvent(new CustomEvent('blockflow_tasks_changed'));
  window.dispatchEvent(new CustomEvent('blockflow_assignments_changed'));
  window.dispatchEvent(new CustomEvent('blockflow_thoughts_changed'));
  window.dispatchEvent(new CustomEvent('blockflow_adaptive_proposals_changed'));
  window.dispatchEvent(new CustomEvent('blockflow_daily_goals_updated'));
  window.dispatchEvent(new CustomEvent('blockflow_plan_periods_updated'));
  window.dispatchEvent(new CustomEvent('blockflow_day_reflections_updated'));
}
