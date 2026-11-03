/**
 * Custom Planner Storage Repository
 * Provides local-first persistence for planners, custom columns, and rows.
 * User-partitioned via getUserScopedKey with durable IndexedDB v3 mirroring.
 * Broadcasts 'blockflow_planners_changed' on updates for reactive UI synchronization.
 */

import {
  CustomPlanner,
  PlannerRow,
  PlannerExportData,
  PlannerBackupPackage,
  PlannerColumn,
} from '../types/customPlanner';
import { getUserScopedKey } from './userScope';
import { idbGetAll, idbPut, idbDelete } from '../lib/indexedDbStore';
import { createPlannerFromTemplate } from './plannerTemplates';

const PLANNERS_BASE_KEY = 'blockflow_custom_planners_v1';
const PLANNER_ROWS_BASE_KEY = 'blockflow_planner_rows_v1';

export function getPlannersStorageKey(): string {
  return getUserScopedKey(PLANNERS_BASE_KEY);
}

export function getPlannerRowsStorageKey(): string {
  return getUserScopedKey(PLANNER_ROWS_BASE_KEY);
}

function notifyPlannerChanges(plannerId?: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('blockflow_planners_changed', { detail: { plannerId } })
      );
    } catch {
      // Ignore in non-browser context
    }
  }
}

/**
 * Loads all planners for the active user. Initializes default Exam Schedule if empty.
 */
export function loadPlanners(): CustomPlanner[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const key = getPlannersStorageKey();
    const raw = localStorage.getItem(key);

    if (!raw) {
      // Seed starter examination schedule template
      const seeded = createPlannerFromTemplate('exam_schedule');
      savePlanners([seeded.planner]);
      savePlannerRows(seeded.planner.id, seeded.rows);
      return [seeded.planner];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[CustomPlannerStorage] Failed to load planners:', err);
    return [];
  }
}

/**
 * Saves all planners to user-scoped localStorage and mirrors to IndexedDB.
 */
export function savePlanners(planners: CustomPlanner[]): void {
  if (typeof localStorage === 'undefined') return;

  const key = getPlannersStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(planners));
  } catch (err) {
    console.warn('[CustomPlannerStorage] Failed to write localStorage planners:', err);
  }

  notifyPlannerChanges();

  // Async IndexedDB mirror
  (async () => {
    try {
      for (const p of planners) {
        await idbPut('custom_planners', p);
      }
    } catch (e) {
      console.warn('[CustomPlannerStorage] IndexedDB mirror error:', e);
    }
  })();
}

export function getPlannerById(id: string): CustomPlanner | undefined {
  const planners = loadPlanners();
  return planners.find((p) => p.id === id);
}

export function savePlanner(planner: CustomPlanner): void {
  const planners = loadPlanners();
  const idx = planners.findIndex((p) => p.id === planner.id);
  const updated = { ...planner, updatedAt: Date.now() };

  if (idx >= 0) {
    planners[idx] = updated;
  } else {
    planners.unshift(updated);
  }

  savePlanners(planners);
}

export function deletePlanner(id: string): void {
  const planners = loadPlanners().filter((p) => p.id !== id);
  savePlanners(planners);

  // Clean up rows
  if (typeof localStorage !== 'undefined') {
    try {
      const rowsKey = getPlannerRowsStorageKey();
      const allRowsMap = loadAllRowsMap();
      delete allRowsMap[id];
      localStorage.setItem(rowsKey, JSON.stringify(allRowsMap));
    } catch (e) {
      console.warn('[CustomPlannerStorage] Error cleaning deleted planner rows:', e);
    }
  }

  // Delete from IndexedDB
  idbDelete('custom_planners', id).catch(() => {});
}

export function duplicatePlanner(id: string): CustomPlanner | null {
  const source = getPlannerById(id);
  if (!source) return null;

  const now = Date.now();
  const newId = `planner_${source.templateType}_${now}`;
  const rows = loadPlannerRows(id);

  const duplicated: CustomPlanner = {
    ...source,
    id: newId,
    name: `${source.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };

  const duplicatedRows: PlannerRow[] = rows.map((r, i) => ({
    ...r,
    id: `row_${now}_${i}`,
    plannerId: newId,
    createdAt: now + i,
    updatedAt: now + i,
  }));

  savePlanner(duplicated);
  savePlannerRows(newId, duplicatedRows);

  return duplicated;
}

export function archivePlanner(id: string, isArchived: boolean): void {
  const planner = getPlannerById(id);
  if (!planner) return;
  savePlanner({ ...planner, isArchived });
}

// ── Rows Persistence ────────────────────────────────────────────────────────

function loadAllRowsMap(): Record<string, PlannerRow[]> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const key = getPlannerRowsStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function loadPlannerRows(plannerId: string): PlannerRow[] {
  const map = loadAllRowsMap();
  const rows = map[plannerId] || [];
  return [...rows].sort((a, b) => a.order - b.order);
}

export function savePlannerRows(plannerId: string, rows: PlannerRow[]): void {
  if (typeof localStorage === 'undefined') return;

  const map = loadAllRowsMap();
  map[plannerId] = rows;

  try {
    localStorage.setItem(getPlannerRowsStorageKey(), JSON.stringify(map));
  } catch (err) {
    console.warn('[CustomPlannerStorage] Failed to save rows to localStorage:', err);
  }

  notifyPlannerChanges(plannerId);

  // Async IndexedDB mirror
  (async () => {
    try {
      for (const row of rows) {
        await idbPut('custom_planner_rows', row);
      }
    } catch (e) {
      console.warn('[CustomPlannerStorage] IndexedDB row mirror error:', e);
    }
  })();
}

export function addPlannerRow(plannerId: string, values: Record<string, any>): PlannerRow {
  const rows = loadPlannerRows(plannerId);
  const now = Date.now();
  const newRow: PlannerRow = {
    id: `row_${now}_${Math.random().toString(36).substring(2, 7)}`,
    plannerId,
    values,
    order: rows.length,
    createdAt: now,
    updatedAt: now,
  };

  const updatedRows = [...rows, newRow];
  savePlannerRows(plannerId, updatedRows);
  return newRow;
}

export function updatePlannerRow(
  plannerId: string,
  rowId: string,
  values: Record<string, any>
): void {
  const rows = loadPlannerRows(plannerId);
  const idx = rows.findIndex((r) => r.id === rowId);
  if (idx < 0) return;

  const updatedRow: PlannerRow = {
    ...rows[idx],
    values: { ...rows[idx].values, ...values },
    updatedAt: Date.now(),
  };

  rows[idx] = updatedRow;
  savePlannerRows(plannerId, rows);
}

export function deletePlannerRow(plannerId: string, rowId: string): void {
  const rows = loadPlannerRows(plannerId).filter((r) => r.id !== rowId);
  // Re-index orders
  rows.forEach((r, idx) => {
    r.order = idx;
  });
  savePlannerRows(plannerId, rows);
  idbDelete('custom_planner_rows', rowId).catch(() => {});
}

export function reorderPlannerRows(plannerId: string, orderedRowIds: string[]): void {
  const rows = loadPlannerRows(plannerId);
  const rowMap = new Map(rows.map((r) => [r.id, r]));

  const reordered: PlannerRow[] = [];
  orderedRowIds.forEach((id, idx) => {
    const row = rowMap.get(id);
    if (row) {
      reordered.push({ ...row, order: idx });
      rowMap.delete(id);
    }
  });

  // Append any unreferenced rows
  rowMap.forEach((row) => {
    reordered.push({ ...row, order: reordered.length });
  });

  savePlannerRows(plannerId, reordered);
}

// ── Column Operations ───────────────────────────────────────────────────────

export function updatePlannerColumns(plannerId: string, columns: PlannerColumn[]): void {
  const planner = getPlannerById(plannerId);
  if (!planner) return;

  // Re-index column orders
  const indexedColumns = columns.map((col, idx) => ({ ...col, order: idx }));
  savePlanner({ ...planner, columns: indexedColumns });
}

export function addPlannerColumn(plannerId: string, column: Omit<PlannerColumn, 'order'>): void {
  const planner = getPlannerById(plannerId);
  if (!planner) return;

  const newCol: PlannerColumn = {
    ...column,
    order: planner.columns.length,
  };

  updatePlannerColumns(plannerId, [...planner.columns, newCol]);
}

export function deletePlannerColumn(plannerId: string, columnId: string): void {
  const planner = getPlannerById(plannerId);
  if (!planner) return;

  const remainingCols = planner.columns.filter((c) => c.id !== columnId);
  updatePlannerColumns(plannerId, remainingCols);

  // Clean values from rows
  const rows = loadPlannerRows(plannerId);
  rows.forEach((r) => {
    delete r.values[columnId];
  });
  savePlannerRows(plannerId, rows);
}

// ── Complete JSON Backup / Restore ──────────────────────────────────────────

export function exportPlannerToJson(plannerId: string): PlannerExportData | null {
  const planner = getPlannerById(plannerId);
  if (!planner) return null;
  const rows = loadPlannerRows(plannerId);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    planner,
    rows,
  };
}

export function exportAllPlannersBackup(): PlannerBackupPackage {
  const planners = loadPlanners();
  const packageData = planners.map((planner) => ({
    planner,
    rows: loadPlannerRows(planner.id),
  }));

  return {
    version: 1,
    app: 'BlockFlow',
    type: 'custom_planners_backup',
    exportedAt: new Date().toISOString(),
    planners: packageData,
  };
}

export function importPlannerFromJson(
  jsonData: any,
  strategy: 'create_new' | 'overwrite' = 'create_new'
): CustomPlanner {
  if (!jsonData || typeof jsonData !== 'object') {
    throw new Error('Invalid JSON format for planner import.');
  }

  const rawPlanner = jsonData.planner || (jsonData.name ? jsonData : null);
  if (!rawPlanner || !rawPlanner.name || !Array.isArray(rawPlanner.columns)) {
    throw new Error('Missing planner name or column definitions in import payload.');
  }

  const now = Date.now();
  const targetId = strategy === 'create_new'
    ? `planner_${rawPlanner.templateType || 'custom'}_${now}_${Math.random().toString(36).substring(2, 7)}`
    : rawPlanner.id;

  const planner: CustomPlanner = {
    ...rawPlanner,
    id: targetId,
    name: strategy === 'create_new' ? `${rawPlanner.name} (Imported)` : rawPlanner.name,
    createdAt: strategy === 'create_new' ? now : (rawPlanner.createdAt || now),
    updatedAt: now,
  };

  const rawRows: PlannerRow[] = Array.isArray(jsonData.rows) ? jsonData.rows : [];
  const rows: PlannerRow[] = rawRows.map((r, i) => ({
    ...r,
    id: strategy === 'create_new' ? `row_${now}_${i}` : r.id,
    plannerId: targetId,
    order: i,
  }));

  savePlanner(planner);
  savePlannerRows(targetId, rows);

  return planner;
}
