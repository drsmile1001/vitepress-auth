export type ServiceMap = Record<string, unknown>;

export interface ServiceResolver<T extends ServiceMap> {
  resolve<K extends keyof T>(key: K): T[K];
}

export type Factory<
  T extends ServiceMap,
  Deps extends readonly (keyof T)[],
  R,
> = (deps: { [K in Deps[number]]: T[K] }) => R;

/**
 * 完整的 DI 容器，包含註冊與解析功能。
 */
export interface ServiceContainer<
  TDeps extends ServiceMap,
  TRegs extends ServiceMap = TDeps,
> extends ServiceResolver<TDeps> {
  register<K extends string & keyof TRegs>(
    key: K,
    instance: TRegs[K]
  ): ServiceContainer<TDeps & Record<K, TRegs[K]>, Omit<TRegs, K>>;

  register<
    K extends string & keyof TRegs,
    Deps extends readonly (keyof TDeps)[],
    R extends TRegs[K],
  >(
    key: K,
    deps: Deps,
    factory: Factory<TDeps, Deps, R>
  ): ServiceContainer<TDeps & Record<K, R>, Omit<TRegs, K>>;
}
