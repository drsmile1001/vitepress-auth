import { t } from "elysia";

import { logLevelEnum } from "@/utils/Logger.Interface";

import { buildConfigFactoryEnv } from "./ConfigFactoryEnv";

export type LogConfig = ReturnType<typeof getLogConfig>;
export const getLogConfig = buildConfigFactoryEnv(
  t.Object({
    LOG_LEVEL: t.Optional(logLevelEnum),
  })
);

export type IntegrationConfig = ReturnType<typeof getIntegrationConfig>;
export const getIntegrationConfig = buildConfigFactoryEnv(
  t.Object({
    PUBLIC_BASE_URL: t.String(),
    BASE_URL: t.String(),
  })
);
