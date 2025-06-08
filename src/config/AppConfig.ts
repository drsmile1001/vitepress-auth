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
const getIntegrationConfigBase = buildConfigFactoryEnv(
  t.Object({
    PUBLIC_BASE_URL: t.String(),
    BASE_URL: t.String(),
    COOKIE_PREFIX: t.String(),
    COOKIE_SECURE: t.BooleanString(),
    GOOGLE_CLIENT_ID: t.String(),
    GOOGLE_CLIENT_SECRET: t.String(),
  })
);
export const getIntegrationConfig = () => {
  const base = getIntegrationConfigBase();
  return {
    ...base,
    SESSION_COOKIE_NAME: `${base.COOKIE_PREFIX}_session`,
  };
};

export type RoleConfig = ReturnType<typeof getRoleConfig>;
export const getRoleConfig = buildConfigFactoryEnv(
  t.Object({
    PUBLIC_ROLE: t.String(),
    AUTHENTICATED_ROLE: t.String(),
    ACCESS_CONTROL_FALLBACK_ROLE: t.String(),
  })
);
