import type { KeyValuePair } from "@/utils/TypeHelper";

export type LoginSession<
  TExternalLoginSession extends KeyValuePair = KeyValuePair,
> = {
  id: string;
  userId: string;
  loginAt: Date;
  expiredAt: Date;
  providerId: string;
  externalLoginSession: TExternalLoginSession;
};

export interface LoginSessionRepo {
  set<TExternalLoginSession extends KeyValuePair>(
    session: LoginSession<TExternalLoginSession>
  ): Promise<void>;
  get<TExternalLoginSession extends KeyValuePair>(
    id: string
  ): Promise<LoginSession<TExternalLoginSession> | undefined>;
  delete(id: string): Promise<void>;
  clearExpired(): Promise<void>;
}
