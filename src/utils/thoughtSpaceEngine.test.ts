import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

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
  ThoughtNote,
  ThoughtSpaceBackup,
  THOUGHT_COLORS,
  VALID_COLORS,
} from '../types/thoughtSpace.ts';
import {
  generateThoughtId,
  canSetParent,
  getDescendantIds,
  resolveParentDeletion,
  buildThoughtTree,
  filterAndSortNotes,
  generateThoughtBackup,
  validateThoughtBackup,
  applyThoughtImport,
} from './thoughtSpaceEngine.ts';
import {
  loadThoughts,
  saveThoughts,
  createThought,
  updateThought,
  deleteThought,
  getThoughtsStorageKey,
} from './thoughtStorage.ts';
import { setActiveUserId, getActiveUserId } from './userScope.ts';
import { SYNC_CATEGORIES_METADATA } from '../types/storageState.ts';

describe('Thought Space — 1. Note Creation, Editing & Timestamps', () => {
  test('creates a note with valid stable ID and timestamps', () => {
    setActiveUserId('test_user_create');
    const note = createThought({
      title: 'Architectural Decisions',
      body: 'Keep storage local-first and privacy conscious.',
      color: 'sage',
    });

    assert.ok(note.id.startsWith('th_'), 'ID should have standard prefix');
    assert.strictEqual(note.title, 'Architectural Decisions');
    assert.strictEqual(note.body, 'Keep storage local-first and privacy conscious.');
    assert.strictEqual(note.color, 'sage');
    assert.strictEqual(note.isPinned, false);
    assert.strictEqual(note.isArchived, false);
    assert.strictEqual(note.parentNoteId, null);
    assert.ok(note.createdAt > 0);
    assert.ok(note.updatedAt >= note.createdAt);

    const loaded = loadThoughts();
    const found = loaded.find((n) => n.id === note.id);
    assert.ok(found, 'Created note should be persisted in local storage');
  });

  test('updates an existing note while preserving ID and updating updatedAt', async () => {
    setActiveUserId('test_user_update');
    const created = createThought({ title: 'Initial Draft', body: 'Draft content' });
    const initialUpdatedAt = created.updatedAt;

    // Small delay to ensure timestamp progression
    await new Promise((resolve) => setTimeout(resolve, 20));

    const updated = updateThought(created.id, {
      title: 'Revised Note',
      body: 'Updated body text',
      color: 'sky',
      isPinned: true,
    });

    assert.ok(updated);
    assert.strictEqual(updated.id, created.id, 'ID must remain strictly immutable');
    assert.strictEqual(updated.title, 'Revised Note');
    assert.strictEqual(updated.body, 'Updated body text');
    assert.strictEqual(updated.color, 'sky');
    assert.strictEqual(updated.isPinned, true);
    assert.ok(updated.updatedAt > initialUpdatedAt, 'updatedAt must advance');
  });
});

describe('Thought Space — 2. Nested Hierarchy, Trees & Cycle Prevention', () => {
  test('builds a nested tree with accurate depth, children and recursive subnote count', () => {
    const root1: ThoughtNote = {
      id: 'root_1',
      title: 'System Design',
      body: 'Core architecture',
      color: 'default',
      createdAt: 1000,
      updatedAt: 1000,
      isPinned: false,
      isArchived: false,
      parentNoteId: null,
    };
    const child1: ThoughtNote = {
      id: 'child_1',
      title: 'Database Layer',
      body: 'IndexedDB',
      color: 'sand',
      createdAt: 2000,
      updatedAt: 2000,
      isPinned: false,
      isArchived: false,
      parentNoteId: 'root_1',
    };
    const grandchild1: ThoughtNote = {
      id: 'grandchild_1',
      title: 'Object Store Schema',
      body: 'Key paths',
      color: 'mint',
      createdAt: 3000,
      updatedAt: 3000,
      isPinned: false,
      isArchived: false,
      parentNoteId: 'child_1',
    };

    const tree = buildThoughtTree([root1, child1, grandchild1]);
    assert.strictEqual(tree.length, 1, 'Should have 1 top-level root node');
    assert.strictEqual(tree[0].id, 'root_1');
    assert.strictEqual(tree[0].depth, 0);
    assert.strictEqual(tree[0].children.length, 1);
    assert.strictEqual(tree[0].subnoteCount, 2, 'Root should count child and grandchild');

    const treeChild = tree[0].children[0];
    assert.strictEqual(treeChild.id, 'child_1');
    assert.strictEqual(treeChild.depth, 1);
    assert.strictEqual(treeChild.children.length, 1);
    assert.strictEqual(treeChild.subnoteCount, 1);

    const treeGrandchild = treeChild.children[0];
    assert.strictEqual(treeGrandchild.id, 'grandchild_1');
    assert.strictEqual(treeGrandchild.depth, 2);
    assert.strictEqual(treeGrandchild.children.length, 0);
    assert.strictEqual(treeGrandchild.subnoteCount, 0);
  });

  test('rescues orphaned subnotes whose parentNoteId does not exist to top level', () => {
    const orphan: ThoughtNote = {
      id: 'orphan_1',
      title: 'Orphaned Thought',
      body: 'Parent was deleted without cascade',
      color: 'rose',
      createdAt: 1000,
      updatedAt: 1000,
      isPinned: false,
      isArchived: false,
      parentNoteId: 'non_existent_parent_id',
    };

    const tree = buildThoughtTree([orphan]);
    assert.strictEqual(tree.length, 1, 'Orphaned note must be promoted to root');
    assert.strictEqual(tree[0].id, 'orphan_1');
    assert.strictEqual(tree[0].depth, 0);
  });

  test('prevents self-parenting and circular ancestor chains', () => {
    const noteA: ThoughtNote = { id: 'A', title: 'A', body: '', color: 'default', createdAt: 1, updatedAt: 1, isPinned: false, isArchived: false, parentNoteId: null };
    const noteB: ThoughtNote = { id: 'B', title: 'B', body: '', color: 'default', createdAt: 2, updatedAt: 2, isPinned: false, isArchived: false, parentNoteId: 'A' };
    const noteC: ThoughtNote = { id: 'C', title: 'C', body: '', color: 'default', createdAt: 3, updatedAt: 3, isPinned: false, isArchived: false, parentNoteId: 'B' };
    const notes = [noteA, noteB, noteC];

    // 1. Self-parenting
    assert.strictEqual(canSetParent('A', 'A', notes), false, 'Note cannot be its own parent');

    // 2. Circular parent: B is child of A, so A cannot choose B as parent
    assert.strictEqual(canSetParent('A', 'B', notes), false, 'Ancestor cannot choose child as parent');

    // 3. Circular parent: C is grandchild of A, so A cannot choose C as parent
    assert.strictEqual(canSetParent('A', 'C', notes), false, 'Ancestor cannot choose grandchild as parent');

    // 4. Valid re-parenting: C can choose A directly as parent
    assert.strictEqual(canSetParent('C', 'A', notes), true, 'Child can re-parent to higher ancestor');

    // 5. Valid re-parenting: C can become root (null)
    assert.strictEqual(canSetParent('C', null, notes), true, 'Note can always be set to root');
  });
});

describe('Thought Space — 3. Safe Deletion & Child Handling', () => {
  test('cascade deletion deletes parent and all recursive descendants', () => {
    const parent: ThoughtNote = { id: 'P', title: 'Parent', body: '', color: 'default', createdAt: 1, updatedAt: 1, isPinned: false, isArchived: false, parentNoteId: null };
    const child: ThoughtNote = { id: 'C', title: 'Child', body: '', color: 'default', createdAt: 2, updatedAt: 2, isPinned: false, isArchived: false, parentNoteId: 'P' };
    const grand: ThoughtNote = { id: 'G', title: 'Grandchild', body: '', color: 'default', createdAt: 3, updatedAt: 3, isPinned: false, isArchived: false, parentNoteId: 'C' };
    const unrelated: ThoughtNote = { id: 'U', title: 'Unrelated', body: '', color: 'default', createdAt: 4, updatedAt: 4, isPinned: false, isArchived: false, parentNoteId: null };

    const { toDeleteIds, toReparent } = resolveParentDeletion('P', 'cascade', [parent, child, grand, unrelated]);
    assert.deepStrictEqual(toDeleteIds.sort(), ['C', 'G', 'P'].sort());
    assert.strictEqual(toReparent.length, 0);
  });

  test('reparent deletion deletes parent and promotes direct children to root', () => {
    const parent: ThoughtNote = { id: 'P', title: 'Parent', body: '', color: 'default', createdAt: 1, updatedAt: 1, isPinned: false, isArchived: false, parentNoteId: null };
    const child1: ThoughtNote = { id: 'C1', title: 'Child 1', body: '', color: 'default', createdAt: 2, updatedAt: 2, isPinned: false, isArchived: false, parentNoteId: 'P' };
    const child2: ThoughtNote = { id: 'C2', title: 'Child 2', body: '', color: 'default', createdAt: 3, updatedAt: 3, isPinned: false, isArchived: false, parentNoteId: 'P' };

    const { toDeleteIds, toReparent } = resolveParentDeletion('P', 'reparent', [parent, child1, child2]);
    assert.deepStrictEqual(toDeleteIds, ['P']);
    assert.strictEqual(toReparent.length, 2);
    assert.strictEqual(toReparent[0].id, 'C1');
    assert.strictEqual(toReparent[0].parentNoteId, null, 'Child 1 promoted to root');
    assert.strictEqual(toReparent[1].id, 'C2');
    assert.strictEqual(toReparent[1].parentNoteId, null, 'Child 2 promoted to root');
  });
});

describe('Thought Space — 4. Search, Pinning, and Archiving Filters', () => {
  const noteList: ThoughtNote[] = [
    { id: '1', title: 'Quantum Mechanics', body: 'Wave particle duality', color: 'sky', createdAt: 100, updatedAt: 100, isPinned: false, isArchived: false },
    { id: '2', title: 'Daily Groceries', body: 'Apples, Milk, Bread', color: 'default', createdAt: 200, updatedAt: 300, isPinned: true, isArchived: false },
    { id: '3', title: 'Old Project Spec', body: 'Deprecated architecture', color: 'stone', createdAt: 50, updatedAt: 50, isPinned: false, isArchived: true },
  ];

  test('search matches both title and body content', () => {
    const matchTitle = filterAndSortNotes(noteList, 'Quantum', 'all', 'updated_desc');
    assert.strictEqual(matchTitle.length, 1);
    assert.strictEqual(matchTitle[0].id, '1');

    const matchBody = filterAndSortNotes(noteList, 'duality', 'all', 'updated_desc');
    assert.strictEqual(matchBody.length, 1);
    assert.strictEqual(matchBody[0].id, '1');

    const matchBoth = filterAndSortNotes(noteList, 'Apples', 'all', 'updated_desc');
    assert.strictEqual(matchBoth.length, 1);
    assert.strictEqual(matchBoth[0].id, '2');
  });

  test('pinned notes are sorted first in "all" view', () => {
    const all = filterAndSortNotes(noteList, '', 'all', 'updated_desc');
    assert.strictEqual(all.length, 2, 'Archived note excluded in all active view');
    assert.strictEqual(all[0].id, '2', 'Pinned note must appear first');
    assert.strictEqual(all[1].id, '1');
  });

  test('archived filter isolates archived notes', () => {
    const archived = filterAndSortNotes(noteList, '', 'archived', 'updated_desc');
    assert.strictEqual(archived.length, 1);
    assert.strictEqual(archived[0].id, '3');
  });
});

describe('Thought Space — 5. Export, Import & Round-Trip Fidelity', () => {
  const originalNotes: ThoughtNote[] = [
    {
      id: 'th_001',
      title: 'First Thought',
      body: 'Detailed multiline content\nSecond line\nThird line',
      color: 'lavender',
      createdAt: 1700000000000,
      updatedAt: 1700000050000,
      isPinned: true,
      isArchived: false,
      parentNoteId: null,
    },
    {
      id: 'th_002',
      title: 'Subnote of First',
      body: 'Nested subnote content',
      color: 'mint',
      createdAt: 1700000010000,
      updatedAt: 1700000020000,
      isPinned: false,
      isArchived: false,
      parentNoteId: 'th_001',
    },
  ];

  test('generates versioned JSON with schema metadata', () => {
    const jsonStr = generateThoughtBackup(originalNotes);
    const parsed = JSON.parse(jsonStr) as ThoughtSpaceBackup;

    assert.strictEqual(parsed.app, 'BlockFlow');
    assert.strictEqual(parsed.format, 'thought_space_backup');
    assert.strictEqual(parsed.version, 1);
    assert.strictEqual(parsed.noteCount, 2);
    assert.strictEqual(parsed.notes.length, 2);
    assert.strictEqual(parsed.notes[0].id, 'th_001');
    assert.strictEqual(parsed.notes[1].parentNoteId, 'th_001');
  });

  test('validates and round-trips exported JSON with complete fidelity', () => {
    const jsonStr = generateThoughtBackup(originalNotes);
    const validation = validateThoughtBackup(jsonStr, []);

    assert.strictEqual(validation.isValid, true);
    assert.strictEqual(validation.errors.length, 0);
    assert.strictEqual(validation.totalNotes, 2);
    assert.strictEqual(validation.rootNotesCount, 1);
    assert.strictEqual(validation.subnotesCount, 1);
    assert.strictEqual(validation.duplicateIdsCount, 0);
    assert.deepStrictEqual(validation.sanitizedNotes, originalNotes);
  });

  test('handles merge strategy by remapping conflicting IDs to prevent overwrites', () => {
    const existing: ThoughtNote[] = [
      { id: 'th_001', title: 'Existing Local Note', body: 'Local', color: 'default', createdAt: 1, updatedAt: 1, isPinned: false, isArchived: false },
    ];
    const incoming: ThoughtNote[] = [
      { id: 'th_001', title: 'Incoming Conflicting Note', body: 'Incoming', color: 'sky', createdAt: 2, updatedAt: 2, isPinned: false, isArchived: false },
      { id: 'th_003', title: 'Child of Incoming', body: 'Child', color: 'mint', createdAt: 3, updatedAt: 3, isPinned: false, isArchived: false, parentNoteId: 'th_001' },
    ];

    const merged = applyThoughtImport(incoming, existing, 'merge');
    assert.strictEqual(merged.length, 3, 'Must have 1 existing + 2 incoming notes');

    // Existing note preserved unchanged
    const preserved = merged.find((n) => n.id === 'th_001');
    assert.ok(preserved);
    assert.strictEqual(preserved.title, 'Existing Local Note');

    // Conflicting incoming note remapped to fresh ID
    const remapped = merged.find((n) => n.title === 'Incoming Conflicting Note');
    assert.ok(remapped);
    assert.notStrictEqual(remapped.id, 'th_001', 'Conflicting ID must be remapped');

    // Child of incoming note has updated parentNoteId matching the remapped parent
    const remappedChild = merged.find((n) => n.title === 'Child of Incoming');
    assert.ok(remappedChild);
    assert.strictEqual(remappedChild.parentNoteId, remapped.id, 'Child parent reference must be remapped to new parent ID');
  });

  test('rejects malformed or invalid JSON input safely', () => {
    const malformed = validateThoughtBackup('invalid { json', []);
    assert.strictEqual(malformed.isValid, false);
    assert.ok(malformed.errors.length > 0);

    const emptyObj = validateThoughtBackup('{}', []);
    assert.strictEqual(emptyObj.isValid, false);
    assert.ok(emptyObj.errors.some((e) => e.includes('notes array')));
  });

  test('detects and auto-repairs circular loops in imported data', () => {
    const circularNotes = JSON.stringify({
      app: 'BlockFlow',
      format: 'thought_space_backup',
      version: 1,
      notes: [
        { id: 'N1', title: 'Note 1', body: '', color: 'default', parentNoteId: 'N2' },
        { id: 'N2', title: 'Note 2', body: '', color: 'default', parentNoteId: 'N1' },
      ],
    });

    const val = validateThoughtBackup(circularNotes, []);
    assert.strictEqual(val.isValid, true);
    assert.ok(val.warnings.some((w) => w.includes('Circular nesting')));
    // Loop broken: at least one note's parent cleared to null
    const hasRoot = val.sanitizedNotes.some((n) => n.parentNoteId === null);
    assert.strictEqual(hasRoot, true, 'Circular dependency must be broken');
  });
});

describe('Thought Space — 6. Guest & Authenticated User Isolation', () => {
  test('isolates notes between guest and authenticated users', () => {
    // 1. Write note as Guest
    setActiveUserId(null);
    saveThoughts([
      { id: 'guest_note_1', title: 'Guest Note', body: 'Private to guest', color: 'default', createdAt: 1, updatedAt: 1, isPinned: false, isArchived: false },
    ]);
    const guestNotes = loadThoughts();
    assert.strictEqual(guestNotes.length, 1);
    assert.strictEqual(guestNotes[0].id, 'guest_note_1');

    // 2. Switch to User A
    setActiveUserId('user_alice_123');
    const aliceNotesBefore = loadThoughts();
    assert.strictEqual(aliceNotesBefore.length, 0, 'User A should start with zero notes (no automatic guest merge)');

    saveThoughts([
      { id: 'alice_note_1', title: 'Alice Note', body: 'Alice research', color: 'lavender', createdAt: 2, updatedAt: 2, isPinned: false, isArchived: false },
    ]);
    const aliceNotes = loadThoughts();
    assert.strictEqual(aliceNotes.length, 1);
    assert.strictEqual(aliceNotes[0].id, 'alice_note_1');

    // 3. Switch back to Guest
    setActiveUserId(null);
    const guestNotesAfter = loadThoughts();
    assert.strictEqual(guestNotesAfter.length, 1);
    assert.strictEqual(guestNotesAfter[0].id, 'guest_note_1', 'Guest notes preserved and uncorrupted');
  });
});

describe('Thought Space — 7. Strict Local-Only Privacy & Supabase Sync Exclusion', () => {
  test('Thought Space is strictly omitted from cloud sync categories metadata', () => {
    // Verify that 'thoughts' or 'thought_space' is NEVER added to SYNC_CATEGORIES_METADATA
    const categories = Object.keys(SYNC_CATEGORIES_METADATA);
    assert.strictEqual(categories.includes('thoughts' as any), false);
    assert.strictEqual(categories.includes('thought_space' as any), false);
  });

  test('selectiveSync.ts contains no upload or purge queries targeting thoughts', () => {
    const syncFilePath = path.resolve('src/lib/selectiveSync.ts');
    const content = fs.readFileSync(syncFilePath, 'utf8');

    assert.strictEqual(content.includes('.from(\'thoughts\''), false);
    assert.strictEqual(content.includes('.from(\'thought_notes\''), false);
    assert.strictEqual(content.includes('.from(\'thought_space\''), false);
  });

  test('privacy_first_schema.sql contains no tables or policies for thoughts', () => {
    const schemaFilePath = path.resolve('supabase/privacy_first_schema.sql');
    const content = fs.readFileSync(schemaFilePath, 'utf8');

    assert.strictEqual(content.includes('CREATE TABLE IF NOT EXISTS public.thoughts'), false);
    assert.strictEqual(content.includes('CREATE TABLE IF NOT EXISTS public.thought_notes'), false);
    assert.strictEqual(content.includes('CREATE TABLE IF NOT EXISTS public.thought_space'), false);
  });
});
