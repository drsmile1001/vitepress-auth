import type { IntegrationConfig, RoleConfig } from "@/config/AppConfig";
import type { IdentityResolver } from "@/services/IdentityResolver";
import type { LoginSessionRepo } from "@/services/LoginSessionRepo";
import type { PageAccessControlRepo } from "@/services/PageAccessControlRepo";
import type { ResourceClassifier } from "@/services/ResourceClassifier";
import type { SystemTime } from "@/services/SystemTime";
import type { UserRoleRepo } from "@/services/UserRoleRepo";
import type { AppInfo } from "@/utils/AppInfo";
import type { Logger } from "@/utils/Logger.Interface";

export type AppServices = {
  AppInfo: AppInfo;
  IntegrationConfig: IntegrationConfig;
  RoleConfig: RoleConfig;
  Logger: Logger;
  SystemTime: SystemTime;
  IdentityResolver: IdentityResolver;
  LoginSessionRepo: LoginSessionRepo;
  PageAccessControlRepo: PageAccessControlRepo;
  UserRoleRepo: UserRoleRepo;
  ResourceClassifier: ResourceClassifier;
};
