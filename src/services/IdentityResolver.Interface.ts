export type Identity = {
  id: string;
  credential?: AuthCredential;
};

export type AuthCredential = {
  type: "bearer-token";
  token: string;
};

export const anonymous = Symbol("anonymous");
export type Anonymous = typeof anonymous;
export const unauthorized = Symbol("unauthorized");
export type Unauthorized = typeof unauthorized;

export type IdentityResolver = {
  resolve: (
    headers: Record<string, string | undefined>
  ) => Promise<Identity | Anonymous | Unauthorized>;
};
