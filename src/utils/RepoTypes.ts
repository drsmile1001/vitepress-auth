export type Creating<T, Keys extends keyof T> = Omit<T, Keys> & {
  [K in Keys]?: T[K]; // 創建操作時，指定 ID 欄位為可選。
};

export type Updating<T, RequiredKeys extends keyof T> = Partial<T> &
  Pick<T, RequiredKeys>;

export type DeletingWithVersion<T, RequiredKeys extends keyof T> = Pick<
  T,
  RequiredKeys
>;

export type QueryPagination = {
  skip?: number; // 跳過的資料數量，用於分頁。
  take?: number; // 取得的資料數量，用於分頁。
};

export const saved = Symbol("saved"); // 表示操作成功的常數。
export const failed = Symbol("failed"); // 表示操作失敗的常數。

export type Saved = typeof saved; // 成功操作的型別。
export type Failed = typeof failed; // 失敗操作的型別。

export type SaveResult<TFailed = Failed> = typeof saved | TFailed; // 統一操作結果的型別，支援自定義失敗型別。
