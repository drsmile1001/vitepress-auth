export interface Lazy<T> {
  get(): Promise<T>;
}

export function lazy<T>(fn: () => Promise<T>): Lazy<T> {
  let instance: T | null = null;
  return {
    get: async () => {
      if (instance === null) {
        instance = await fn();
      }
      return instance;
    },
  };
}

export function lazyMap<TItem, TKey extends string>(
  fn: (key: TKey) => TItem | Promise<TItem>
) {
  let records: Record<string, TItem> = {};
  return {
    get: async (key: TKey) => {
      if (!records[key]) {
        records[key] = await fn(key);
      }
      return records[key];
    },
  };
}
