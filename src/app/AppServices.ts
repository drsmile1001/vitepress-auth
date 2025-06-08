import type { IntegrationConfig } from "@/config/AppConfig";
import type { IdentityResolver } from "@/services/IdentityResolver.Interface";
import type { SystemTime } from "@/services/SystemTime.Interface";
import type { AppInfo } from "@/utils/AppInfo";
import type { Logger } from "@/utils/Logger.Interface";

export type AppServices = {
  AppInfo: AppInfo;
  IntegrationConfig: IntegrationConfig;
  Logger: Logger;
  SystemTime: SystemTime;
  IdentityResolver: IdentityResolver;
};
