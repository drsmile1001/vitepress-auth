import Elysia from "elysia";

import type { AppServices } from "@/app/AppServices";
import type { ServiceResolver } from "@/utils/ServiceContainer.Interface";

export type RequestAtProviderDependency = Pick<AppServices, "SystemTime">;
export function buildRequestAtProvider(
  container: ServiceResolver<RequestAtProviderDependency>
) {
  return new Elysia({
    name: "RequestAtProvider",
  })
    .derive(() => {
      const systemTime = container.resolve("SystemTime");
      const now = systemTime.now();
      return {
        requestAt: now,
        systemTime,
      };
    })
    .as("scoped");
}
