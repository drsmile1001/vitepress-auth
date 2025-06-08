import type { Logger } from "./Logger.Interface";
import type { MaybePromise } from "./TypeHelper";

export type NamedFinalizer = {
  name: string;
  finalize: Finalizer;
};

export type Finalizer = () => MaybePromise<void>;
export function isNamedFinalizer(val: unknown): val is NamedFinalizer {
  return (
    typeof val === "object" &&
    val !== null &&
    typeof (val as any).finalize === "function"
  );
}

export function buildNamedFinalizer(
  name: string,
  finalize: Finalizer
): NamedFinalizer {
  return {
    name,
    finalize,
  };
}

export async function finalizeAll(
  finalizers: NamedFinalizer[],
  baseLogger: Logger
): Promise<void> {
  const logger = baseLogger.extend("Finalizer", {
    emoji: "🧹",
  });
  logger.info("釋放資源中...");
  for (const finalizer of finalizers) {
    try {
      logger.info()`釋放 ${finalizer.name} 資源`;
      await finalizer.finalize();
      logger.info()`釋放 ${finalizer.name} 資源完成`;
    } catch (error) {
      logger.error({
        error,
      })`釋放 ${finalizer.name} 資源發生錯誤`;
    }
  }
  logger.info("釋放資源完成");
}
