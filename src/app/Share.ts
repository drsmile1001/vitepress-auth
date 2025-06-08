import { getIntegrationConfig } from "@/config/AppConfig";
import type { NamedFinalizer } from "@/utils/Finalizable";
import type {
  ServiceContainer,
  ServiceMap,
} from "@/utils/ServiceContainer.Interface";
import type { MaybePromise } from "@/utils/TypeHelper";

import { getAppInfo } from "../utils/AppInfo";
import type { AppServices } from "./AppServices";

export type NoDependency = {};
export type LoggerServiceContext = Pick<AppServices, "Logger">;
export type ContextInitializer<
  TDeps extends ServiceMap,
  TRegs extends ServiceMap,
> = (
  container: ServiceContainer<TDeps, TRegs>
) => Promise<InitializedModule> | InitializedModule;
export type InitializedModule = {
  name: string;
  finalize?: () => MaybePromise<void>;
};

export async function initializeServiceContext<TService extends ServiceMap>(
  container: ServiceContainer<TService>,
  ...initializers: ContextInitializer<any, any>[]
): Promise<NamedFinalizer[]> {
  const finalizers: NamedFinalizer[] = [];
  for (const initializer of initializers) {
    const result = await initializer(container);
    if (!result.finalize) continue;
    finalizers.push({
      name: result.name,
      finalize: result.finalize,
    });
  }
  return finalizers;
}

export type SystemContext = Pick<AppServices, "SystemTime">;
export const initializeSystemContext: ContextInitializer<
  NoDependency,
  SystemContext
> = async (container) => {
  const { SystemTimeReal } = await import("@/services/SystemTime.Real");
  container.register("SystemTime", new SystemTimeReal());
  return {
    name: "SystemContext",
  };
};

export type DeploymentContext = Pick<AppServices, "AppInfo">;
export const initializeDeploymentContext: ContextInitializer<
  NoDependency,
  DeploymentContext
> = async (container) => {
  container.register("AppInfo", await getAppInfo());
  return {
    name: "DeploymentContext",
  };
};

export type WebOnlyServiceContext = Pick<
  AppServices,
  "IntegrationConfig" | "IdentityResolver"
>;

export const initializeWebOnlyServiceContext: ContextInitializer<
  SystemContext & LoggerServiceContext,
  WebOnlyServiceContext
> = async (container) => {
  container.register("IntegrationConfig", getIntegrationConfig()).register(
    "IdentityResolver",
    ["Logger", "IntegrationConfig"],
    ({ Logger, IntegrationConfig }) => null! //TODO: 實作並註冊 IdentityResolver
  );
  return {
    name: "WebOnlyServiceContext",
  };
};
