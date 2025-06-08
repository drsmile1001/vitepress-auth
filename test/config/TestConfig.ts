import { t } from "elysia";

import { buildConfigFactoryEnv } from "@/config/ConfigFactoryEnv";
import { logLevelEnum } from "@/utils/Logger.Interface";

export const getTestConfig = buildConfigFactoryEnv(
  t.Object({
    TEST_LOGGER_LEVEL: logLevelEnum,
  })
);
