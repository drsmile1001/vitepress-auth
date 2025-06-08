import type { MaybePromise } from "elysia";

export interface TestContext {
  finalize?: () => MaybePromise<void>;
  [key: string]: unknown;
}

export function withContext<TContext extends TestContext>(
  contextBuilder: () => MaybePromise<TContext>,
  run: (context: TContext) => MaybePromise<void>
): () => Promise<void> {
  return async () => {
    const context = await contextBuilder();
    try {
      await run(context);
    } finally {
      try {
        await context.finalize?.();
      } catch (error) {
        console.error("🧨 finalize 發生例外：", error);
        throw error;
      }
    }
  };
}
