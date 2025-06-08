import { getIntegrationConfig, getRoleConfig } from "@/config/AppConfig";
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
  const { SystemTimeReal } = await import("@/services/SystemTimeReal");
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
  | "IntegrationConfig"
  | "RoleConfig"
  | "LoginSessionRepo"
  | "IdentityResolver"
  | "UserRoleRepo"
  | "PageAccessControlRepo"
  | "ResourceClassifier"
>;

export const initializeWebOnlyServiceContext: ContextInitializer<
  SystemContext & LoggerServiceContext,
  WebOnlyServiceContext
> = async (container) => {
  const { LoginSessionRepoYaml } = await import(
    "@/services/LoginSessionRepoYaml"
  );
  const { UserRoleRepoYaml } = await import("@/services/UserRoleRepoYaml");
  const { IdentityResolverDefault } = await import(
    "@/services/IdentityResolverDefault"
  );
  const { PageAccessControlRepoDefault } = await import(
    "@/services/PageAccessControlRepoDefault"
  );
  const { ResourceClassifierDefault } = await import(
    "@/services/ResourceClassifierDefault"
  );
  container
    .register("IntegrationConfig", getIntegrationConfig())
    .register("RoleConfig", getRoleConfig())
    .register(
      "ResourceClassifier",
      ["IntegrationConfig"],
      ({ IntegrationConfig }) =>
        new ResourceClassifierDefault(IntegrationConfig.BASE_URL)
    )
    .register(
      "LoginSessionRepo",
      ["Logger", "SystemTime"],
      ({ Logger, SystemTime }) =>
        new LoginSessionRepoYaml(Logger, "login-sessions.yaml", SystemTime)
    )
    .register(
      "UserRoleRepo",
      ["Logger"],
      ({ Logger }) => new UserRoleRepoYaml(Logger, "user-roles.yaml")
    )
    .register(
      "IdentityResolver",
      ["Logger", "IntegrationConfig", "LoginSessionRepo", "SystemTime"],
      ({ Logger, IntegrationConfig, LoginSessionRepo, SystemTime }) =>
        new IdentityResolverDefault(
          IntegrationConfig.SESSION_COOKIE_NAME,
          LoginSessionRepo,
          SystemTime,
          Logger
        )
    )
    .register(
      "PageAccessControlRepo",
      ["Logger", "IntegrationConfig", "RoleConfig"],
      ({ Logger, IntegrationConfig, RoleConfig }) =>
        new PageAccessControlRepoDefault(
          Logger,
          IntegrationConfig.BASE_URL,
          RoleConfig.ACCESS_CONTROL_FALLBACK_ROLE
        )
    );
  return {
    name: "WebOnlyServiceContext",
  };
};
