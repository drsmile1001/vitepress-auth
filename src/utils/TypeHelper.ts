/**
 * 表示一個值可以是單一類型或該類型的陣列。
 * @template T - 任意類型
 */
export type MaybeArray<T> = T | T[];

export function maybeArrayToArray<T>(value: MaybeArray<T>): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * 表示一個值可以是同步的類型或該類型的 Promise。
 * @template T - 任意類型
 */
export type MaybePromise<T> = T | Promise<T>;

export type KeyValuePair = Record<string, unknown>;

export type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;
