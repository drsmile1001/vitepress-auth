import { getLogConfig } from "@/config/AppConfig";
import { LoggerConsole } from "@/utils/Logger.Console";
import type { Logger } from "@/utils/Logger.Interface";

export function getAppLogger(): Logger {
  const { LOG_LEVEL } = getLogConfig();
  const notProduction = process.env.NODE_ENV !== "production";
  return new LoggerConsole(
    LOG_LEVEL,
    [],
    {},
    emojiMapDefault,
    notProduction,
    notProduction
  );
}

export const emojiMapDefault: Record<string, string> = {
  start: "🏁",
  done: "✅",
  error: "❌",
  retry: "🔁",
  warn: "⚠️ ",
  info: "ℹ️ ",
  trace: "🔍",
  debug: "🐛",
};
