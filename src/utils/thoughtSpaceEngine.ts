/**
 * Thought Space — Core Engine
 * Pure computational logic for note hierarchy, cycle prevention,
 * sorting, filtering, and portable backup validation.
 */

import {
  ThoughtNote,
  ThoughtNoteTree,
  ThoughtColor,
  ThoughtSortOption,
  ThoughtFilterOption,
  ThoughtSpaceBackup,
  ThoughtImportValidation,
  DeleteChildrenChoice,
  VALID_COLORS,
} from '../types/thoughtSpace';

export function generateThoughtId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `th_${timestamp}_${randomPart}`;
}

/**
 * Returns a set of all descendant note IDs (direct children, grandchildren, etc.)
 */
export function getDescendantIds(noteId: string, allNotes: ThoughtNote[]): Set<string> {
  const descendants = new Set<string>();
  const childrenMap = new Map<string, string[]>();

  allNotes.forEach((n) => {
    if (n.parentNoteId) {
      const list = childrenMap.get(n.parentNoteId) || [];
      list.push(n.id);
      childrenMap.set(n.parentNoteId, list);
    }
  });

  function collect(currentId: string) {
    const children = childrenMap.get(currentId) || [];
    for (const childId of children) {
      if (!descendants.has(childId)) {
        descendants.add(childId);
        collect(childId);
      }
    }
  }

  collect(noteId);
  return descendants;
}

/**
 * Validates whether `targetParentId` can be assigned as the parent for `noteId`.
 * Prevents:
 * 1. Self-parenting (noteId === targetParentId)
 * 2. Circular ancestry chains (targetParentId is already a descendant of noteId)
 */
export function canSetParent(
  noteId: string,
  targetParentId: string | null | undefined,
  allNotes: ThoughtNote[]
): boolean {
  if (!targetParentId) return true;
  if (noteId === targetParentId) return false;

  const descendants = getDescendantIds(noteId, allNotes);
  return !descendants.has(targetParentId);
}

/**
 * Resolves child note actions when a parent note is deleted.
 */
export function resolveParentDeletion(
  noteId: string,
  choice: DeleteChildrenChoice,
  allNotes: ThoughtNote[]
): { toDeleteIds: string[]; toReparent: ThoughtNote[] } {
  const directChildren = allNotes.filter((n) => n.parentNoteId === noteId);

  if (choice === 'cascade') {
    const allDescendantIds = getDescendantIds(noteId, allNotes);
    const toDeleteIds = [noteId, ...Array.from(allDescendantIds)];
    return { toDeleteIds, toReparent: [] };
  }

  // 'reparent': promote direct children to root (null parent)
  const toReparent = directChildren.map((child) => ({
    ...child,
    parentNoteId: null,
    updatedAt: Date.now(),
  }));

  return { toDeleteIds: [noteId], toReparent };
}

/**
 * Builds a nested hierarchical tree structure from a flat array of notes.
 * Orphaned notes (referencing non-existent parents) are safely placed at the root level.
 */
export function buildThoughtTree(notes: ThoughtNote[]): ThoughtNoteTree[] {
  const noteMap = new Map<string, ThoughtNote>();
  const childrenMap = new Map<string, ThoughtNote[]>();
  const allIds = new Set<string>();

  notes.forEach((n) => {
    noteMap.set(n.id, n);
    allIds.add(n.id);
  });

  notes.forEach((n) => {
    // If parent is missing or invalid, treat as root
    const parentId = n.parentNoteId && allIds.has(n.parentNoteId) && n.parentNoteId !== n.id
      ? n.parentNoteId
      : null;

    if (parentId) {
      const list = childrenMap.get(parentId) || [];
      list.push(n);
      childrenMap.set(parentId, list);
    }
  });

  function buildNode(note: ThoughtNote, depth: number): ThoughtNoteTree {
    const rawChildren = childrenMap.get(note.id) || [];
    // Sort children: pinned first, then updated_desc
    const sortedChildren = [...rawChildren].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

    const children = sortedChildren.map((c) => buildNode(c, depth + 1));
    const subnoteCount = children.reduce((sum, c) => sum + 1 + c.subnoteCount, 0);

    return {
      ...note,
      depth,
      children,
      subnoteCount,
    };
  }

  // Root notes are those with null or non-existent parent
  const rootNotes = notes.filter((n) => {
    if (!n.parentNoteId) return true;
    if (!allIds.has(n.parentNoteId)) return true; // Orphan rescue
    if (n.parentNoteId === n.id) return true; // Self-parent rescue
    return false;
  });

  return rootNotes.map((n) => buildNode(n, 0));
}

/**
 * Filters and sorts notes by query, status (active/pinned/archived), and sort order.
 */
export function filterAndSortNotes(
  notes: ThoughtNote[],
  query: string,
  filter: ThoughtFilterOption,
  sort: ThoughtSortOption
): ThoughtNote[] {
  const q = query.trim().toLowerCase();

  const filtered = notes.filter((n) => {
    // 1. Archive & Pin filter
    if (filter === 'archived') {
      if (!n.isArchived) return false;
    } else if (filter === 'pinned') {
      if (!n.isPinned || n.isArchived) return false;
    } else {
      // 'all' active notes
      if (n.isArchived) return false;
    }

    // 2. Search query matching title or body
    if (q) {
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchBody = n.body?.toLowerCase().includes(q);
      if (!matchTitle && !matchBody) return false;
    }

    return true;
  });

  // Sort
  return filtered.sort((a, b) => {
    // In 'all' view, pinned notes always appear at the top
    if (filter === 'all' && a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    if (sort === 'created_desc') {
      return b.createdAt - a.createdAt;
    }
    if (sort === 'title_asc') {
      const titleA = a.title || a.body || '';
      const titleB = b.title || b.body || '';
      return titleA.localeCompare(titleB);
    }
    // Default 'updated_desc'
    return b.updatedAt - a.updatedAt;
  });
}

/**
 * Generates an offline portable JSON export file.
 */
export function generateThoughtBackup(notes: ThoughtNote[]): string {
  const payload: ThoughtSpaceBackup = {
    app: 'BlockFlow',
    format: 'thought_space_backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    noteCount: notes.length,
    notes,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Pre-flight validation of an imported JSON file before writing any data.
 */
export function validateThoughtBackup(
  jsonString: string,
  existingNotes: ThoughtNote[]
): ThoughtImportValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const existingIds = new Set(existingNotes.map((n) => n.id));

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return {
      isValid: false,
      errors: [`Malformed JSON file: ${err.message || 'Syntax error'}`],
      warnings: [],
      totalNotes: 0,
      rootNotesCount: 0,
      subnotesCount: 0,
      duplicateIdsCount: 0,
      sanitizedNotes: [],
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      isValid: false,
      errors: ['File content is not a valid JSON object'],
      warnings: [],
      totalNotes: 0,
      rootNotesCount: 0,
      subnotesCount: 0,
      duplicateIdsCount: 0,
      sanitizedNotes: [],
    };
  }

  // Format validation
  if (parsed.format !== 'thought_space_backup' && parsed.app !== 'BlockFlow') {
    warnings.push('File does not have canonical BlockFlow Thought Space headers, but entries will be parsed if compatible.');
  }

  const rawNotes = Array.isArray(parsed.notes)
    ? parsed.notes
    : Array.isArray(parsed)
      ? parsed
      : null;

  if (!rawNotes) {
    return {
      isValid: false,
      errors: ['No notes array found in the imported file (expected "notes" field)'],
      warnings,
      totalNotes: 0,
      rootNotesCount: 0,
      subnotesCount: 0,
      duplicateIdsCount: 0,
      sanitizedNotes: [],
    };
  }

  if (rawNotes.length > 5000) {
    errors.push('File exceeds maximum supported note count of 5,000 notes.');
  }

  const sanitizedNotes: ThoughtNote[] = [];
  let duplicateIdsCount = 0;
  const seenImportIds = new Set<string>();

  rawNotes.forEach((item: any, idx: number) => {
    if (!item || typeof item !== 'object') {
      warnings.push(`Skipped invalid note at index ${idx}`);
      return;
    }

    const id = typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : generateThoughtId();

    if (seenImportIds.has(id)) {
      warnings.push(`Duplicate ID "${id}" detected in imported file; auto-assigned fresh ID.`);
    }
    seenImportIds.add(id);

    if (existingIds.has(id)) {
      duplicateIdsCount++;
    }

    const title = typeof item.title === 'string' ? item.title.slice(0, 300) : '';
    const body = typeof item.body === 'string' ? item.body.slice(0, 50000) : '';
    const color: ThoughtColor = VALID_COLORS.includes(item.color) ? item.color : 'default';
    const createdAt = typeof item.createdAt === 'number' && !isNaN(item.createdAt)
      ? item.createdAt
      : Date.now();
    const updatedAt = typeof item.updatedAt === 'number' && !isNaN(item.updatedAt)
      ? item.updatedAt
      : createdAt;
    const parentNoteId = typeof item.parentNoteId === 'string' && item.parentNoteId.trim()
      ? item.parentNoteId.trim()
      : null;

    sanitizedNotes.push({
      id,
      title,
      body,
      color,
      createdAt,
      updatedAt,
      isPinned: Boolean(item.isPinned),
      isArchived: Boolean(item.isArchived),
      parentNoteId,
    });
  });

  // Cycle check & orphan check
  const sanitizedIds = new Set(sanitizedNotes.map((n) => n.id));
  sanitizedNotes.forEach((note) => {
    if (note.parentNoteId) {
      if (!sanitizedIds.has(note.parentNoteId)) {
        warnings.push(`Note "${note.title || note.id}" references missing parent ID "${note.parentNoteId}". Assigned to top level.`);
        note.parentNoteId = null;
      } else if (!canSetParent(note.id, note.parentNoteId, sanitizedNotes)) {
        warnings.push(`Circular nesting detected for note "${note.title || note.id}". Cleared parent reference.`);
        note.parentNoteId = null;
      }
    }
  });

  const rootNotesCount = sanitizedNotes.filter((n) => !n.parentNoteId).length;
  const subnotesCount = sanitizedNotes.length - rootNotesCount;

  return {
    isValid: errors.length === 0 && sanitizedNotes.length > 0,
    errors,
    warnings,
    totalNotes: sanitizedNotes.length,
    rootNotesCount,
    subnotesCount,
    duplicateIdsCount,
    sanitizedNotes,
  };
}

/**
 * Applies imported notes to the existing notes list according to strategy.
 * - 'replace': Overwrites all existing notes with the imported notes.
 * - 'merge': Merges imported notes. If duplicate IDs exist, remaps them to fresh IDs
 *   and updates child references so no existing note is accidentally replaced.
 */
export function applyThoughtImport(
  sanitizedImportedNotes: ThoughtNote[],
  existingNotes: ThoughtNote[],
  strategy: 'merge' | 'replace'
): ThoughtNote[] {
  if (strategy === 'replace') {
    return [...sanitizedImportedNotes];
  }

  const existingMap = new Map(existingNotes.map((n) => [n.id, n]));
  const idRemap = new Map<string, string>();

  // If imported note conflicts with existing ID, generate new ID
  sanitizedImportedNotes.forEach((imp) => {
    if (existingMap.has(imp.id)) {
      const freshId = generateThoughtId();
      idRemap.set(imp.id, freshId);
    }
  });

  const remappedImports = sanitizedImportedNotes.map((imp) => {
    const finalId = idRemap.get(imp.id) || imp.id;
    const finalParentId = imp.parentNoteId
      ? idRemap.get(imp.parentNoteId) || imp.parentNoteId
      : null;

    return {
      ...imp,
      id: finalId,
      parentNoteId: finalParentId,
    };
  });

  return [...existingNotes, ...remappedImports];
}
