import Elysia from "elysia";

import type { AppServices } from "@/app/AppServices";
import { unauthorized } from "@/services/IdentityResolver";
import type { ServiceResolver } from "@/utils/ServiceContainer.Interface";

export type IdentityProviderDependency = Pick<AppServices, "IdentityResolver">;

export function buildRequesterProvider(
  container: ServiceResolver<IdentityProviderDependency>
) {
  return new Elysia({
    name: "RequesterProvider",
  })
    .derive(async ({ headers, status }) => {
      const resolver = container.resolve("IdentityResolver");
      const requester = await resolver.resolve(headers);
      if (requester === unauthorized) throw status(401);
      return {
        requester,
      };
    })
    .as("scoped");
}
