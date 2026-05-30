export function createExecutionContext() {
  const pending: Promise<unknown>[] = [];

  return {
    pending,
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
    passThroughOnException() {},
  } as ExecutionContext & { pending: Promise<unknown>[] };
}

export function createFakeCache() {
  const store = new Map<string, Response>();

  return {
    store,
    cache: {
      async match(request: Request | string): Promise<Response | undefined> {
        const key = typeof request === 'string' ? request : request.url;
        const response = store.get(key);

        return response?.clone();
      },
      async put(request: Request | string, response: Response): Promise<void> {
        const key = typeof request === 'string' ? request : request.url;
        store.set(key, response.clone());
      },
    },
  };
}

export function createTestEnv() {
  return {
    env: {} as Record<string, never>,
  };
}

export function installFakeCaches(t: { after: (fn: () => void) => void }) {
  const { cache, store } = createFakeCache();
  const originalCaches = globalThis.caches;

  Object.defineProperty(globalThis, 'caches', {
    value: { default: cache },
    configurable: true,
    writable: true,
  });

  t.after(() => {
    if (originalCaches) {
      Object.defineProperty(globalThis, 'caches', {
        value: originalCaches,
        configurable: true,
        writable: true,
      });
      return;
    }

    Reflect.deleteProperty(globalThis, 'caches');
  });

  return { store };
}
