import { Elysia } from "elysia";

import { buildRequestMonitor } from "@/middlewares/RequestMonitor";
import { AsyncLock } from "@/utils/AsyncLock";
import { type NamedFinalizer, finalizeAll } from "@/utils/Finalizable";
import type { Logger } from "@/utils/Logger.Interface";
import { ServiceContainerDefault } from "@/utils/ServiceContainer.Default";
import type { ServiceContainer } from "@/utils/ServiceContainer.Interface";

import type { AppServices } from "./AppServices";
import {
  initializeDeploymentContext,
  initializeServiceContext,
  initializeSystemContext,
  initializeWebOnlyServiceContext,
} from "./Share";

export async function serve(baseLogger: Logger) {
  const logger = baseLogger.extend("Server");
  const { listen, finalizers } = await buildServerContext(logger);
  listen();

  const shutdownLock = new AsyncLock();
  async function shutdown(signal: string) {
    logger.info({
      event: "shutdown-signal",
      emoji: "📲",
    })`收到關閉信號：${signal}`;
    await shutdownLock.run(async () => {
      await finalizeAll(finalizers, logger);
      logger.info({
        event: "shutdown",
        emoji: "🛑",
      })`所有服務已關閉，準備退出`;
    });
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

export type ServerContext = {
  listen: () => void;
  finalizers: NamedFinalizer[];
};

export async function buildServerContext(
  logger: Logger
): Promise<ServerContext> {
  try {
    const container = ServiceContainerDefault.create<AppServices>();
    container.register("Logger", logger);
    const finalizers: NamedFinalizer[] = [];
    const moduleFinalizers = await initializeServiceContext(
      container,
      initializeSystemContext,
      initializeDeploymentContext,
      initializeWebOnlyServiceContext
    );
    const server = buildServer(container);
    finalizers.push({
      name: "Server",
      finalize: server.stop,
    });
    finalizers.push(...moduleFinalizers);
    return { listen: () => server.listen(), finalizers };
  } catch (error) {
    logger.error({ error })`伺服器組建失敗`;
    process.exit(1);
  }
}

function buildServer(container: ServiceContainer<AppServices>) {
  const logger = container.resolve("Logger").extend("Server");
  const { version, name } = container.resolve("AppInfo");
  const app = new Elysia().use(buildRequestMonitor(container)).get(
    "/",
    ({ set }) => {
      set.headers["Content-Type"] = "text/html";
      return `${name}. version ${version}  <a href="./swagger">API Docs</a>`;
    },
    { detail: { summary: "版本資訊" } }
  );

  return {
    app,
    listen: () =>
      app.listen(3000, ({ hostname, port }) => {
        logger.info({
          event: "listen",
          emoji: "🚀",
          hostname,
          port,
        })`伺服器開始聆聽，在 http://${hostname}:${port}`;
      }),
    stop: async () => {
      await app.stop();
    },
  };
}
