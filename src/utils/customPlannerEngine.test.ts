import { test, describe } from 'node:test';
import assert from 'node:assert';

// Mock localStorage in Node environment if missing
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => (key in mockStorage ? mockStorage[key] : null),
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

import {
  calculateEndTime,
  sortExamsChronologically,
  detectExamOverlaps,
} from './examScheduleEngine';
import {
  exportPlannerToCsv,
  parseCsv,
  getCsvPreview,
} from './customPlannerCsv';
import {
  STARTER_TEMPLATES_METADATA,
  getTemplateDefaultColumns,
  createPlannerFromTemplate,
} from './plannerTemplates';
import {
  loadPlanners,
  savePlanners,
  loadPlannerRows,
  addPlannerRow,
  updatePlannerRow,
  deletePlannerRow,
  exportPlannerToJson,
  exportAllPlannersBackup,
  importPlannerFromJson,
} from './customPlannerStorage';
import { CustomPlanner, PlannerColumn, PlannerRow } from '../types/customPlanner';

describe('Custom Planner & Exam Schedule Engine', () => {
  test('correctly calculates end time from start time and duration', () => {
    // 09:00 + 120 mins = 11:00
    assert.strictEqual(calculateEndTime('09:00', 120), '11:00');

    // 14:30 + 90 mins = 16:00
    assert.strictEqual(calculateEndTime('14:30', 90), '16:00');

    // 23:30 + 45 mins = 00:15 (next day modulo 24)
    assert.strictEqual(calculateEndTime('23:30', 45), '00:15');

    // Invalid inputs fallback gracefully
    assert.strictEqual(calculateEndTime('', 60), '');
    assert.strictEqual(calculateEndTime('10:00', 0), '10:00');
  });

  const sampleCols: PlannerColumn[] = [
    { id: 'col_subject', name: 'Subject', type: 'text', visible: true, order: 0 },
    { id: 'col_date', name: 'Date', type: 'date', visible: true, order: 1 },
    { id: 'col_start', name: 'Start Time', type: 'time', visible: true, order: 2 },
    { id: 'col_duration', name: 'Duration', type: 'number', visible: true, order: 3 },
    { id: 'col_end', name: 'End Time', type: 'time', visible: true, order: 4 },
    { id: 'col_status', name: 'Status', type: 'status', visible: true, order: 5 },
  ];

  test('chronologically sorts exam rows', () => {
    const rows: PlannerRow[] = [
      {
        id: 'row1',
        plannerId: 'p1',
        createdAt: 1,
        updatedAt: 1,
        order: 0,
        values: { col_subject: 'Physics', col_date: '2026-11-20', col_start: '14:00' },
      },
      {
        id: 'row2',
        plannerId: 'p1',
        createdAt: 2,
        updatedAt: 2,
        order: 1,
        values: { col_subject: 'Math', col_date: '2026-11-15', col_start: '09:00' },
      },
      {
        id: 'row3',
        plannerId: 'p1',
        createdAt: 3,
        updatedAt: 3,
        order: 2,
        values: { col_subject: 'Chemistry', col_date: '2026-11-15', col_start: '13:00' },
      },
    ];

    const sorted = sortExamsChronologically(rows, sampleCols);
    assert.strictEqual(sorted[0].values.col_subject, 'Math');
    assert.strictEqual(sorted[1].values.col_subject, 'Chemistry');
    assert.strictEqual(sorted[2].values.col_subject, 'Physics');
  });

  test('detects overlapping examination collision intervals on the same day', () => {
    const rows: PlannerRow[] = [
      {
        id: 'exam_a',
        plannerId: 'p1',
        createdAt: 1,
        updatedAt: 1,
        order: 0,
        values: {
          col_subject: 'Data Structures',
          col_date: '2026-11-10',
          col_start: '10:00',
          col_end: '12:00',
        },
      },
      {
        id: 'exam_b',
        plannerId: 'p1',
        createdAt: 2,
        updatedAt: 2,
        order: 1,
        values: {
          col_subject: 'Operating Systems',
          col_date: '2026-11-10',
          col_start: '11:30', // Overlaps with 10:00 - 12:00
          col_end: '13:30',
        },
      },
      {
        id: 'exam_c',
        plannerId: 'p1',
        createdAt: 3,
        updatedAt: 3,
        order: 2,
        values: {
          col_subject: 'Linear Algebra',
          col_date: '2026-11-10',
          col_start: '14:00', // Safe, no overlap
          col_end: '16:00',
        },
      },
    ];

    const overlaps = detectExamOverlaps(rows, sampleCols);
    assert.strictEqual(overlaps.length, 1);
    assert.ok(overlaps[0].firstExamTitle.includes('Data Structures'));
    assert.ok(overlaps[0].secondExamTitle.includes('Operating Systems'));
  });
});

describe('RFC 4180 CSV Export and Parser', () => {
  test('parses CSV with quoted cells, commas, and internal newlines', () => {
    const csvData =
      'Subject,Code,Notes\r\n' +
      '"Advanced Algorithms, Part 1",CS501,"Requires calculator"\r\n' +
      '"Database Systems",CS502,"Line 1\nLine 2"\r\n';

    const parsed = parseCsv(csvData);
    assert.strictEqual(parsed.length, 3);
    assert.deepStrictEqual(parsed[0], ['Subject', 'Code', 'Notes']);
    assert.deepStrictEqual(parsed[1], ['Advanced Algorithms, Part 1', 'CS501', 'Requires calculator']);
    assert.strictEqual(parsed[2][0], 'Database Systems');
    assert.ok(parsed[2][2].includes('Line 1'));
    assert.ok(parsed[2][2].includes('Line 2'));
  });

  test('exports planner table correctly to compliant CSV string', () => {
    const planner: CustomPlanner = {
      id: 'p_test',
      name: 'Exams',
      description: 'Test',
      icon: 'GraduationCap',
      accentColor: '#3B82F6',
      templateType: 'exam_schedule',
      columns: [
        { id: 'c1', name: 'Course', type: 'text', visible: true, order: 0 },
        { id: 'c2', name: 'Venue', type: 'text', visible: true, order: 1 },
      ],
      isArchived: false,
      density: 'comfortable',
      defaultView: 'table',
      createdAt: 100,
      updatedAt: 100,
    };

    const rows: PlannerRow[] = [
      {
        id: 'r1',
        plannerId: 'p_test',
        values: { c1: 'CS, 101', c2: 'Hall "A"' },
        order: 0,
        createdAt: 100,
        updatedAt: 100,
      },
    ];

    const csvOutput = exportPlannerToCsv(planner, rows);
    assert.ok(csvOutput.includes('Course,Venue'));
    assert.ok(csvOutput.includes('"CS, 101","Hall ""A"""'));
  });

  test('generates structured CSV preview with first 5 rows', () => {
    const rawCsv = 'A,B\n1,2\n3,4\n5,6\n7,8\n9,10\n11,12';
    const preview = getCsvPreview(rawCsv);

    assert.deepStrictEqual(preview.headers, ['A', 'B']);
    assert.strictEqual(preview.totalRows, 6);
    assert.strictEqual(preview.previewRows.length, 5);
  });
});

describe('Starter Templates & Persistence', () => {
  test('verifies all 7 starter templates are registered and have columns', () => {
    assert.strictEqual(STARTER_TEMPLATES_METADATA.length, 7);

    STARTER_TEMPLATES_METADATA.forEach((meta) => {
      const cols = getTemplateDefaultColumns(meta.id);
      assert.ok(cols.length > 0);
    });
  });

  test('instantiates custom planner and sample rows from template', () => {
    const { planner, rows } = createPlannerFromTemplate('exam_schedule');
    assert.strictEqual(planner.name, 'Examination Schedule');
    assert.strictEqual(planner.templateType, 'exam_schedule');
    assert.ok(rows.length > 0);
    assert.ok(planner.columns.some((c) => c.name.includes('Subject')));
  });

  test('supports row CRUD and exports/imports JSON backup package', () => {
    localStorage.clear();
    const { planner } = createPlannerFromTemplate('personal_goals', 'My Q4 Goals');
    savePlanners([planner]);

    const newRow = addPlannerRow(planner.id, { col_goal: 'Read 5 Books' });
    assert.strictEqual(newRow.values.col_goal, 'Read 5 Books');

    const loadedRows = loadPlannerRows(planner.id);
    assert.strictEqual(loadedRows.length, 1);

    updatePlannerRow(planner.id, newRow.id, { col_goal: 'Read 10 Books' });
    const updatedRows = loadPlannerRows(planner.id);
    assert.strictEqual(updatedRows[0].values.col_goal, 'Read 10 Books');

    // Export single JSON
    const exportedSingle = exportPlannerToJson(planner.id);
    assert.strictEqual(exportedSingle?.planner.name, 'My Q4 Goals');
    assert.strictEqual(exportedSingle?.rows[0].values.col_goal, 'Read 10 Books');

    // Batch backup
    const batchBackup = exportAllPlannersBackup();
    assert.strictEqual(batchBackup.type, 'custom_planners_backup');
    assert.strictEqual(batchBackup.planners.length, 1);

    // Import from JSON as new copy
    const imported = importPlannerFromJson(exportedSingle, 'create_new');
    assert.strictEqual(imported.name, 'My Q4 Goals (Imported)');
    assert.strictEqual(loadPlanners().length, 2);

    deletePlannerRow(planner.id, newRow.id);
    assert.strictEqual(loadPlannerRows(planner.id).length, 0);
  });
});

import {
  ICON_CATEGORIES,
  ALL_CURATED_ICONS,
  searchIcons,
  getRecentIcons,
  saveRecentIcon,
  getFavoriteIcons,
  toggleFavoriteIcon,
  isFavoriteIcon,
  getIconComponent,
} from './iconLibrary';

describe('Curated 150+ Icon Library', () => {
  test('contains all 15 specified categories with ~10 or more icons each', () => {
    assert.strictEqual(ICON_CATEGORIES.length, 15);
    ICON_CATEGORIES.forEach((cat) => {
      assert.ok(cat.icons.length >= 10, `Category ${cat.name} should have >= 10 icons`);
    });
    assert.ok(ALL_CURATED_ICONS.length >= 150, `Expected >= 150 unique icons, got ${ALL_CURATED_ICONS.length}`);
  });

  test('resolves valid icon components and falls back safely', () => {
    const calc = getIconComponent('Calculator');
    assert.ok(calc);
    const fallback = getIconComponent('NonExistentCrazyIconName');
    assert.ok(fallback);
  });

  test('searches by keyword synonyms (e.g. "code" finds Terminal, Cpu, Binary, Bug)', () => {
    const results = searchIcons('code');
    assert.ok(results.includes('Code'));
    assert.ok(results.includes('Terminal'));
    assert.ok(results.includes('Cpu'));
    assert.ok(results.includes('Binary'));
    assert.ok(results.includes('Bug'));
  });

  test('searches by keyword for fitness and workout', () => {
    const gymResults = searchIcons('gym');
    assert.ok(gymResults.includes('Dumbbell'));
    assert.ok(gymResults.includes('Activity'));
    assert.ok(gymResults.includes('Timer'));
  });

  test('manages recents and favorites correctly', () => {
    saveRecentIcon('Atom');
    const recents = getRecentIcons();
    assert.strictEqual(recents[0], 'Atom');

    const wasFav = isFavoriteIcon('Atom');
    const toggled = toggleFavoriteIcon('Atom');
    assert.strictEqual(toggled, !wasFav);
    assert.strictEqual(isFavoriteIcon('Atom'), !wasFav);
  });
});
