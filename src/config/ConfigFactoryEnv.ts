import type { TObject } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export function buildConfigFactoryEnv<TConfigSchema extends TObject>(
  schema: TConfigSchema
) {
  return () => Value.Decode(schema, Value.Clean(schema, Value.Clone(Bun.env)));
}
