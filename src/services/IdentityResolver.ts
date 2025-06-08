import type { Identity } from "@/schemas/Identity";

export const anonymous = Symbol("anonymous");
export type Anonymous = typeof anonymous;
export const unauthorized = Symbol("unauthorized");
export type Unauthorized = typeof unauthorized;

export type IdentityResolver = {
  resolve: (
    headers: Record<string, string | undefined>
  ) => Promise<Identity | Anonymous | Unauthorized>;
};
