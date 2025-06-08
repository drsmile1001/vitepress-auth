export type PageAccessControlEntry = {
  page: string;
  role: string[];
};

export interface PageAccessControlRepo {
  get(logicalPath: string): Promise<PageAccessControlEntry | undefined>;
}
