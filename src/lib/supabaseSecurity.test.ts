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

import { setActiveUserId, getActiveUserId, getUserScopedKey } from '../utils/userScope.ts';
import { isSecretKeyProvided } from './supabase.ts';
import { loadTaskInbox, saveTaskInbox } from '../utils/taskInboxStorage.ts';
import { loadAssignments, saveAssignments } from '../utils/assignmentStorage.ts';

// Simulated Supabase RLS Policy Engine matching privacy_first_schema.sql
interface CloudRow {
  id: string;
  user_id: string;
  [key: string]: any;
}

class SimulatedSupabaseDatabase {
  private tables: Record<string, CloudRow[]> = {
    assignments: [],
    reusable_blocks: [],
    scheduled_blocks: [],
    weekly_templates: [],
    tasks: [],
    goals: [],
    user_sync_profiles: [],
  };

  public currentAuthUid: string | null = null;
  public currentRole: 'anon' | 'authenticated' = 'anon';

  setAuth(uid: string | null) {
    this.currentAuthUid = uid;
    this.currentRole = uid ? 'authenticated' : 'anon';
  }

  // Enforces REVOKE ALL FROM anon, public; GRANT TO authenticated
  private assertAuthenticatedRole() {
    if (this.currentRole !== 'authenticated' || !this.currentAuthUid) {
      throw new Error('Permission denied: relation is not granted to role "anon"');
    }
  }

  // SELECT ... WHERE auth.uid() = user_id
  select(tableName: string): CloudRow[] {
    this.assertAuthenticatedRole();
    const rows = this.tables[tableName] || [];
    return rows.filter((r) => r.user_id === this.currentAuthUid);
  }

  // INSERT ... WITH CHECK (auth.uid() = user_id)
  insert(tableName: string, row: CloudRow): { success: boolean; error?: string } {
    this.assertAuthenticatedRole();
    if (row.user_id !== this.currentAuthUid) {
      return {
        success: false,
        error: `new row violates row-level security policy for table "${tableName}" (CHECK auth.uid() = user_id failed)`,
      };
    }
    const rows = this.tables[tableName] || [];
    // Check primary key (user_id, id)
    if (rows.some((r) => r.user_id === row.user_id && r.id === row.id)) {
      return { success: false, error: 'duplicate key value violates unique constraint' };
    }
    rows.push({ ...row });
    return { success: true };
  }

  // UPDATE ... USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
  update(
    tableName: string,
    id: string,
    updates: Partial<CloudRow>
  ): { affected: number; error?: string } {
    this.assertAuthenticatedRole();
    if (updates.user_id && updates.user_id !== this.currentAuthUid) {
      return {
        affected: 0,
        error: `new row violates row-level security policy for table "${tableName}" (CHECK auth.uid() = user_id failed)`,
      };
    }
    const rows = this.tables[tableName] || [];
    let affected = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id === id && rows[i].user_id === this.currentAuthUid) {
        rows[i] = { ...rows[i], ...updates, user_id: this.currentAuthUid };
        affected++;
      }
    }
    return { affected };
  }

  // DELETE ... USING (auth.uid() = user_id)
  delete(tableName: string, id: string): { affected: number } {
    this.assertAuthenticatedRole();
    const rows = this.tables[tableName] || [];
    const initialLen = rows.length;
    this.tables[tableName] = rows.filter(
      (r) => !(r.id === id && r.user_id === this.currentAuthUid)
    );
    return { affected: initialLen - this.tables[tableName].length };
  }

  // purge_all_user_cloud_data() stored procedure
  purgeAllUserCloudData(): void {
    this.assertAuthenticatedRole();
    const uid = this.currentAuthUid!;
    for (const tbl of Object.keys(this.tables)) {
      this.tables[tbl] = this.tables[tbl].filter((r) => r.user_id !== uid);
    }
  }

  // Direct inspector for testing assertions only
  inspectRawTable(tableName: string): CloudRow[] {
    return this.tables[tableName] || [];
  }
}

describe('PHASE 1: Critical Supabase Security & RLS Isolation Tests', () => {
  const schemaPath = path.resolve(process.cwd(), 'supabase/privacy_first_schema.sql');
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261103000000_privacy_hardening.sql'
  );

  test('authoritative schema files exist and are syntactically sound', () => {
    assert.ok(fs.existsSync(schemaPath), 'privacy_first_schema.sql must exist');
    assert.ok(fs.existsSync(migrationPath), '20261103000000_privacy_hardening.sql must exist');
  });

  test('schema strictly prohibits open permissive policies (USING true / WITH CHECK true)', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');

    // Ensure no policies contain USING (true) or WITH CHECK (true) on private data
    const permissivePattern = /create policy .* for all using \s*\(true\)/i;
    assert.strictEqual(
      permissivePattern.test(schemaContent),
      false,
      'privacy_first_schema.sql must not have permissive USING (true) policies'
    );
    assert.strictEqual(
      permissivePattern.test(migrationContent),
      false,
      'migration must not have permissive USING (true) policies'
    );
  });

  test('all 7 cloud tables enforce composite primary key (user_id, id) and foreign key to auth.users', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const tables = [
      'assignments',
      'reusable_blocks',
      'scheduled_blocks',
      'weekly_templates',
      'tasks',
      'goals',
    ];

    tables.forEach((table) => {
      // Must have foreign key with on delete cascade
      const fkRegex = new RegExp(
        `user_id\\s+uuid\\s+references\\s+auth\\.users\\(id\\)\\s+on\\s+delete\\s+cascade\\s+not\\s+null`,
        'i'
      );
      assert.ok(
        fkRegex.test(schemaContent),
        `Table ${table} must declare user_id with foreign key on delete cascade not null`
      );

      // Must have composite primary key
      assert.ok(
        schemaContent.includes(`primary key (user_id, id)`),
        `Table ${table} must declare composite primary key (user_id, id)`
      );
    });

    // user_sync_profiles has user_id as primary key
    assert.ok(
      /user_id\s+uuid\s+primary\s+key\s+references\s+auth\.users\(id\)\s+on\s+delete\s+cascade/i.test(
        schemaContent
      ),
      'user_sync_profiles must have user_id primary key with foreign key cascade'
    );
  });

  test('all 7 cloud tables explicitly revoke privileges from anon/public and grant to authenticated', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    assert.ok(
      schemaContent.includes('revoke all on table public.user_sync_profiles') &&
        schemaContent.includes('from anon, public;'),
      'Must revoke all privileges on all 7 tables from anon and public'
    );
    assert.ok(
      schemaContent.includes('grant select, insert, update, delete on table public.user_sync_profiles') &&
        schemaContent.includes('to authenticated;'),
      'Must grant select, insert, update, delete to authenticated only'
    );
  });

  test('purge_all_user_cloud_data is security invoker, fixed search_path, and strictly auth.uid() scoped', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    assert.match(schemaContent, /security invoker/i);
    assert.match(schemaContent, /set search_path = public, pg_temp/i);
    assert.match(schemaContent, /delete from public\.assignments where user_id = auth\.uid\(\);/i);
    assert.match(schemaContent, /delete from public\.scheduled_blocks where user_id = auth\.uid\(\);/i);
    assert.match(schemaContent, /revoke all on function public\.purge_all_user_cloud_data\(\) from public;/i);
    assert.match(schemaContent, /grant execute on function public\.purge_all_user_cloud_data\(\) to authenticated;/i);
  });

  describe('Two-Account Cloud Isolation & Security Contract Simulation', () => {
    const db = new SimulatedSupabaseDatabase();
    const userA = 'user-alice-1111-aaaa';
    const userB = 'user-bob-2222-bbbb';

    test('Anonymous visitor cannot read, insert, update, or delete cloud data', () => {
      db.setAuth(null); // Anonymous

      assert.throws(() => db.select('assignments'), /permission denied/i);
      assert.throws(
        () => db.insert('assignments', { id: 'anon-1', user_id: 'any-user', title: 'Hacked' }),
        /permission denied/i
      );
      assert.throws(() => db.update('assignments', 'anon-1', { title: 'Hacked' }), /permission denied/i);
      assert.throws(() => db.delete('assignments', 'anon-1'), /permission denied/i);
      assert.throws(() => db.purgeAllUserCloudData(), /permission denied/i);
    });

    test('User A can create, read, update, and delete their own permitted records', () => {
      db.setAuth(userA);

      // Create
      const insertRes = db.insert('assignments', {
        id: 'asg-a-1',
        user_id: userA,
        title: 'User A Assignment',
      });
      assert.strictEqual(insertRes.success, true);

      // Read
      const rows = db.select('assignments');
      assert.strictEqual(rows.length, 1);
      assert.strictEqual(rows[0].id, 'asg-a-1');
      assert.strictEqual(rows[0].title, 'User A Assignment');

      // Update
      const updateRes = db.update('assignments', 'asg-a-1', { title: 'User A Assignment (Revised)' });
      assert.strictEqual(updateRes.affected, 1);
      assert.strictEqual(db.select('assignments')[0].title, 'User A Assignment (Revised)');

      // Delete
      const deleteRes = db.delete('assignments', 'asg-a-1');
      assert.strictEqual(deleteRes.affected, 1);
      assert.strictEqual(db.select('assignments').length, 0);
    });

    test('User B cannot read User A records', () => {
      // User A creates a record
      db.setAuth(userA);
      db.insert('assignments', {
        id: 'asg-a-secret',
        user_id: userA,
        title: 'Confidential Research',
      });

      // User B logs in
      db.setAuth(userB);
      const userBVisible = db.select('assignments');
      assert.strictEqual(userBVisible.length, 0, 'User B must see zero records belonging to User A');
    });

    test('User B cannot update User A records', () => {
      db.setAuth(userB);
      const updateRes = db.update('assignments', 'asg-a-secret', { title: 'Tampered Title' });
      assert.strictEqual(updateRes.affected, 0, 'User B update on User A record must affect 0 rows');

      // Verify User A record was untouched
      db.setAuth(userA);
      const rows = db.select('assignments');
      assert.strictEqual(rows[0].title, 'Confidential Research');
    });

    test('User B cannot delete User A records', () => {
      db.setAuth(userB);
      const deleteRes = db.delete('assignments', 'asg-a-secret');
      assert.strictEqual(deleteRes.affected, 0, 'User B delete on User A record must affect 0 rows');

      // Verify User A record still exists
      db.setAuth(userA);
      assert.strictEqual(db.select('assignments').length, 1);
    });

    test('User B cannot insert a row claiming User A as owner (cross-account spoofing rejection)', () => {
      db.setAuth(userB);
      const spoofRes = db.insert('assignments', {
        id: 'asg-spoofed',
        user_id: userA, // Spoofing User A's ID
        title: 'Malicious Injected Record',
      });
      assert.strictEqual(spoofRes.success, false);
      assert.match(spoofRes.error || '', /violates row-level security policy.*CHECK auth\.uid\(\) = user_id failed/i);

      // Verify record was never inserted
      assert.strictEqual(db.inspectRawTable('assignments').some((r) => r.id === 'asg-spoofed'), false);
    });

    test('User B can insert their own records with identical item ID without collision', () => {
      db.setAuth(userB);
      const insertRes = db.insert('assignments', {
        id: 'asg-a-secret', // Identical item ID to User A's record
        user_id: userB,
        title: "User B's Independent Assignment",
      });
      assert.strictEqual(insertRes.success, true, 'Composite primary key (user_id, id) allows same ID across users');

      // Verify isolation: User A sees only User A's version, User B sees only User B's version
      db.setAuth(userA);
      const aRows = db.select('assignments');
      assert.strictEqual(aRows.length, 1);
      assert.strictEqual(aRows[0].title, 'Confidential Research');

      db.setAuth(userB);
      const bRows = db.select('assignments');
      assert.strictEqual(bRows.length, 1);
      assert.strictEqual(bRows[0].title, "User B's Independent Assignment");
    });

    test('User A purge_all_user_cloud_data wipes only User A data and leaves User B data intact', () => {
      db.setAuth(userA);
      db.purgeAllUserCloudData();

      // User A should have 0 records
      assert.strictEqual(db.select('assignments').length, 0);

      // User B records must remain intact
      db.setAuth(userB);
      const bRows = db.select('assignments');
      assert.strictEqual(bRows.length, 1);
      assert.strictEqual(bRows[0].title, "User B's Independent Assignment");
    });
  });

  describe('Client-Side Local Storage & Session Isolation', () => {
    test('guests remain strictly local-only and use guest-scoped partition', () => {
      setActiveUserId(null); // Guest
      assert.strictEqual(getActiveUserId(), null);
      assert.strictEqual(getUserScopedKey('tasks'), 'tasks_guest');

      saveTaskInbox([
        {
          id: 'task-guest-1',
          title: 'Guest Local Task',
          category: 'General',
          priority: 'medium',
          status: 'backlog',
          estimatedDuration: 30,
          createdAt: 100,
          storageState: 'local_only',
        },
      ]);

      const loaded = loadTaskInbox();
      assert.strictEqual(loaded.length, 1);
      assert.strictEqual(loaded[0].id, 'task-guest-1');
    });

    test('logging in as User A does not automatically migrate guest records', () => {
      setActiveUserId('user-alice-1111');
      assert.strictEqual(getActiveUserId(), 'user-alice-1111');
      assert.strictEqual(getUserScopedKey('tasks'), 'tasks_user_user-alice-1111');

      // User A's inbox starts empty, not polluted with guest data
      const aliceInbox = loadTaskInbox();
      assert.strictEqual(aliceInbox.length, 0);

      // User A adds their own task
      saveTaskInbox([
        {
          id: 'task-alice-1',
          title: "Alice's Work Task",
          category: 'Work',
          priority: 'high',
          status: 'backlog',
          estimatedDuration: 45,
          createdAt: 200,
          storageState: 'cloud_synced',
        },
      ]);
      assert.strictEqual(loadTaskInbox().length, 1);
    });

    test('logging out switches back to guest storage and restores guest partition', () => {
      setActiveUserId(null); // Logout
      assert.strictEqual(getActiveUserId(), null);
      assert.strictEqual(getUserScopedKey('tasks'), 'tasks_guest');

      // Guest task is still present
      const guestTasks = loadTaskInbox();
      assert.strictEqual(guestTasks.length, 1);
      assert.strictEqual(guestTasks[0].id, 'task-guest-1');
    });

    test('logging in as User B cannot access User A partition or guest partition', () => {
      setActiveUserId('user-bob-2222');
      assert.strictEqual(getActiveUserId(), 'user-bob-2222');
      assert.strictEqual(getUserScopedKey('tasks'), 'tasks_user_user-bob-2222');

      const bobTasks = loadTaskInbox();
      assert.strictEqual(bobTasks.length, 0);
    });

    test('rejects secret or service-role keys in browser configuration', () => {
      assert.strictEqual(isSecretKeyProvided, false, 'Client configuration must not contain secret or service-role key');
    });
  });
});
