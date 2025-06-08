import Elysia from "elysia";

import { ElysiaCustomStatusResponse } from "elysia/error";
import { ulid } from "ulid";

import type { AppServices } from "@/app/AppServices";
import type { Logger } from "@/utils/Logger.Interface";
import type { ServiceResolver } from "@/utils/ServiceContainer.Interface";

export type RequestMonitorDependency = Pick<AppServices, "Logger">;
export function buildRequestMonitor(
  container: ServiceResolver<RequestMonitorDependency>
) {
  const logger = container.resolve("Logger");
  const fallbackLogger = logger.extend("Monitor");
  function logResponse(
    ctx: {
      store: {};
    },
    method: string,
    path: string,
    status: string | number
  ): Logger {
    const { beforeTime, logger } = ctx.store as {
      beforeTime: bigint;
      logger: Logger;
    };
    const useLogger = logger ?? fallbackLogger;
    const afterTime = process.hrtime.bigint();
    const duration = Number(afterTime - beforeTime) / 1_000_000; // ns to ms
    useLogger.info({
      event: "responded",
      emoji: "⬅️ ",
      durationMs: duration,
      status: status,
    })`${method} ${path} ${duration} ms ${status}`;
    return useLogger;
  }

  return new Elysia({
    name: "RequestMonitor",
  })
    .onRequest((ctx) => {
      const url = new URL(ctx.request.url);
      const { pathname } = url;
      const requestLogger = logger.extend("Request", {
        rid: ulid(),
        method: ctx.request.method,
        path: pathname,
      });
      requestLogger.info({
        event: "received",
        emoji: "➡️ ",
      })`${ctx.request.method} ${pathname}`;
      ctx.store = {
        beforeTime: process.hrtime.bigint(),
        logger: requestLogger,
      };
    })
    .onAfterResponse((ctx) => {
      logResponse(ctx, ctx.request.method, ctx.path, ctx.set.status ?? 200);
    })
    .onError((ctx) => {
      const errorResponse = ctx.error as ElysiaCustomStatusResponse<
        number,
        unknown
      >;
      if (errorResponse.code && errorResponse.response) {
        logResponse(ctx, ctx.request.method, ctx.path, errorResponse.code);
        return;
      }
      switch (ctx.code) {
        case "NOT_FOUND":
          logResponse(ctx, ctx.request.method, ctx.path, 404); //XXX NOT_FOUND 沒有進到 onAfterResponse
          return;
        case "VALIDATION":
        case "INVALID_COOKIE_SIGNATURE":
        case "INVALID_FILE_TYPE":
        case "PARSE":
          return;
        default:
          logger.error(
            { error: ctx.error, event: "onError" },
            "server 內部錯誤"
          );
          return "Internal Server Error";
      }
    })
    .as("global");
}

export function buildRequestLoggerProvider(
  container: ServiceResolver<RequestMonitorDependency>
) {
  const baseLogger = container.resolve("Logger");
  return new Elysia({
    name: "RequestLoggerProvider",
  })
    .derive(({ store, request, path }) => {
      const loggerInStore = (store as any).logger as Logger | undefined;
      return {
        logger:
          loggerInStore ??
          baseLogger.extend("Request", {
            rid: ulid(),
            method: request.method,
            path,
          }),
      };
    })
    .as("scoped");
}
