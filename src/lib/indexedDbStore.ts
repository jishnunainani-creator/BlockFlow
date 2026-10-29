/**
 * IndexedDB Local-First Persistence Engine
 * Provides structured storage for productivity records with zero external dependencies
 * and seamless fallback to memory/localStorage in non-browser or restricted contexts.
 */

const DB_NAME = 'BlockFlow_LocalDB_v1';
const DB_VERSION = 2;

export const STORE_NAMES = [
  'tasks',
  'assignments',
  'goals',
  'scheduled_blocks',
  'library_blocks',
  'templates',
  'focus_logs',
  'reflections',
  'sync_settings',
  'thoughts',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase | null> | null = null;

// In-memory fallback for environments without IndexedDB (e.g., node test runners, restricted private mode)
const memoryStores: Record<string, Map<string, any>> = {};
STORE_NAMES.forEach((name) => {
  memoryStores[name] = new Map();
});

function isIndexedDBAvailable(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.indexedDB !== 'undefined' &&
      window.indexedDB !== null
    );
  } catch {
    return false;
  }
}

/**
 * Initializes and opens the IndexedDB database.
 */
export async function getLocalDatabase(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) {
    return null;
  }

  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        STORE_NAMES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            if (storeName === 'sync_settings') {
              db.createObjectStore(storeName, { keyPath: 'key' });
            } else {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          }
        });
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onerror = (err) => {
        console.warn('[IndexedDB] Failed to open database, falling back to memory/localStorage:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('[IndexedDB] Initialization exception:', e);
      resolve(null);
    }
  });

  return initPromise;
}

/**
 * Retrieves all items from a given store.
 */
export async function idbGetAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await getLocalDatabase();

  if (!db) {
    // Fallback to memory
    return Array.from(memoryStores[storeName].values()) as T[];
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => {
        resolve(Array.from(memoryStores[storeName].values()) as T[]);
      };
    } catch {
      resolve(Array.from(memoryStores[storeName].values()) as T[]);
    }
  });
}

/**
 * Retrieves a single item by ID from a given store.
 */
export async function idbGet<T>(storeName: StoreName, key: string): Promise<T | null> {
  const db = await getLocalDatabase();

  if (!db) {
    return (memoryStores[storeName].get(key) as T) || null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => resolve((memoryStores[storeName].get(key) as T) || null);
    } catch {
      resolve((memoryStores[storeName].get(key) as T) || null);
    }
  });
}

/**
 * Saves or updates an item in the given store.
 */
export async function idbPut<T extends Record<string, any>>(
  storeName: StoreName,
  item: T
): Promise<void> {
  const key = item.id || item.key;
  if (key) {
    memoryStores[storeName].set(key, item);
  }

  const db = await getLocalDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('IndexedDB put failed'));
      tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Deletes an item by ID from a given store.
 */
export async function idbDelete(storeName: StoreName, key: string): Promise<void> {
  memoryStores[storeName].delete(key);

  const db = await getLocalDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('IndexedDB delete failed'));
      tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Clears all records from a given store.
 */
export async function idbClear(storeName: StoreName): Promise<void> {
  memoryStores[storeName].clear();

  const db = await getLocalDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
