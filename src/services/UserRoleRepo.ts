export interface UserRoleRepo {
  get(userId: string): Promise<string[] | undefined>;
}
