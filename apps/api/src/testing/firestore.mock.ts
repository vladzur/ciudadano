/**
 * Helper para crear mocks encadenables de Firestore en tests unitarios.
 * Simula un almacén en memoria con la API del Admin SDK que usan los repositorios.
 */

/** Fecha fija usada al convertir sentinelas de serverTimestamp en los mocks */
const DEFAULT_NOW = "2025-01-01T00:00:00Z";

export interface MockSnapshot {
  id: string;
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}

export interface MockQuery {
  where(field: string, op: string, value: unknown): MockQuery;
  orderBy(field: string, dir?: string): MockQuery;
  limit(n: number): MockQuery;
  startAfter(doc: MockSnapshot): MockQuery;
  get(): Promise<{ docs: MockSnapshot[]; empty: boolean; size: number }>;
  count(): { get(): Promise<{ data(): { count: number } }> };
}

export interface MockDocRef {
  id: string;
  get(): Promise<MockSnapshot>;
  set(data: Record<string, unknown>): Promise<void>;
  update(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  collection(name: string): MockCollectionRef;
}

export interface MockCollectionRef extends MockQuery {
  doc(id?: string): MockDocRef;
}

export interface MockFirestore {
  collection(name: string): MockCollectionRef;
  /** Almacén interno (collPath -> docId -> data) para inspección en tests */
  __store: Map<string, Map<string, Record<string, unknown>>>;
}

/** Timestamp falso compatible con el mapeo `toDate().toISOString()` */
export function mockTimestamp(iso: string): { toDate(): Date } {
  return { toDate: () => new Date(iso) };
}

/** Snapshot falso de documento existente */
export function mockSnapshot(
  id: string,
  data: Record<string, unknown>
): MockSnapshot {
  return { id, exists: true, data: () => data };
}

/** Crea un mock de Firestore con almacén en memoria */
export function createMockFirestore(): MockFirestore {
  const store = new Map<string, Map<string, Record<string, unknown>>>();
  let autoId = 0;

  /** Detecta sentinelas de FieldValue (p. ej. serverTimestamp) en la versión instalada */
  function isFirestoreSentinel(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) return false;
    return Object.keys(value).length === 0;
  }

  /** Convierte sentinelas de FieldValue.serverTimestamp() en timestamps de prueba */
  function sanitize(value: unknown): unknown {
    if (value && typeof value === "object") {
      if (isFirestoreSentinel(value)) {
        return mockTimestamp(DEFAULT_NOW);
      }
      const out: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(value as object)) {
        out[key] = sanitize(entry);
      }
      return out;
    }
    return value;
  }

  function makeQuery(collPath: string): MockQuery {
    // Emula limit y startAfter para que las pruebas de paginación sean significativas
    let limitN: number | undefined;
    let afterId: string | undefined;
    const query: MockQuery = {
      where: jest.fn(() => query),
      orderBy: jest.fn(() => query),
      limit: jest.fn((n: number) => {
        limitN = n;
        return query;
      }),
      startAfter: jest.fn((doc: MockSnapshot) => {
        afterId = doc.id;
        return query;
      }),
      get: jest.fn(async () => {
        let entries = Array.from(store.get(collPath)?.entries() ?? []);
        if (afterId !== undefined) {
          const index = entries.findIndex(([id]) => id === afterId);
          entries = index >= 0 ? entries.slice(index + 1) : [];
        }
        if (limitN !== undefined) {
          entries = entries.slice(0, limitN);
        }
        const docs = entries.map(([id, data]) => mockSnapshot(id, data));
        return { docs, empty: docs.length === 0, size: docs.length };
      }),
      count: jest.fn(() => ({
        get: jest.fn(async () => ({
          data: () => ({ count: store.get(collPath)?.size ?? 0 }),
        })),
      })),
    };
    return query;
  }

  function makeDocRef(collPath: string, id: string): MockDocRef {
    return {
      id,
      get: jest.fn(async () => {
        const data = store.get(collPath)?.get(id);
        if (data === undefined) {
          return { id, exists: false, data: () => undefined };
        }
        return mockSnapshot(id, data);
      }),
      set: jest.fn(async (data: Record<string, unknown>) => {
        if (!store.has(collPath)) store.set(collPath, new Map());
        store
          .get(collPath)!
          .set(id, sanitize(data) as Record<string, unknown>);
      }),
      update: jest.fn(async (data: Record<string, unknown>) => {
        const existing = store.get(collPath)?.get(id) ?? {};
        const merged = {
          ...existing,
          ...(sanitize(data) as Record<string, unknown>),
        };
        if (!store.has(collPath)) store.set(collPath, new Map());
        store.get(collPath)!.set(id, merged);
      }),
      delete: jest.fn(async () => {
        store.get(collPath)?.delete(id);
      }),
      collection: jest.fn((name: string) =>
        makeCollection(`${collPath}/${id}/${name}`)
      ),
    };
  }

  function makeCollection(collPath: string): MockCollectionRef {
    const collection = makeQuery(collPath) as MockCollectionRef;
    collection.doc = jest.fn((id?: string) =>
      makeDocRef(collPath, id ?? `auto-${++autoId}`)
    );
    return collection;
  }

  return {
    collection: jest.fn((name: string) => makeCollection(name)),
    __store: store,
  };
}
